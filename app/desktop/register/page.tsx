import Image from "next/image";
import Register from "@/app/register/page";
import { Logo } from "@/components/Logo";

const BENEFITS = [
  { title: "20% down, then 1% a month", text: "Danube's payment plan, explained in plain numbers." },
  { title: "Live availability", text: "See which units are open right now and what they cost." },
  { title: "Reserve in minutes", text: "Hold your favourite unit with a refundable token." },
];

const STATS = [
  { value: "1%", label: "Monthly plan" },
  { value: "0%", label: "Interest" },
  { value: "2 min", label: "To start" },
];

const STEPS = ["Verify your number", "Chat with your advisor", "Shortlist and reserve"];

// Desktop sign-up: the phone form beside Serenz. The image is the site's banner with its
// title (the left 37%) cut off the file, so no width of panel can show it.
export default function DesktopRegister() {
  return (
    <div className="flex min-h-full">
      <div className="relative hidden flex-1 overflow-hidden bg-site lg:block">
        <Image src="/brand/desktop/serenz-tower.webp" alt="Serenz by Danube" fill sizes="(min-width: 1024px) 60vw, 100vw" quality={90} priority className="object-cover [object-position:center_25%]" />
        <div className="absolute inset-0 bg-gradient-to-l from-black/75 via-black/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25" />

        <div className="relative flex h-full flex-col justify-center p-14">
          <Logo className="absolute left-14 top-14 w-48" onDark />

          <div className="ml-auto max-w-[520px] pr-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.32em] text-[#e0cfb0]">Property Advisor</p>
            <h2 className="mt-4 font-display text-[52px] font-medium leading-[1.02] tracking-tight text-white [text-shadow:0_2px_16px_rgb(0_0_0/0.45)]">
              Your Dubai home is one conversation away.
            </h2>

            <ul className="mt-8 space-y-4">
              {BENEFITS.map((b) => (
                <li key={b.title} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-site" aria-hidden>
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8.5l3.2 3L13 4.5" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-[16px] font-semibold text-white">{b.title}</span>
                    <span className="block text-[14px] leading-snug text-white/75">{b.text}</span>
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-10 grid max-w-[460px] grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/20 bg-white/15 backdrop-blur-md">
              {STATS.map((s) => (
                <div key={s.label} className="bg-black/35 px-5 py-4">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-[30px] font-medium leading-none text-white">{s.value}</dd>
                  <dd className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/65">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-paper px-6 py-10 lg:w-[620px] lg:shrink-0">
        <div className="w-full max-w-[480px]">
          <div className="[&>main]:min-h-0">
            <Register />
          </div>

          <ol className="mx-6 mt-10 flex items-start gap-4 border-t border-line pt-6">
            {STEPS.map((s, i) => (
              <li key={s} className="flex flex-1 items-start gap-2.5 text-[12.5px] leading-snug text-ink-soft">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/60 text-[11px] font-semibold text-gold">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <p className="mx-6 mt-5 text-[11.5px] leading-relaxed text-muted">
            OTP, payment and KYC steps are simulated in this prototype, and prices are sample data.
          </p>
        </div>
      </div>
    </div>
  );
}
