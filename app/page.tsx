import { Logo } from "@/components/Logo";
import { Skyline } from "@/components/Skyline";
import { ResumeCta } from "@/components/ResumeCta";
import { WelcomeBack } from "@/components/WelcomeBack";

import { HeroSlider } from "@/components/HeroSlider";

// Building shots supplied in public/brand/image. `position` keeps the tower in
// frame when the wide image is cropped to a phone screen.
const SLIDES = [
  { src: "/brand/image/danube-2.png", name: "Serenz by Danube", position: "56% center" },
  { src: "/brand/image/danube.png", name: "Shahrukhz by Danube", position: "52% center" },
  { src: "/brand/image/danube-3.png", name: "Aspirz by Danube", position: "82% center" },
];

export default function Landing() {
  return (
    <main className="relative flex min-h-full flex-col overflow-hidden bg-site text-white">
      {/* Danube project photos; the gradient and skyline show while they load or if none is set. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,#173e62_0%,#0d2740_45%,#050e17_85%)]" />
      <Skyline className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] w-full text-[#BDA588]" opacity={0.35} />
      <HeroSlider slides={SLIDES} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/85" />

      <header className="relative z-10 flex items-start justify-between px-6 pt-6">
        <Logo className="w-48" priority />
      </header>

      <section className="relative z-10 mt-auto px-6 pb-4">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#d9c6a6] [text-shadow:0_1px_6px_rgb(0_0_0/0.6)]">Property Advisor</p>
        <h1 className="font-display text-[38px] font-semibold leading-[1.04] tracking-tight [text-shadow:0_2px_12px_rgb(0_0_0/0.35)]">
          Find a Dubai home worth owning, in one conversation.
        </h1>
        <p className="mt-4 max-w-[36ch] text-[15px] leading-relaxed text-white/90 [text-shadow:0_1px_6px_rgb(0_0_0/0.5)]">
          Share your budget and what matters most. Your Property Advisor matches you with Danube homes, walks you through the 1% payment plan, and
          reserves your favourite unit when you&rsquo;re ready.
        </p>
      </section>

      <section className="relative z-10 px-6 pb-8 pt-4">
        <ResumeCta />
        <p className="mt-4 text-center text-[12px] leading-relaxed text-white/65">
          You&rsquo;ll be speaking with Danube&rsquo;s virtual Property Advisor. OTP, payment and KYC steps are simulated in this prototype, and
          prices are sample data.
        </p>
        <p className="mt-2 text-center text-[12px]">
          <a href="/console" target="_blank" rel="noreferrer" className="font-semibold text-white/70 underline underline-offset-2">
            Presenter console
          </a>
        </p>
      </section>
      <WelcomeBack />
    </main>
  );
}
