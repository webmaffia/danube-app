import { Logo } from "@/components/Logo";
import { Skyline } from "@/components/Skyline";
import { ResumeCta } from "@/components/ResumeCta";
import { WelcomeBack } from "@/components/WelcomeBack";
import { HeroSlider } from "@/components/HeroSlider";

// Wide 1920x1080 shots from danubeproperties.com, the ones with no title baked
// into them, so the headline on the left has clear sky and sea behind it.
const SLIDES = [
  { src: "/brand/desktop/breez-waterfront.webp", name: "Breez by Danube", position: "center 40%" },
  { src: "/brand/desktop/shahrukhz-facade.webp", name: "Shahrukhz by Danube", position: "center 40%" },
];

export default function DesktopLanding() {
  return (
    <main className="relative flex min-h-full flex-col overflow-hidden bg-site text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,#555555_0%,#333333_45%,#1a1a1a_85%)]" />
      <Skyline className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] w-full text-[#BDA588]" opacity={0.35} />
      <HeroSlider slides={SLIDES} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      <header className="relative z-10 flex items-center justify-between px-14 pt-10">
        <Logo className="w-56" priority onDark />
        <a href="/console" target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-white/70 underline underline-offset-2">
          Presenter console
        </a>
      </header>

      <section className="relative z-10 my-auto max-w-[620px] px-14 py-16">
        <div className="mb-5 flex items-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-[#e6d7bf] to-transparent" />
          <p className="text-[12px] font-semibold uppercase tracking-[0.34em] text-[#e0cfb0]">Property Advisor</p>
        </div>
        <h1 className="font-display text-[64px] font-medium leading-[1] tracking-tight [text-shadow:0_2px_20px_rgb(0_0_0/0.4)]">
          Find a Dubai home worth owning, in one conversation.
        </h1>
        <p className="mt-6 max-w-[52ch] text-[18px] leading-relaxed text-white/90 [text-shadow:0_1px_6px_rgb(0_0_0/0.5)]">
          Share your budget and what matters most. Your Property Advisor matches you with Danube homes, walks you through the 1% payment plan, and
          reserves your favourite unit when you&rsquo;re ready.
        </p>
        <div className="mt-9 max-w-[380px]">
          <ResumeCta />
        </div>
        <p className="mt-6 max-w-[56ch] text-[13px] leading-relaxed text-white/65">
          You&rsquo;ll be speaking with Danube&rsquo;s virtual Property Advisor. OTP, payment and KYC steps are simulated in this prototype, and prices
          are sample data.
        </p>
      </section>
      <WelcomeBack />
    </main>
  );
}
