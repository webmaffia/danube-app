"use client";

// The landing page's main call to action. A returning customer's session is
// in localStorage, so instead of sending them through registration again,
// this lands them back on the screen they last had open.

import { AppLink as Link } from "@/lib/nav";
import { useAppRouter as useRouter } from "@/lib/nav";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/store";
import { routeFor } from "@/lib/journey";
import { ArrowIcon } from "@/components/icons";

export function ResumeCta() {
  const router = useRouter();
  const [resume, setResume] = useState<{ href: string; label: string } | null>(null);

  useEffect(() => {
    const s = useSession.getState();
    if (!s.profile.name) return;
    setResume({
      href: s.screen ? routeFor(s.screen) : "/agent",
      label: `Continue as ${s.profile.name.split(" ")[0]}`,
    });
  }, []);

  return (
    <>
      <Link
        href={resume?.href ?? "/register"}
        className="group relative flex h-14 w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-b from-[#e6d3b3] to-[#bda588] text-[13px] font-bold uppercase tracking-[0.12em] text-[#1a1612] shadow-[0_10px_30px_-6px_rgba(189,165,136,0.55),inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-white/30 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-6px_rgba(189,165,136,0.7),inset_0_1px_0_rgba(255,255,255,0.7)] active:translate-y-0 active:scale-[0.98]"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/4 -skew-x-12 bg-white/50 blur-md transition-transform duration-700 group-hover:translate-x-[500%]"
        />
        <span className="relative">{resume?.label ?? "Get Started"}</span>
        <ArrowIcon className="relative h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
      {resume && (
        <button
          onClick={() => {
            useSession.getState().reset();
            router.push("/register");
          }}
          className="mt-3 w-full text-center text-[12px] font-medium text-white/65 underline underline-offset-2"
        >
          Start over instead
        </button>
      )}
    </>
  );
}
