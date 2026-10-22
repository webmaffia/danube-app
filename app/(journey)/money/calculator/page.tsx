"use client";

// Payment plan calculator: unit value, down payment and plan length as
// sliders, with the monthly instalment updating live. Danube's 1% plan is a
// 20% down payment then 1% a month over 80 months at 0% interest.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/store";
import { useAvatar } from "@/lib/avatar/controller";
import { calculatePayment } from "@/lib/agent/tools";
import { findUnit, getProject, getUnits, type Unit } from "@/lib/inventory";
import { DOWN_PAYMENT_PCT, MAX_PLAN_MONTHS, MIN_PLAN_MONTHS, TOKEN_AMOUNT } from "@/lib/knowledge";
import { aed, aedShort, sqft } from "@/lib/journey";
import { Button, Card, Disclosure, ScreenTitle, Section, StickyBar } from "@/components/journey/ui";

export default function Calculator() {
  const { selectedUnit, booking, overrides } = useSession();
  const unit =
    (selectedUnit && findUnit(selectedUnit, overrides)) ||
    (booking && findUnit(booking.unit_id, overrides)) ||
    getUnits("bayz102", overrides).find((p) => p.status === "available")!;
  // Keyed on the unit, so the sliders reset when the agent switches units.
  return <CalculatorFor key={unit.id} unit={unit} />;
}

function CalculatorFor({ unit }: { unit: Unit }) {
  const router = useRouter();
  const { booking, send } = useSession();
  const dismissed = useAvatar((a) => a.dismissed);
  const project = getProject(unit.projectId)!;
  const [value, setValue] = useState(unit.price);
  const [down, setDown] = useState(project.plan.downPct);
  const [months, setMonths] = useState(project.plan.months);

  const r = calculatePayment({ price: value, down_payment_pct: down, months });
  const schedule = [
    { when: "Today", what: "Booking token", amount: TOKEN_AMOUNT },
    { when: "Within 30 days", what: "Balance of down payment", amount: r.balance_of_down_payment },
    { when: `Monthly for ${r.months} months`, what: "Monthly instalment (1%)", amount: r.monthly_instalment },
    { when: `On completion · ${project.handover}`, what: "Balance", amount: r.balance_on_completion },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <ScreenTitle
        eyebrow={`Unit ${unit.unitNo} · ${unit.layout} · ${sqft(unit.sizeSqft)}`}
        title="Your payment plan"
        sub="Move the sliders to see what fits."
      />

      <Card className="mx-4 mt-4 overflow-hidden">
        <div className="bg-site px-4 py-4 text-site-ink">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-site-ink/70">Monthly instalment</div>
          <div className="mt-0.5 font-display text-[34px] font-semibold leading-none tracking-tight">{aed(r.monthly_instalment)}</div>
          <div className="mt-1.5 text-[12px] text-site-ink/70">
            {r.monthly_pct_of_price}% of the price a month for {r.months} months · 0% interest
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-line">
          <Out label="Down payment" value={aedShort(r.down_payment)} />
          <Out label="Monthly total" value={aedShort(r.total_monthly_payments)} />
          <Out label="On completion" value={aedShort(r.balance_on_completion)} />
        </div>
      </Card>

      <Section>
        <Card className="space-y-4 px-4 py-4">
          <Slider label="Unit value" display={aedShort(value)} min={1000000} max={8000000} step={10000} value={value} onChange={setValue} />
          <Slider label="Down payment" display={`${down}% · ${aedShort(r.down_payment)}`} min={10} max={40} step={5} value={down} onChange={setDown} />
          <Slider label="Monthly instalments" display={`${r.months} months`} min={MIN_PLAN_MONTHS} max={Math.min(MAX_PLAN_MONTHS, 100 - down)} step={1} value={r.months} onChange={setMonths} />
          <p className="text-[11.5px] text-ink-soft">
            Danube&rsquo;s 1% plan: around {DOWN_PAYMENT_PCT}% down, 1% of the price a month while the building is built, and the balance on completion
            ({project.handover}). {project.plan.confirmed ? "These are the terms on the project page." : "The project page doesn’t publish this project’s terms, so these are indicative: confirm them with the sales team."}
          </p>
        </Card>
      </Section>

      <Section title="Payment schedule">
        <Card className="divide-y divide-line">
          {schedule.map((p) => (
            <div key={p.what} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <div className="text-[13.5px] font-semibold">{p.what}</div>
                <div className="text-[11.5px] text-ink-soft">{p.when}</div>
              </div>
              <div className="text-[14px] font-semibold">{aed(p.amount)}</div>
            </div>
          ))}
          <div className="flex items-center justify-between bg-paper/60 px-4 py-2.5 text-[12.5px] text-ink-soft">
            <span>Total price</span>
            <span className="font-semibold text-ink">{aed(value)}</span>
          </div>
        </Card>
      </Section>

      <Disclosure>
        Government fees, such as the Dubai Land Department registration fee, are separate and not included. Figures are sample data, so confirm the
        final price and schedule with the Danube sales team.
      </Disclosure>

      <StickyBar className="grid grid-cols-2">
        <Button variant="secondary" onClick={() => void send("Can you explain how the payment plan works?")}>
          Ask about the plan
        </Button>
        <Button
          disabled={unit.status !== "available" && booking?.unit_id !== unit.id}
          onClick={() => {
            if (booking?.unit_id === unit.id) return router.push("/booking");
            if (!dismissed) return void send(`I want to book unit ${unit.unitNo}.`);
            if (useSession.getState().bookUnit(unit.id)) router.push("/booking");
          }}
        >
          {booking?.unit_id === unit.id ? "Go to booking" : "Book this unit"}
        </Button>
      </StickyBar>
    </div>
  );
}

function Out({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5">
      <div className="text-[10.5px] font-medium uppercase tracking-wider text-ink-soft">{label}</div>
      <div className="text-[14.5px] font-semibold">{value}</div>
    </div>
  );
}

function Slider({ label, display, min, max, step, value, onChange }: { label: string; display: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-ink-soft">{label}</span>
        <span className="text-[14px] font-semibold">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1.5 w-full accent-[var(--verd)]" />
    </label>
  );
}
