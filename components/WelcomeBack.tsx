"use client";

// Shown when a returning customer lands on the site again. The session lives in
// localStorage, so this reads their stored journey back to them as a checklist
// and offers to pick up on the screen they last had open.

import { useAppRouter as useRouter } from "@/lib/nav";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/store";
import { routeFor } from "@/lib/journey";
import { findUnit, getProject } from "@/lib/inventory";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/journey/ui";

interface Step {
  label: string;
  done: boolean;
  note?: string;
}

interface Summary {
  first: string;
  href: string;
  steps: Step[];
}

function summarise(): Summary | null {
  const s = useSession.getState();
  if (!s.profile.name) return null;

  const unit = s.selectedUnit ? findUnit(s.selectedUnit) : undefined;
  const projectId = unit?.projectId ?? s.booking?.project_id ?? (s.screen?.view === "project" || s.screen?.view === "units" ? s.screen.id : null) ?? s.lastSearch[0]?.id;
  const project = projectId ? getProject(projectId) : undefined;
  const explored = Boolean(project) || s.introSeen.length > 0;
  const viewed = s.lastSearch.length;

  return {
    first: s.profile.name.split(" ")[0],
    href: s.screen ? routeFor(s.screen) : "/agent",
    steps: [
      { label: project ? `Exploring ${project.name}` : "Exploring Danube projects", done: explored },
      { label: "Projects viewed", done: viewed > 0, note: viewed > 0 ? `${viewed} viewed` : undefined },
      { label: "Unit shortlisted", done: Boolean(s.selectedUnit), note: unit ? `Unit ${unit.unitNo}` : undefined },
      { label: "Token payment", done: s.booking?.status === "paid" },
      { label: "KYC", done: Boolean(s.kyc) },
    ],
  };
}

export function WelcomeBack() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    setSummary(summarise());
  }, []);

  if (!summary) return null;

  return (
    <div
      role="dialog"
      aria-label="Welcome back"
      className="absolute inset-0 z-30 flex flex-col justify-center px-6 py-8 text-ink"
      style={{ background: "var(--brand-gradient), var(--paper)" }}
    >
      <div className="mx-auto flex w-full max-w-[440px] flex-col">
      <div className="mb-6 flex justify-center">
        <Logo className="w-48" />
      </div>
      <h2 className="text-center font-display text-[40px] font-medium leading-none tracking-tight">Welcome back, <span className="italic text-gold">{summary.first}</span></h2>
      <p className="mx-auto mt-2 max-w-[30ch] text-center text-[14px] leading-relaxed text-ink-soft">Here&rsquo;s where things stand in your journey:</p>

      <ul className="mt-6 space-y-4 rounded-3xl border border-gold/20 bg-card px-5 py-5 shadow-[0_24px_60px_-30px_rgb(0_0_0/0.25)]">
        {summary.steps.map((step) => (
          <li key={step.label} className="flex items-center gap-3 text-[15px]">
            <span
              aria-hidden
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                step.done ? "bg-gold text-site" : "border border-line text-transparent"
              }`}
            >
              ✓
            </span>
            <span className={step.done ? "text-ink" : "text-muted"}>{step.label}</span>
            {step.done && step.note && <span className="ml-auto text-[12px] text-muted">{step.note}</span>}
          </li>
        ))}
      </ul>

      <Button onClick={() => router.push(summary.href)} className="mt-6 w-full">
        Continue where I left off →
      </Button>
      <button
        onClick={() => {
          useSession.getState().reset();
          router.push("/register");
        }}
        className="mt-3 w-full text-center text-[12px] font-medium text-ink-soft underline underline-offset-2"
      >
        Start over instead
      </button>
      </div>
    </div>
  );
}
