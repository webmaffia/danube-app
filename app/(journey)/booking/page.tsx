"use client";

// Booking: summary, payment method, a 4-second mock payment with staged
// status, then confirmation with the booking ID and a dated next-steps ladder.
// The agent creates the booking; only the customer confirms payment here.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { nextPlanStep, useSession, type Booking, type PlanProgress } from "@/lib/store";
import { findUnit, getProject } from "@/lib/inventory";
import { useAvatar } from "@/lib/avatar/controller";
import { dateIn, aed, aedShort, scheduleSteps, sqft } from "@/lib/journey";
import { TOKEN_AMOUNT } from "@/lib/knowledge";
import { Button, Card, Disclosure, SandboxTag, ScreenTitle, Section, StickyBar } from "@/components/journey/ui";

const METHODS = [
  { id: "Card", label: "Debit or credit card", hint: "Visa, Mastercard" },
  { id: "Apple Pay", label: "Apple Pay", hint: "Pay with your device" },
  { id: "Bank transfer", label: "Bank transfer", hint: "From any UAE or international bank" },
];

const STAGES = ["Connecting to your bank…", `Authorising ${aed(TOKEN_AMOUNT)}…`, "Confirming your unit…", "Payment received"];

export default function BookingPage() {
  const router = useRouter();
  const { booking, selectedUnit, send, markPaid, sendEvent, overrides, kyc, plan } = useSession();
  const dismissed = useAvatar((a) => a.dismissed);
  const [method, setMethod] = useState("Card");
  const [stage, setStage] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (!booking) {
    const unit = selectedUnit ? findUnit(selectedUnit, overrides) : undefined;
    return (
      <div className="flex min-h-full flex-col">
        <ScreenTitle eyebrow="Booking" title="No unit on hold yet" sub="Pick a unit on the map, or ask the advisor to hold one for you." />
        <StickyBar>
          {unit && unit.status === "available" ? (
            <Button onClick={() => (dismissed ? void useSession.getState().bookUnit(unit.id) : void send(`I want to book unit ${unit.unitNo}.`))}>
              {dismissed ? `Hold ${unit.unitNo}` : `Ask the advisor to hold ${unit.unitNo}`}
            </Button>
          ) : (
            <Button onClick={() => router.push("/units/gemz/map")}>Open the unit map</Button>
          )}
        </StickyBar>
      </div>
    );
  }

  if (booking.status === "paid") return <Confirmation booking={booking} kycDone={Boolean(kyc)} plan={plan} onKyc={() => router.push("/booking/kyc")} onPlan={() => router.push("/booking/plan")} />;

  const pay = () => {
    setStage(0);
    STAGES.forEach((_, i) => timers.current.push(setTimeout(() => setStage(i), i * 1100)));
    timers.current.push(
      setTimeout(() => {
        markPaid(method);
        void sendEvent(
          `Token paid · ${booking.booking_id}`,
          `The customer paid the ${aed(booking.token_amount)} token by ${method} for unit ${booking.unit_no} at ${booking.project_name} (booking ${booking.booking_id}). The unit is now held for them.`,
          "token_paid",
        );
      }, 4000),
    );
  };

  const paying = stage !== null;

  return (
    <div className="flex min-h-full flex-col">
      <ScreenTitle eyebrow="Booking" title="Confirm your unit" right={<SandboxTag />} />

      <Card className="mx-4 mt-4 px-4 py-3.5">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display text-[22px] font-semibold tracking-tight">{booking.unit_no}</div>
            <div className="text-[12.5px] text-ink-soft">
              {booking.project_name} · {sqft(booking.size_sqft)}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-[19px] font-semibold">{aedShort(booking.price)}</div>
            <div className="text-[11.5px] text-ink-soft">excl. government fees</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-gold-soft px-3 py-2.5">
          <span className="text-[13px] font-semibold">Pay now to hold it</span>
          <span className="font-display text-[20px] font-semibold">{aed(booking.token_amount)}</span>
        </div>
        <p className="mt-2 text-[11.5px] text-ink-soft">
          Booking {booking.booking_id}. The token is fully refundable for 15 days. The rest follows Danube's 1% payment plan.
        </p>
      </Card>

      <Section title="Pay with">
        <div className="grid gap-2">
          {METHODS.map((m) => (
            <label
              key={m.id}
              className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-3 ${method === m.id ? "border-verd bg-verd-soft/50" : "border-line bg-card"}`}
            >
              <span>
                <span className="block text-[14px] font-semibold">{m.label}</span>
                <span className="text-[11.5px] text-ink-soft">{m.hint}</span>
              </span>
              <input type="radio" name="method" checked={method === m.id} onChange={() => setMethod(m.id)} disabled={paying} className="accent-[var(--verd)]" />
            </label>
          ))}
        </div>
      </Section>

      <Disclosure>Sandbox: this is a simulated payment. No card or bank details are collected, and no money is charged.</Disclosure>

      <StickyBar>
        {paying ? (
          <Card className="px-4 py-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-verd transition-[width] duration-1000 ease-linear" style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }} />
            </div>
            <p className="mt-3 text-[14px] font-semibold">{STAGES[stage]}</p>
            <p className="text-[12px] text-ink-soft">Sandbox payment. No money moves.</p>
          </Card>
        ) : (
          <Button variant="gold" onClick={pay}>
            Pay {aed(booking.token_amount)} · sandbox
          </Button>
        )}
      </StickyBar>
    </div>
  );
}

function Confirmation({ booking, kycDone, plan, onKyc, onPlan }: { booking: Booking; kycDone: boolean; plan: PlanProgress; onKyc: () => void; onPlan: () => void }) {
  // markPaid always stamps paidAt before this screen shows.
  const paidAt = booking.paidAt ?? 0;
  const steps: { date: string; title: string; detail: string; done?: boolean; action?: boolean; planAction?: boolean }[] = [
    { date: dateIn(0, paidAt), title: "Token paid", detail: `${aed(booking.token_amount)} by ${booking.method}`, done: true },
    kycDone
      ? { date: dateIn(0, paidAt), title: "KYC verified", detail: "Emirates ID or passport, address and liveness", done: true }
      : { date: dateIn(0, paidAt), title: "Complete KYC", detail: "Emirates ID or passport and a quick selfie", action: true },
  ];
  // The steps after KYC follow the payment plan; only the next one is actionable.
  const next = nextPlanStep(plan);
  for (const l of scheduleSteps(booking.price, booking.token_amount, paidAt, getProject(booking.project_id)?.plan.months)) {
    steps.push({ date: l.date, title: l.title, detail: l.detail, done: Boolean(plan[l.key]), planAction: kycDone && next === l.key });
  }

  return (
    <div>
      <div className="flex flex-col items-center px-6 pt-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-site">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <h1 className="mt-3 font-display text-[24px] font-semibold tracking-tight">{booking.unit_no} is held for you</h1>
        <p className="mt-1 text-[13.5px] text-ink-soft">
          {booking.project_name} · booking {booking.booking_id}
        </p>
        <div className="mt-2">
          <SandboxTag label="Sandbox receipt" />
        </div>
      </div>

      <Section title="What happens next">
        <Card className="px-4 py-2">
          <ol className="relative">
            <span className="absolute bottom-4 left-[5px] top-4 w-px bg-line" />
            {steps.map((s) => (
              <li key={s.title} className="relative flex gap-3 py-2.5">
                <span className={`relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2 ${s.done ? "border-verd bg-verd" : "border-verd bg-card"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13.5px] font-semibold">{s.title}</span>
                    <span className="shrink-0 text-[11.5px] text-ink-soft">{s.date}</span>
                  </div>
                  <div className="text-[12.5px] text-ink-soft">{s.detail}</div>
                  {s.planAction && (
                    <Button size="sm" onClick={onPlan} className="mt-1.5">
                      Continue
                    </Button>
                  )}
                  {s.action && (
                    <Button size="sm" onClick={onKyc} className="mt-1.5">
                      Start KYC
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </Section>
    </div>
  );
}
