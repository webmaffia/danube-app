// What the Property Advisor says when the customer opens a screen themselves,
// so the voice always matches what's on screen. Scripted, and built only from
// app data, so every figure is exact. When the advisor itself opened the
// screen (a `show` call), its own reply covers it and none of this is said.

import { entryTicket, findUnit, getProject, getUnits, type Unit, type UnitOverrides } from "@/lib/inventory";
import { aedShort } from "@/lib/journey";
import { TOKEN_AMOUNT } from "@/lib/knowledge";

export interface ScreenCue {
  /** Stop what the avatar was saying about the previous screen. */
  interrupt: boolean;
  /** A line for this screen, if it has one. */
  line: string | null;
}

interface CueState {
  firstName: string | null;
  booking: { unit_no: string; status: "initiated" | "paid" } | null;
  kycDone: boolean;
  /** The next payment-schedule step still to do; null when all are done. Omitted when unknown. */
  plan?: string | null;
}

export function screenCue(path: string, s: CueState): ScreenCue {
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "agent" || parts.length === 0) return { interrupt: false, line: null };

  if (parts[0] === "units") {
    if (parts.length === 1) {
      return {
        interrupt: true,
        line: `Here are the projects I'd recommend${s.firstName ? `, ${s.firstName}` : ""}. Bayz 102 is my top pick for you. Tap Explore to take a closer look.`,
      };
    }
    const project = getProject(parts[1]);
    if (!project) return { interrupt: true, line: null };
    if (parts[2] === "map") {
      return {
        interrupt: true,
        line: `This is the unit map for ${project.name}. Each row is a ${project.community ? "street of homes" : "floor"}. Units with a blue border are available, the hatched ones are already sold. Tap any unit to see its size, ${project.community ? "row" : "floor"}, view and price.`,
      };
    }
    // The project page narrates its own films; a page without films gets a line.
    if (project.videos?.length) return { interrupt: false, line: null };
    const units = getUnits(project.id);
    const available = units.filter((u) => u.status === "available").length;
    const briefing = projectBriefing(project.id, available, units.length, entryTicket(project));
    return {
      interrupt: true,
      line: `Here's ${project.name}. ${briefing ?? "Take a look at the details, and I'll take you to the units whenever you're ready."}`,
    };
  }

  if (parts[0] === "money") {
    return {
      interrupt: true,
      line: "Here's how Danube's payment plan works for this unit. Move the sliders to try a different down payment or plan length, and the monthly instalment updates as you go.",
    };
  }

  if (parts[0] === "booking") {
    if (parts[1] === "plan") {
      if (!s.booking || s.booking.status !== "paid") return { interrupt: true, line: "The payment schedule opens once your token is paid. Let's finish the booking first." };
      if (!s.kycDone) return { interrupt: true, line: "The payment schedule opens after KYC. Let's finish your KYC first." };
      const said: Record<string, string> = {
        down: "Your KYC is done. Next is the balance of your down payment. Tap the button to pay it, and I'll take you through what follows.",
        spa: "Your down payment is complete. Next is the sales and purchase agreement. Tap the button to sign it.",
        oqood: "Your agreement is signed. Next is Oqood registration, which registers your purchase with the Dubai Land Department. Tap the button when you're ready.",
        monthly: "Only your first monthly instalment is left. Pay it and your 1% payment plan is running.",
      };
      const line =
        s.plan === undefined
          ? "These are your remaining steps. We take them one at a time, in order."
          : s.plan === null
            ? "Every step is done, and your unit is registered. That completes your booking."
            : (said[s.plan] ?? null);
      return { interrupt: true, line };
    }
    if (parts[1] === "kyc") {
      return {
        interrupt: true,
        line: s.kycDone
          ? "Your KYC is complete. Next is your payment schedule."
          : "This is a quick KYC. It takes about two minutes: your Emirates ID or passport, your address and a short selfie check.",
      };
    }
    if (!s.booking) return { interrupt: true, line: "Pick a unit on the map, and I'll hold it for you." };
    return {
      interrupt: true,
      line:
        s.booking.status === "paid"
          ? `Unit ${s.booking.unit_no} is held for you. Here's your confirmation and what happens next.${s.kycDone ? "" : " Your next step is KYC."}`
          : `Here's your booking summary for unit ${s.booking.unit_no}. Choose how you'd like to pay the ${aedShort(TOKEN_AMOUNT)} token, and the unit is held for you.`,
    };
  }

  return { interrupt: true, line: null };
}

/**
 * A spoken walk through one project, built only from app data: where it is, what
 * it costs, when it's ready, how far things are and what's in it. It ends with a
 * question so the customer is drawn into the conversation, not just talked at.
 */
export function projectBriefing(projectId: string, available: number, total: number, entryAmount: number, withQuestion = true): string | null {
  const project = getProject(projectId);
  if (!project) return null;
  const soldOut = project.availability === "sold_out";
  const parts: string[] = [`It's in ${project.location}.`];
  if (project.hook) parts.push(/[.!?]$/.test(project.hook) ? project.hook : `${project.hook}.`);
  if (entryAmount > 0) parts.push(`${soldOut ? "It was from" : "It starts from"} ${aedShort(entryAmount)}, with handover in ${project.handover}.`);
  else parts.push(`Handover is ${project.handover}.`);
  if (!soldOut) {
    parts.push(
      project.plan.confirmed
        ? `You can pay over time: about ${project.plan.downPct}% down, then 1% a month while it's built, and the rest on handover.`
        : "You can pay over time with Danube's 1% monthly plan, though the exact terms for this project are indicative, so we'd confirm them with the sales team.",
    );
  }
  const near = [...project.connectivity].sort((a, b) => a.minutes - b.minutes).slice(0, 2);
  if (near.length) parts.push(`${near.map((c) => `${c.label} is ${c.minutes} minutes away`).join(", and ")}.`);
  const highlights = project.features.slice(0, 3);
  if (highlights.length) parts.push(`Highlights include ${highlights.slice(0, -1).join(", ")}${highlights.length > 1 ? " and " : ""}${highlights[highlights.length - 1]}.`);
  if (soldOut) {
    parts.push("It's sold out now" + (withQuestion ? ", but I can show you a similar project that still has units. Would you like that?" : "."));
  } else {
    parts.push(available <= 5 ? `Only ${available} of ${total} units are left.` : `${available} of ${total} units are still available.`);
    if (withQuestion) parts.push("What matters most to you here: the location, the amenities, or the payment plan? Tell me, and I'll go into detail.");
  }
  return parts.join(" ");
}

/**
 * What the Property Advisor says when the customer comes back to a project page
 * they've already had the tour of (Back from the map, say). Built from app
 * data; it moves them toward the units and invites a question.
 */
export function projectReturnLine(name: string, available: number, total: number, entryAmount: number, firstName: string | null): string {
  const scarcity =
    available === 0
      ? "Every unit here is taken right now, but I can tell you about a similar project."
      : available <= 5
        ? `Only ${available} of ${total} units are still available, so they won't last long.`
        : `${available} of ${total} units are still available.`;
  const cta = available === 0 ? "Want me to show you the alternatives?" : "Shall I take you to the unit map so you can pick yours, or is there anything you'd like to ask first?";
  return `Welcome back${firstName ? `, ${firstName}` : ""}. ${name} starts from ${aedShort(entryAmount)}. ${scarcity} ${cta}`;
}

/** What the Property Advisor says when the customer taps a unit on the map. */
export function unitLine(unitId: string, overrides: UnitOverrides = {}): string | null {
  const unit: Unit | undefined = findUnit(unitId, overrides);
  if (!unit) return null;
  const project = getProject(unit.projectId);
  const place = project?.community ? `in row ${unit.floor}` : `on floor ${unit.floor}`;
  const extras = [unit.isCorner && "a corner unit"].filter(Boolean).join(" and ");
  const status =
    unit.status === "available" ? "It's available. Shall I hold it for you?" : unit.status === "held" ? "It's on hold right now." : "This one is already sold.";
  return `${unit.unitNo} is a ${unit.layout.toLowerCase()}, ${unit.sizeSqft.toLocaleString("en-US")} square feet, ${place} with a ${unit.view.toLowerCase()} view${extras ? `, ${extras}` : ""}, at ${aedShort(unit.price)}. ${status}`;
}
