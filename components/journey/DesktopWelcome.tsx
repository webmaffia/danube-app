"use client";

// The desktop content pane while the conversation is the only thing going on
// (the welcome questions, or before the advisor has opened a screen): a hero
// that shows where the customer is in the questions, a few projects to look at
// while they answer, and how the rest of the journey works.

import Image from "next/image";
import { useAppRouter as useRouter } from "@/lib/nav";
import { useSession } from "@/lib/store";
import { PROJECTS, STATUS_LABEL, entryTicket } from "@/lib/inventory";
import { aedShort } from "@/lib/journey";
import { Button } from "@/components/journey/ui";
import { ArrowIcon, PinIcon } from "@/components/icons";

const QUESTION_LABELS = ["Buying for", "Budget", "What matters most"];

const HOW_IT_WORKS = [
  { title: "Tell us what matters", text: "Three quick questions: why you're buying, your budget and your priority." },
  { title: "Get matched", text: "Your advisor ranks Danube projects against your answers, using live availability." },
  { title: "Reserve with a token", text: "Pick a unit on the map, hold it with a refundable token, then follow the 1% plan." },
];

export function DesktopWelcome() {
  const router = useRouter();
  const first = useSession((s) => s.profile.name)?.split(" ")[0];
  const onboarding = useSession((s) => s.onboarding);
  const featured = PROJECTS.filter((p) => p.availability === "available" && p.image).slice(0, 3);

  return (
    <div className="d-full pb-8">
      <section className="relative overflow-hidden bg-site text-white">
        <Image src="/brand/desktop/breez-waterfront.webp" alt="" fill sizes="100vw" quality={85} priority className="object-cover [object-position:center_35%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
        <div className="d-wrap relative grid gap-10 py-20 desk:grid-cols-[1.1fr_1fr] desk:items-center">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.32em] text-[#e0cfb0]">Property Advisor</p>
            <h1 className="mt-4 font-display text-[56px] font-medium leading-[1.02] tracking-tight [text-shadow:0_2px_16px_rgb(0_0_0/0.4)]">
              {first ? `Welcome, ${first}.` : "Welcome."}
              <br />
              Let&rsquo;s find your home.
            </h1>
            <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-white/85">
              {onboarding
                ? "Answer your advisor's questions in the chat at the bottom right. Matching projects open here as soon as they're ready."
                : "Ask your advisor anything in the chat at the bottom right, or browse every Danube project yourself."}
            </p>
            {!onboarding && (
              <div className="mt-8 max-w-[300px]">
                <Button onClick={() => router.push("/units")}>
                  Browse projects
                  <ArrowIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {onboarding && (
            <ol className="rounded-3xl border border-white/20 bg-black/40 p-6 backdrop-blur-md" aria-label="Your questions">
              {QUESTION_LABELS.map((label, i) => {
                const done = i < onboarding.answers.length;
                const current = i === onboarding.step && !done;
                return (
                  <li key={label} className={`flex items-center gap-4 py-3 ${i > 0 ? "border-t border-white/15" : ""}`}>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
                        done ? "bg-gold text-site" : current ? "border-2 border-gold text-gold" : "border border-white/30 text-white/50"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[12px] font-semibold uppercase tracking-[0.16em] ${current || done ? "text-[#e0cfb0]" : "text-white/45"}`}>{label}</span>
                      <span className={`block truncate text-[16px] ${done ? "font-semibold text-white" : current ? "text-white/90" : "text-white/40"}`}>
                        {done ? onboarding.answers[i] : current ? "Waiting for your answer…" : "Coming up"}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      <div className="d-wrap">
      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-[34px] font-medium tracking-tight">Featured Danube projects</h2>
          <button onClick={() => router.push("/units")} className="text-[13px] font-semibold uppercase tracking-[0.12em] text-gold hover:underline">
            See all projects →
          </button>
        </div>
        <div className="mt-6 grid gap-5 desk:grid-cols-3">
          {featured.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/units/${p.id}`)}
              className="group overflow-hidden rounded-2xl border border-line bg-card text-left transition hover:-translate-y-1 hover:shadow-[0_24px_50px_-26px_rgb(0_0_0/0.4)]"
            >
              <div className="relative h-52 bg-site">
                <Image src={p.image!} alt={p.name} fill sizes="400px" className="object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <div className="font-display text-[24px] font-semibold tracking-tight">{p.name}</div>
                <p className="mt-1 flex items-center gap-1 text-[13px] text-ink-soft">
                  <PinIcon className="h-3.5 w-3.5 shrink-0" />
                  {p.location}
                </p>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
                  <span className="rounded bg-verd-soft px-1.5 py-px text-verd">{STATUS_LABEL[p.status]}</span>
                  {entryTicket(p) > 0 && <span className="text-gold">From {aedShort(entryTicket(p), 1)}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-[34px] font-medium tracking-tight">How it works</h2>
        <ol className="mt-6 grid gap-5 desk:grid-cols-3">
          {HOW_IT_WORKS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-line bg-card p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/60 font-display text-[16px] font-semibold text-gold">{i + 1}</span>
              <h3 className="mt-4 text-[17px] font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
      </div>
    </div>
  );
}
