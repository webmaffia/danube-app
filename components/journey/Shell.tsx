"use client";

// The spine of the journey. It stays mounted across every journey route, so
// the avatar session, the conversation and the composer persist while screens
// change underneath. When the agent calls `show`, the shell navigates. When
// the customer navigates, the shell tells the store, and the screen goes back
// to the agent as context on the next turn.
//
// Two views:
// - the advisor (/agent): the avatar full screen, live-stream style, or the
//   chat transcript
// - the app screens: the avatar shrinks to a tile in the corner (or, in chat,
//   the advisor's latest line docks above the input); minimising the advisor
//   lands here, and tapping the tile or the dock goes back

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { nextPlanStep, useSession } from "@/lib/store";
import { avatar, useAvatar } from "@/lib/avatar/controller";
import { flushScroll, requestScroll } from "@/lib/maps";
import { routeFor, screenFromPath, VIEW_LABEL, type View } from "@/lib/journey";
import { findUnit } from "@/lib/inventory";
import { AvatarStage } from "@/components/agent/AvatarStage";
import { Transcript } from "@/components/agent/Transcript";
import { Composer } from "@/components/agent/Composer";
import { LiveOverlay } from "@/components/agent/LiveOverlay";
import { BackIcon, MinimizeIcon, PhoneIcon } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { screenCue } from "@/lib/avatar/screen-lines";
import { FindingOverlay } from "@/components/journey/FindingOverlay";

// Next steps on the property page: the unit map first, then the questions
// buyers usually ask about a project.
const SHOW_UNITS = "Take me to the units";
const BOOK_UNIT = "Book this unit";
const SEE_PLAN = "See payment plan";

const TRAIL_KEY = "danube-trail";

function readTrail(): string[] {
  try {
    const v = JSON.parse(sessionStorage.getItem(TRAIL_KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function saveTrail(v: string[]): void {
  try {
    sessionStorage.setItem(TRAIL_KEY, JSON.stringify(v.slice(-50)));
  } catch {}
}

/** One level up, for Back when there's no earlier screen in this session. */
function parentOf(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "units" && parts[2] === "map") return `/units/${parts[1]}`;
  if (parts[0] === "units" && parts[1]) return "/units";
  // The booking journey steps back the way it came: payment schedule → KYC → booking → units.
  if (parts[0] === "booking" && parts[1] === "plan") return "/booking/kyc";
  if (parts[0] === "booking" && parts[1] === "kyc") return "/booking";
  if (parts[0] === "booking" || parts[0] === "money") {
    const unit = useSession.getState().selectedUnit;
    const project = (unit && findUnit(unit)?.projectId) || "bayz102";
    return `/units/${project}/map`;
  }
  return "/agent";
}
const PROJECT_NEXT_STEPS = [
  SHOW_UNITS,
  "What's the price range?",
  "Is it RERA registered?",
  "When is handover?",
  "What amenities are there?",
  "How far is the metro?",
  "What's the payment plan?",
];
// Chips for the post-KYC steps, keyed by the step that's next.
const PLAN_CHIPS: Record<string, string[]> = {
  down: ["Take me to the down payment", "What happens next?"],
  spa: ["Sign my agreement", "What is the sales agreement?"],
  oqood: ["Register with Oqood", "What is Oqood?"],
  monthly: ["Take me to my first instalment", "How do the monthly payments work?"],
  done: [],
};
// With the avatar off, these next steps open their screen directly instead of
// asking the advisor to do it.
const DIRECT_ROUTES: Record<string, string> = {
  "How do I pay the token?": "/booking",
  "Start my KYC": "/booking/kyc",
  "Continue to my payment schedule": "/booking/plan",
  "Take me to the down payment": "/booking/plan",
  "Sign my agreement": "/booking/plan",
  "Register with Oqood": "/booking/plan",
  "Take me to my first instalment": "/booking/plan",
};
const noopSubscribe = () => () => {};

export function JourneyShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // sessionStorage only exists in the browser, so render after hydration.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const { turns, busy, error, profile, send, requestHuman, screen, screenSeq, selectedUnit, overrides, onboarding, booking, kyc, plan } = useSession();
  const { mode, note, liveEnabled, dismissed } = useAvatar();
  const showPills = true; // the toggle is gone: the advisor's checks always show
  const greeted = useRef(false);
  const lastSeq = useRef(screenSeq);
  /**
   * The screens visited in this tab, oldest first, mirroring the browser's own
   * history. Kept in sessionStorage so a refresh doesn't forget where the
   * customer came from.
   */
  const trail = useRef<string[] | null>(null);
  /** Set when the browser moved through its history (Back, or the phone's back). */
  const popped = useRef(false);
  const content = useRef<HTMLDivElement>(null);
  const lastScreenPath = useRef<string | null>(null);
  /** The route the Property Advisor itself navigated to, so its own reply covers it. */
  const agentNav = useRef<string | null>(null);

  const onScreen = pathname !== "/agent";
  // A closed avatar leaves the advisor page as plain chat.
  const immersive = !onScreen && mode === "avatar" && !dismissed;

  // Boot: bind the avatar to the conversation, warm it, greet once.
  useEffect(() => {
    if (!mounted) return;
    if (!useSession.getState().profile.name) {
      router.replace("/register");
      return;
    }
    avatar.bind({ send: (t) => void useSession.getState().send(t), abort: () => useSession.getState().abort() });
    void avatar.warm();
    // Greet on the next tick, so React's dev double-mount (mount, unmount,
    // mount) can't flush the intro out of the avatar's queue before it's said.
    const greet = setTimeout(() => {
      const s = useSession.getState();
      if (greeted.current || s.turns.length > 0 || s.busy) return;
      greeted.current = true;
      s.startOnboarding();
    }, 0);
    return () => {
      clearTimeout(greet);
      avatar.shutdown();
    };
  }, [mounted, router]);

  // The agent asked for a screen: go there. Nobody clicked anything.
  useEffect(() => {
    if (screenSeq === lastSeq.current) return;
    lastSeq.current = screenSeq;
    if (!screen) return;
    const target = routeFor(screen);
    if (screen.view === "location") requestScroll("location");
    if (target !== pathname) {
      agentNav.current = target;
      router.push(target);
    } else flushScroll();
  }, [screenSeq, screen, pathname, router]);

  useEffect(() => {
    const onPop = () => (popped.current = true);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // The customer navigated: record what they're looking at, and start the
  // new screen at the top (the scroll container outlives the route).
  useEffect(() => {
    const s = useSession.getState();
    trail.current ??= readTrail();
    const v = trail.current;
    // Back never opens the full-screen advisor. If the browser's history moved
    // onto the advisor entry, step past it to the screen before, or stay put.
    if (popped.current && pathname === "/agent" && lastScreenPath.current) {
      if (v.lastIndexOf("/agent", v.length - 2) >= 1) window.history.go(-1);
      else {
        popped.current = false;
        router.replace(lastScreenPath.current);
      }
      return;
    }
    s.setScreen(screenFromPath(pathname, s.selectedUnit));
    if (pathname !== "/agent") lastScreenPath.current = pathname;
    // A history move onto the screen before the last one is a step back (the
    // arrow, or the phone's own back); anything else is a step forward.
    // Back may skip several entries (the advisor page is never a Back target),
    // so cut the trail down to wherever the history landed.
    const at = popped.current ? v.lastIndexOf(pathname, v.length - 2) : -1;
    popped.current = false;
    if (at >= 0) v.length = at + 1;
    else if (v[v.length - 1] !== pathname) v.push(pathname);
    saveTrail(v);
    content.current?.scrollTo({ top: 0 });

    // Keep the voice on the screen. If the Property Advisor opened this screen,
    // its reply is already about it. Otherwise the customer did: stop talking
    // about the last screen, drop any reply still coming about it, and say a
    // line about this one (unless a tap here just asked the advisor something).
    if (agentNav.current === pathname) {
      agentNav.current = null;
      return;
    }
    agentNav.current = null;
    const cue = screenCue(pathname, {
      firstName: s.profile.name?.split(" ")[0] ?? null,
      booking: s.booking && { unit_no: s.booking.unit_no, status: s.booking.status },
      kycDone: Boolean(s.kyc),
      plan: nextPlanStep(s.plan),
    });
    const lastTurn = s.metrics[s.metrics.length - 1];
    const askedJustNow = s.busy && lastTurn && Date.now() - lastTurn.startedAt < 1500;
    if (pathname !== "/agent" && s.busy && !askedJustNow) s.abort();
    // The finding screen's narration must finish first; it would be cut off by the new screen's line.
    if (!askedJustNow && s.findingSince == null) {
      if (cue.interrupt) avatar.interrupt();
      if (cue.line && !s.onboarding) avatar.speak(cue.line);
    }
  }, [pathname]);

  if (!mounted || !profile.name) return <div className="h-full" />;

  const last = turns[turns.length - 1];
  // On the property page the chips are the next steps, led by the unit map.
  const onProject = onScreen && screen?.view === "project";
  // Screens with a pinned CTA bar: the avatar tile lifts above it and the page needs no bottom padding.
  const pinnedBar =
    onProject || (onScreen && (screen?.view === "calculator" || screen?.view === "booking" || screen?.view === "kyc" || screen?.view === "plan"));
  // Screens that speak for themselves: no Property Advisor strip with its latest line.
  const hideDock =
    onProject || (onScreen && (screen?.view === "recommendations" || screen?.view === "units" || screen?.view === "unit" || screen?.view === "booking" || screen?.view === "kyc" || screen?.view === "plan"));
  // On the unit map, a selected unit that's free to book leads with "Book this unit".
  const onMap = onScreen && (screen?.view === "units" || screen?.view === "unit");
  const picked = onMap && selectedUnit ? findUnit(selectedUnit, overrides) : undefined;
  const bookable = picked?.status === "available" && picked.projectId === pathname.split("/")[2];
  const agentChips = last?.kind === "agent" ? last.chips : [];
  // The booking journey runs in order (token, KYC, payment schedule): only offer the step that's next.
  const paid = booking?.status === "paid";
  const journeyChips =
    onScreen && screen?.view === "booking"
      ? !booking
        ? undefined
        : !paid
          ? ["How do I pay the token?", "Is the token refundable?", "Why this token amount?"]
          : !kyc
            ? ["Start my KYC", "Why is KYC needed?", "What happens next?"]
            : PLAN_CHIPS[nextPlanStep(plan) ?? "done"]
      : onScreen && screen?.view === "kyc"
        ? !paid
          ? ["How do I pay the token?", "Is the token refundable?"]
          : !kyc
            ? ["What do I need for KYC?", "Is my data safe?"]
            : ["Continue to my payment schedule", "What happens next?"]
        : onScreen && screen?.view === "plan"
          ? !paid
            ? ["How do I pay the token?"]
            : !kyc
              ? ["Start my KYC", "Why is KYC needed?"]
              : PLAN_CHIPS[nextPlanStep(plan) ?? "done"]
          : undefined;
  // Avatar off: on the booking journey, offer only the steps that open a screen.
  const directJourneyChips = dismissed && journeyChips ? journeyChips.filter((c) => c in DIRECT_ROUTES && DIRECT_ROUTES[c] !== pathname) : journeyChips;
  const chips = directJourneyChips
    ? directJourneyChips
    : onProject
    ? PROJECT_NEXT_STEPS
    : bookable
      ? [BOOK_UNIT, SEE_PLAN, ...agentChips.filter((c) => !/book|plan/i.test(c))].slice(0, 4)
      : onMap
        ? agentChips.filter((c) => !/plan/i.test(c))
        : agentChips;
  const lastAgent = [...turns].reverse().find((t) => t.kind === "agent");
  const running = [...turns].reverse().find((t) => t.kind === "tool" && !t.tool.pill);
  const lastShow = [...turns].reverse().find((t) => t.kind === "show");

  const humanRequest = () => {
    avatar.bargeIn();
    void requestHuman();
  };
  // Minimise: back to the app, on the screen the customer last had open, else
  // the last one the advisor showed, else recommendations.
  // The conversation carries on across the minimise: mark the route as the
  // advisor's own so the screen cue doesn't cut off or talk over its reply.
  const minimise = () => {
    const target = lastScreenPath.current ?? (lastShow?.kind === "show" ? routeFor({ view: lastShow.view as View, id: lastShow.id }) : "/units");
    agentNav.current = target;
    router.push(target);
  };
  const toAdvisor = () => router.push("/agent");
  // Back goes to the screen the customer was actually on before. Opened
  // straight onto a screen, it steps up a level instead.
  const goBack = () => {
    const v = trail.current ?? readTrail();
    // Skip the advisor page (the tile reopens it) and the landing page (its welcome screen is not a place to go Back to).
    let i = v.length - 2;
    while (i >= 0 && (v[i] === "/agent" || v[i] === "/" || v[i] === pathname)) i--;
    // Go to the screen by route, not by history offset: the trail outlives the
    // tab's history, so an offset can overshoot onto the landing page.
    const trailTarget = v[i];
    if (i >= 0) {
      v.length = i; // the effect above re-adds the screen on arrival
      saveTrail(v);
      router.replace(trailTarget);
    } else {
      const up = parentOf(pathname);
      if (up !== "/agent") router.push(up); // nothing earlier: stay, never open the advisor
    }
  };
  const sendFromComposer = (text: string) => {
    // The lead next step opens the unit map right away; the Property Advisor then
    // talks the customer through it.
    if (onProject && text === SHOW_UNITS && screen?.id) router.push(`/units/${screen.id}/map`);
    // Straight to the calculator; it picks a unit itself if none is chosen.
    if ((onProject || bookable) && text === SEE_PLAN) return void router.push("/money/calculator");
    // Avatar off: no advisor to wait for, so the buttons act directly.
    if (dismissed) {
      const route = DIRECT_ROUTES[text];
      if (route) return void router.push(route);
      if (text === BOOK_UNIT && picked) return void (useSession.getState().bookUnit(picked.id) && router.push("/booking"));
    }
    // Name the unit, so the Property Advisor books the one on screen.
    if (text === BOOK_UNIT && picked) return void send(`Book unit ${picked.unitNo} for me.`);
    void send(text);
  };

  return (
    // Any touch counts as activity: reopen a paused avatar before they speak.
    <main className={`relative flex h-full flex-col ${immersive ? "bg-site" : ""}`} onPointerDown={() => avatar.wake()}>
      {!immersive && (
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-site px-3 py-2.5 text-site-ink">
          <div className="flex min-w-0 items-center gap-1">
            {onScreen && (
              <button onClick={goBack} className="-ml-1 rounded-full p-1.5 text-site-ink" aria-label="Back">
                <BackIcon className="h-5 w-5" />
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {onScreen ? (
                  <span className="truncate font-display text-[21px] font-semibold tracking-tight">{screen ? VIEW_LABEL[screen.view] : ""}</span>
                ) : (
                  <>
                    <Logo className="w-28" onDark />
                    <span className="border-l border-gold/30 pl-2 font-display text-[18px] font-semibold italic tracking-tight text-gold">Property Advisor</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={humanRequest}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-site-ink"
              aria-label="Talk to a human advisor"
              title="Talk to a human advisor"
            >
              <PhoneIcon className="h-[18px] w-[18px]" />
            </button>
            {!onScreen && (
              <button
                onClick={minimise}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-ink"
                aria-label="Minimise the advisor and show the app"
                title="Minimise"
              >
                <MinimizeIcon className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
        </header>
      )}

      <div className="relative flex min-h-0 flex-1 flex-col">
        <AvatarStage pip={onScreen} lift={pinnedBar} onExpand={toAdvisor} />

        {immersive ? (
          <LiveOverlay
            turns={turns}
            busy={busy}
            error={error}
            name={profile.name ?? ""}
            chips={chips}
            showPills={showPills}
            onSend={(t) => void send(t)}
            onHuman={humanRequest}
            onMinimise={minimise}
            canMinimise={!onboarding}
          />
        ) : onScreen ? (
          // Bottom padding keeps the end of every screen clear of the avatar tile.
          <div ref={content} className={`min-h-0 flex-1 overflow-y-auto ${pinnedBar ? "" : "pb-36"}`}>
            {children}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Transcript turns={turns} busy={busy} error={error} showPills={showPills} onRetry={() => void send(lastUserText(turns))} />
          </div>
        )}
      </div>

      {/* With the avatar off, the strip is where the advisor's written answers show, so it stays on every screen. */}
      {onScreen && (!hideDock || dismissed) && (
        <>
          <button onClick={toAdvisor} className="shrink-0 border-t border-gold/20 bg-card px-4 py-3 text-left" aria-label="Back to the advisor">
            <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-gold">
              <span className={`h-1.5 w-1.5 rounded-full bg-gold${busy ? "animate-pulse" : ""}`} />
              {busy ? (running?.kind === "tool" ? `${running.tool.name.replace("_", " ")}…` : "Property Advisor is thinking…") : "Property Advisor"}
              <span className="ml-auto font-medium normal-case tracking-normal text-ink-soft">{mode === "avatar" && !dismissed ? "Open Property Advisor" : "Open chat"}</span>
            </div>
            {lastAgent?.kind === "agent" && <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-ink">{lastAgent.text}</p>}
          </button>
        </>
      )}

      {/* Pinned above the input so it never scrolls away. */}
      {!immersive && note && mode === "chat" && <FallbackNote note={note} liveEnabled={liveEnabled} />}
      {!immersive && <Composer chips={chips} busy={busy} onSend={sendFromComposer} />}
      <FindingOverlay />
    </main>
  );
}

/** Shown in chat after the live avatar failed, with a way back to it. */
function FallbackNote({ note, liveEnabled }: { note: string; liveEnabled: boolean }) {
  return (
    <div className="mx-3 my-2 flex shrink-0 items-start gap-3 rounded-xl border border-gold/50 bg-gold-soft px-3 py-2.5 text-[12.5px] leading-snug text-ink">
      <span className="flex-1">{note}</span>
      <span className="flex shrink-0 flex-col items-end gap-1 text-[12px] font-semibold">
        {liveEnabled && (
          <button onClick={() => avatar.retryLive()} className="text-verd">
            Try the avatar again
          </button>
        )}
        <button onClick={() => avatar.clearNote()} className="text-ink-soft">
          Dismiss
        </button>
      </span>
    </div>
  );
}

function lastUserText(turns: ReturnType<typeof useSession.getState>["turns"]): string | null {
  for (let i = turns.length - 1; i >= 0; i--) {
    const t = turns[i];
    if (t.kind === "user") return t.text;
  }
  return null;
}
