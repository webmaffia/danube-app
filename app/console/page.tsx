"use client";

// Console: one live session, not a cohort. The funnel shows where this
// customer is, and the rest shows how the agent got them there: profile,
// transcript, every tool call, guardrail hits and cost-relevant timings.
//
// Open it in another tab of the same browser. The journey tab broadcasts
// every change, and the console also reads the last snapshot on load.

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/journey/ui";
import { INTENTS, type Intent } from "@/lib/agent/prompt";
import { LIVE_CHANNEL, LIVE_KEY, type LiveSnapshot } from "@/lib/store";
import { VIEW_LABEL, aed, aedShort, type View } from "@/lib/journey";

const STAGE_LABEL: Record<Intent, string> = {
  visitor: "Visitor",
  interested: "Interested",
  qualified: "Qualified",
  shortlisted: "Shortlisted",
  high_intent: "High intent",
  booking_initiated: "Booking initiated",
  token_paid: "Token paid",
  kyc_completed: "KYC completed",
  booking_completed: "Booking completed",
};

function readSnapshot(): LiveSnapshot | null {
  try {
    const raw = localStorage.getItem(LIVE_KEY);
    return raw ? (JSON.parse(raw) as LiveSnapshot) : null;
  } catch {
    return null;
  }
}

export default function Console() {
  const [snap, setSnap] = useState<LiveSnapshot | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setSnap(readSnapshot()); // eslint-disable-line react-hooks/set-state-in-effect
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(LIVE_CHANNEL);
      channel.onmessage = (e) => setSnap(e.data as LiveSnapshot);
    } catch {}
    const onStorage = (e: StorageEvent) => e.key === LIVE_KEY && setSnap(readSnapshot());
    window.addEventListener("storage", onStorage);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      channel?.close();
      window.removeEventListener("storage", onStorage);
      clearInterval(tick);
    };
  }, []);

  const stats = useMemo(() => {
    if (!snap) return null;
    const firstSay = snap.metrics.map((m) => m.firstSayMs).filter((x): x is number => x != null).sort((a, b) => a - b);
    const done = snap.metrics.map((m) => m.doneMs).filter((x): x is number => x != null);
    return {
      turns: snap.turns.filter((t) => t.kind === "user").length,
      tools: snap.trace.length,
      medianFirstSay: firstSay.length ? firstSay[Math.floor(firstSay.length / 2)] : null,
      avgTurn: done.length ? done.reduce((a, b) => a + b, 0) / done.length : null,
    };
  }, [snap]);

  if (!snap || !stats) {
    return (
      <main className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-gold">Presenter console</p>
        <h1 className="font-display text-[44px] font-medium leading-none tracking-tight">No live session yet</h1>
        <p className="max-w-md text-[14px] text-ink-soft">
          Start a conversation in another tab of this browser and it will appear here as it happens.
        </p>
        <Button href="/">Open the app</Button>
      </main>
    );
  }

  const stageIdx = INTENTS.indexOf(snap.intent);
  const elapsed = snap.startedAt && now ? Math.max(0, Math.round((now - snap.startedAt) / 1000)) : 0;
  const ago = now ? Math.max(0, Math.round((now - snap.updatedAt) / 1000)) : 0;
  const liveMin = (snap.avatar?.liveSeconds ?? 0) / 60;

  const customerRows = [
    ["Purpose", snap.profile.purpose?.replace("_", " ")],
    ["Budget", snap.profile.budget_max ? aedShort(snap.profile.budget_max, 0) : null],
    ["Horizon", snap.profile.horizon_years ? `${snap.profile.horizon_years} years` : null],
    ["Region", snap.profile.region],
    ["Funding", snap.profile.funding],
    ["On screen", snap.screen ? VIEW_LABEL[snap.screen.view as View] : "Property Advisor"],
  ] as const;

  return (
    <main className="min-h-full overflow-x-hidden px-4 py-6 text-ink sm:px-8 sm:py-8">
      {/* masthead */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-gold">Presenter console</p>
          <h1 className="mt-2 break-words font-display text-[38px] font-medium leading-[0.98] tracking-tight sm:text-[60px]">
            {snap.profile.name ?? "Customer"}
            {snap.profile.city && <span className="italic text-gold"> · {snap.profile.city}</span>}
          </h1>
        </div>
        <div
          className={`flex items-center gap-2.5 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] ${
            ago < 10 ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-line text-ink-soft"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${ago < 10 ? "animate-pulse bg-emerald-400" : "bg-slate-500"}`} />
          {ago < 10 ? "Live" : `Last update ${ago}s ago`}
        </div>
      </header>

      {/* metrics: one ruled strip instead of separate boxes */}
      <section className="mt-6 grid grid-cols-2 border-y border-gold/25 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Session" value={fmtDuration(elapsed)} />
        <Kpi label="Customer turns" value={String(stats.turns)} />
        <Kpi label="Tool calls" value={String(stats.tools)} />
        <Kpi label="First speech (median)" value={stats.medianFirstSay != null ? `${(stats.medianFirstSay / 1000).toFixed(1)}s` : "—"} />
        <Kpi label="Guardrail hits" value={String(snap.guardHits.length)} tone={snap.guardHits.length ? "gold" : undefined} />
        <Kpi label="Avatar video" value={`${liveMin.toFixed(1)} min`} hint={snap.avatar ? `${snap.avatar.mode} · ${snap.avatar.status}` : undefined} />
      </section>

      {/* funnel: a journey line with nodes */}
      <section className="mt-8">
        <SectionHead>Customer journey</SectionHead>
        {/* progress bar: one segment per stage, so the whole journey fits any width */}
        <div className="mt-5 flex gap-1" aria-hidden="true">
          {INTENTS.map((stage, i) => (
            <span key={stage} className={`h-1 flex-1 rounded-full transition-colors duration-700 ${i < stageIdx ? "bg-gold/70" : i === stageIdx ? "bg-gold" : "bg-line"}`} />
          ))}
        </div>
        <p className="mt-3 flex items-baseline justify-between text-[12px] text-ink-soft">
          <span>
            Now: <span className="font-display text-[22px] font-medium text-gold">{STAGE_LABEL[snap.intent]}</span>
          </span>
          <span>
            Stage {stageIdx + 1} of {INTENTS.length}
          </span>
        </p>
        <ol className="mt-3 grid grid-cols-3 gap-2">
          {INTENTS.map((stage, i) => {
            const state = i < stageIdx ? "done" : i === stageIdx ? "now" : "todo";
            return (
              <li
                key={stage}
                className={`relative flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[11.5px] font-semibold leading-tight ${
                  state === "now" ? "border-gold bg-gold/15 text-gold" : state === "done" ? "border-gold/30 text-ink" : "border-line text-ink-soft"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    state === "now" ? "bg-gold text-site" : state === "done" ? "bg-gold/20 text-gold" : "bg-line text-ink-soft"
                  }`}
                >
                  {state === "done" ? "✓" : i + 1}
                </span>
                {STAGE_LABEL[stage]}
                {state === "now" && <span className="pulse-ring pointer-events-none absolute inset-0 rounded-xl border border-gold" />}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* left rail: who they are (below the conversation on a phone) */}
        <aside className="order-2 space-y-8 lg:order-1 lg:col-span-3">
          <div>
            <SectionHead>Profile</SectionHead>
            <dl className="mt-4 text-[13px]">
              {customerRows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-line py-2.5">
                  <dt className="text-ink-soft">{k}</dt>
                  <dd className="text-right font-semibold first-letter:uppercase">{v ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <SectionHead>Booking</SectionHead>
            {snap.booking ? (
              <div className="mt-4 rounded-2xl border border-gold/30 bg-gold-soft p-4 text-[13px]">
                <div className="font-display text-[30px] font-medium leading-none text-gold">{snap.booking.unit_no}</div>
                <div className="mt-1 text-ink-soft">{snap.booking.project_name}</div>
                <div className="mt-3 space-y-1">
                  <Line k="Price" v={aedShort(snap.booking.price)} />
                  <Line k="Token" v={`${aed(snap.booking.token_amount)} · ${snap.booking.status === "paid" ? `paid by ${snap.booking.method}` : "awaiting payment"}`} />
                  <Line k="Booking ID" v={snap.booking.booking_id} />
                  <Line k="KYC" v={snap.kyc ? `Verified · ID ${snap.kyc.idMasked}` : "Pending"} />
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-line px-4 py-3 text-[13px] text-ink-soft">No booking yet.</p>
            )}
          </div>

          <div>
            <SectionHead>{`Guardrails · ${snap.guardHits.length} ${snap.guardHits.length === 1 ? "hit" : "hits"}`}</SectionHead>
            {snap.guardHits.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-line px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
                No hits yet. Every figure spoken so far traced back to a tool result, and nothing promised returns.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {snap.guardHits.map((g, i) => (
                  <li key={i} className="rounded-xl border border-gold/40 bg-gold-soft px-3 py-2 text-[12.5px]">
                    <div className="font-semibold">
                      {new Date(g.at).toLocaleTimeString("en-IN")} · {g.action}
                    </div>
                    {g.violations.map((v, j) => (
                      <div key={j} className="mt-0.5 text-ink-soft">
                        <span className="font-semibold text-ink">{v.check === "provenance" ? "Unverified figure" : "Return language"}</span>: {v.detail}
                        {v.check === "return_language" && <span className="block italic">&ldquo;{v.text}&rdquo;</span>}
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* centre: the conversation, as a conversation */}
        <section className="order-1 lg:order-2 lg:col-span-5">
          <SectionHead>Transcript</SectionHead>
          <div className="mt-4 flex min-h-[160px] flex-col gap-3 rounded-3xl border border-gold/15 bg-card/60 p-4 lg:max-h-[640px] lg:min-h-[320px] lg:overflow-auto lg:p-5">
            {snap.turns.map((t, i) => {
              if (t.kind === "user")
                return (
                  <div
                    key={i}
                    className="ml-auto max-w-[92%] break-words rounded-2xl rounded-br-md bg-linear-to-br from-[#e6d7bf] via-[#c9b08e] to-[#9a7f58] px-3.5 py-2.5 text-[14px] font-medium leading-snug text-site sm:max-w-[85%]"
                  >
                    {t.text}
                    {t.interrupted && <span className="ml-1 text-site/60">(interrupted)</span>}
                  </div>
                );
              if (t.kind === "agent")
                return (
                  <div key={i} className="mr-auto max-w-full sm:max-w-[90%]">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Property Advisor</div>
                    <div className="whitespace-pre-wrap break-words rounded-2xl rounded-tl-md border border-line bg-paper/70 px-3.5 py-3 text-[14px] leading-relaxed">{t.text}</div>
                  </div>
                );
              if (t.kind === "event")
                return (
                  <p key={i} className="mx-auto max-w-full break-words rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-center text-[11.5px] font-semibold text-gold">
                    ● {t.label}
                  </p>
                );
              if (t.kind === "show")
                return (
                  <p key={i} className="mx-auto text-[11.5px] uppercase tracking-[0.14em] text-ink-soft">
                    ▣ screen → <span className="text-gold">{VIEW_LABEL[t.view as View] ?? t.view}</span>
                  </p>
                );
              if (t.kind === "handoff")
                return (
                  <p key={i} className="mx-auto max-w-full break-words rounded-xl border border-line px-3 py-1.5 text-center text-[12px] font-semibold text-gold">
                    ☎ handoff → {t.items.filter((it) => it.done).map((it) => it.label).join(", ") || "no context yet"}
                  </p>
                );
              return null;
            })}
            {snap.turns.length === 0 && <p className="text-[13px] text-ink-soft">No conversation yet.</p>}
            {snap.busy && <p className="animate-pulse text-[12px] text-ink-soft">Property Advisor is working…</p>}
          </div>
        </section>

        {/* right: how the agent got there */}
        <section className="order-3 lg:col-span-4">
          <SectionHead>Tool trace</SectionHead>
          <div className="mt-4 rounded-3xl border border-line bg-card/60 p-3 lg:max-h-[640px] lg:min-h-[200px] lg:overflow-auto lg:p-4">
            <ol className="space-y-2.5">
              {snap.trace.map((t) => (
                <li key={t.id} className="rounded-2xl border border-line bg-paper/60 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[12.5px] font-semibold text-gold">{t.name}</span>
                    <span className="rounded-full bg-line px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">Turn {t.turn}</span>
                  </div>
                  {compactArgs(t.args) && <p className="mt-1.5 break-words font-mono text-[11px] leading-relaxed text-ink-soft">{compactArgs(t.args)}</p>}
                  <p className="mt-2 border-t border-line pt-2 text-[12px]">{t.pill ?? <span className="animate-pulse text-ink-soft">running…</span>}</p>
                </li>
              ))}
            </ol>
            {snap.trace.length === 0 && <p className="px-1 py-2 text-[13px] text-ink-soft">No tool calls yet.</p>}
          </div>
        </section>
      </div>

      <p className="mt-8 border-t border-line pt-4 text-[11.5px] leading-relaxed text-ink-soft">
        One session, mirrored from the customer&rsquo;s tab. Real: the agent&rsquo;s reasoning, tool calls, inventory, guardrails and the
        avatar stream. Simulated: OTP, payment, KYC and persistence.
      </p>
    </main>
  );
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "gold" }) {
  return (
    <div className="min-w-0 border-b border-line px-4 py-4 even:border-l [&:nth-last-child(-n+2)]:border-b-0 sm:px-5 sm:py-5 sm:border-l sm:first:border-l-0 sm:[&:nth-child(3n+1)]:border-l-0 sm:[&:nth-last-child(-n+3)]:border-b-0 lg:border-b-0 lg:[&:nth-child(3n+1)]:border-l">
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-soft">{label}</div>
      <div className={`mt-1.5 font-display text-[34px] font-medium leading-none sm:text-[40px] ${tone === "gold" ? "text-gold" : ""}`}>{value}</div>
      {hint && <div className="mt-1.5 text-[11px] text-ink-soft">{hint}</div>}
    </div>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-soft">
      {children}
      <span className="h-px flex-1 bg-linear-to-r from-gold/40 to-transparent" />
    </h2>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-gold/15 pb-1">
      <span className="text-ink-soft">{k}</span>
      <span className="text-right font-semibold">{v}</span>
    </div>
  );
}

function compactArgs(args: unknown): string {
  if (!args || typeof args !== "object") return "";
  return Object.entries(args as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(" ");
}

function fmtDuration(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
