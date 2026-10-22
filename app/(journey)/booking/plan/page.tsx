"use client";

// The rest of the booking after KYC, one step at a time and in order: the
// balance of the down payment, the sales and purchase agreement, Oqood
// registration and the first 1% monthly instalment. All simulated. Each step
// unlocks only when the one before it is done.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { nextPlanStep, PLAN_STEPS, useSession, type PlanStep } from "@/lib/store";
import { dateIn, aed, scheduleSteps } from "@/lib/journey";
import { getProject } from "@/lib/inventory";
import { Button, Card, Disclosure, SandboxTag, ScreenTitle, Section, StickyBar } from "@/components/journey/ui";

const STAGES = ["Connecting to your bank…", "Authorising payment…", "Confirming with the developer…", "Payment received"];

export default function PlanPage() {
  const router = useRouter();
  const { booking, kyc, plan, completePlanStep, sendEvent } = useSession();
  const [stage, setStage] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (!booking || booking.status !== "paid") {
    return (
      <div className="flex min-h-full flex-col">
        <ScreenTitle eyebrow="Payment schedule" title="Pay the token first" sub="The payment schedule opens once your token is paid and KYC is done." />
        <StickyBar>
          <Button onClick={() => router.push("/booking")}>Go to booking</Button>
        </StickyBar>
      </div>
    );
  }
  if (!kyc) {
    return (
      <div className="flex min-h-full flex-col">
        <ScreenTitle eyebrow="Payment schedule" title="Complete KYC first" sub="The payment schedule opens once your KYC is verified." />
        <StickyBar>
          <Button onClick={() => router.push("/booking/kyc")}>Start KYC</Button>
        </StickyBar>
      </div>
    );
  }

  const paidAt = booking.paidAt ?? 0;
  const META = Object.fromEntries(scheduleSteps(booking.price, booking.token_amount, paidAt, getProject(booking.project_id)?.plan.months).map((s) => [s.key, s])) as Record<
    PlanStep,
    ReturnType<typeof scheduleSteps>[number]
  >;
  const current = nextPlanStep(plan);
  const paying = stage !== null;

  const finish = (step: PlanStep, event: string, detail: string) => {
    completePlanStep(step);
    setStage(null);
    void sendEvent(event, detail, step === "monthly" ? "booking_completed" : "kyc_completed");
  };

  const payInstalment = (step: "down" | "monthly") => {
    setStage(0);
    STAGES.forEach((_, i) => timers.current.push(setTimeout(() => setStage(i), i * 1100)));
    timers.current.push(
      setTimeout(() => {
        const what = META[step].title;
        finish(
          step,
          `${what} done · ${booking.booking_id}`,
          `The customer completed "${what}" (${aed(META[step].amount ?? 0)}) for unit ${booking.unit_no} at ${booking.project_name}, booking ${booking.booking_id} (simulated).`,
        );
      }, 4000),
    );
  };

  const rows = [
    { title: "Token paid", detail: `${aed(booking.token_amount)} by ${booking.method}`, date: dateIn(0, paidAt), done: true },
    { title: "KYC verified", detail: "Emirates ID or passport, address and liveness", date: dateIn(0, paidAt), done: true },
    ...PLAN_STEPS.map((k) => ({ title: META[k].title, detail: META[k].detail, date: META[k].date, done: Boolean(plan[k]) })),
  ];

  const stepDone = (step: "spa" | "oqood", event: string, detail: string) => finish(step, event, detail);

  return (
    <div className="flex min-h-full flex-col">
      <ScreenTitle
        eyebrow={`${booking.unit_no} · ${booking.project_name}`}
        title={current ? META[current].title : "Booking complete"}
        sub={current ? "Sandbox step. No money moves." : "Your unit is registered and your 1% plan is running."}
        right={<SandboxTag />}
      />

      <Section title="Your steps">
        <Card className="px-4 py-2">
          <ol className="relative">
            <span className="absolute bottom-4 left-[5px] top-4 w-px bg-line" />
            {rows.map((s) => (
              <li key={s.title} className="relative flex gap-3 py-2.5">
                <span className={`relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2 ${s.done ? "border-verd bg-verd" : "border-verd bg-card"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13.5px] font-semibold">{s.title}</span>
                    <span className="shrink-0 text-[11.5px] text-ink-soft">{s.done ? "Done" : s.date}</span>
                  </div>
                  <div className="text-[12.5px] text-ink-soft">{s.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </Section>

      <Disclosure>Sandbox: this is a simulated flow. No payment is taken and no legal document is issued.</Disclosure>

      <StickyBar>
        {paying ? (
          <Card className="px-4 py-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-verd transition-[width] duration-1000 ease-linear" style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }} />
            </div>
            <p className="mt-3 text-[14px] font-semibold">{STAGES[stage]}</p>
            <p className="text-[12px] text-ink-soft">Sandbox payment. No money moves.</p>
          </Card>
        ) : current === "spa" ? (
          <Button
            variant="gold"
            onClick={() =>
              stepDone("spa", `Agreement signed · ${booking.booking_id}`, `The customer signed the sales and purchase agreement for unit ${booking.unit_no} at ${booking.project_name} (simulated).`)
            }
          >
            Sign the agreement · sandbox
          </Button>
        ) : current === "oqood" ? (
          <Button
            variant="gold"
            onClick={() =>
              stepDone("oqood", `Oqood registered · ${booking.booking_id}`, `The purchase of unit ${booking.unit_no} at ${booking.project_name} was registered with the Dubai Land Department through Oqood (simulated).`)
            }
          >
            Register with Oqood · sandbox
          </Button>
        ) : current ? (
          <Button variant="gold" onClick={() => payInstalment(current)}>
            Pay {aed(META[current].amount ?? 0)} · sandbox
          </Button>
        ) : (
          <Card className="px-4 py-4 text-center">
            <p className="font-display text-[19px] font-semibold">Unit {booking.unit_no} is yours</p>
            <p className="mt-1 text-[12.5px] text-ink-soft">Every step is done. This is the end of the booking journey.</p>
          </Card>
        )}
      </StickyBar>
    </div>
  );
}
