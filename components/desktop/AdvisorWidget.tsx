"use client";

// The Property Advisor on desktop: a chat widget pinned bottom right, over the
// page. Open, it's a compact window (avatar on top, conversation, input);
// minimised, it's a launcher pill. The window stays mounted while minimised,
// only hidden, so the avatar's video and voice carry on without a remount.

import { useState, type ReactNode } from "react";
import type { Turn } from "@/lib/store";
import { avatar, useAvatar } from "@/lib/avatar/controller";
import { AvatarStage } from "@/components/agent/AvatarStage";
import { Transcript } from "@/components/agent/Transcript";
import { Composer } from "@/components/agent/Composer";
import { SvgAvatar } from "@/components/SvgAvatar";

export function AdvisorWidget({
  turns,
  busy,
  error,
  chips,
  banner,
  autoOpen,
  onSend,
  onRetry,
}: {
  turns: Turn[];
  busy: boolean;
  error: string | null;
  chips: string[];
  /** Pinned above the input, e.g. the "avatar failed" note. */
  banner?: ReactNode;
  /** Open by itself (the welcome questions); after that it stays however the customer leaves it. */
  autoOpen: boolean;
  onSend: (text: string) => void;
  onRetry: () => void;
}) {
  const { mode, speaking, dismissed } = useAvatar();
  // Set once the widget has opened itself or the customer has used it, so it never springs open again.
  const [latched, setLatched] = useState(false);
  const [open, setOpen] = useState(false);
  if (autoOpen && !latched) {
    setLatched(true);
    setOpen(true);
  }
  // Turn count when the window was last closed, to flag what arrived since.
  const [seen, setSeen] = useState(turns.length);
  const unread = !open && turns.length > seen;
  const showAvatar = mode === "avatar" && !dismissed;

  const toggle = (next: boolean) => {
    setLatched(true);
    setOpen(next);
    if (!next) setSeen(turns.length);
  };

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[80] flex flex-col items-end gap-3">
      <section
        aria-label="Property Advisor"
        aria-hidden={!open}
        className={`pointer-events-auto flex h-[min(640px,calc(100dvh-120px))] w-[392px] origin-bottom-right flex-col overflow-hidden rounded-3xl border border-gold/30 bg-card shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45)] transition duration-200 ${
          open ? "scale-100 opacity-100" : "pointer-events-none invisible scale-95 opacity-0"
        }`}
      >
        <header className="relative shrink-0">
          {showAvatar ? (
            <div className="relative h-[200px] bg-site">
              <AvatarStage pip={false} panel onExpand={() => {}} />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
              <p className="pointer-events-none absolute bottom-3 left-8 text-[13px] font-semibold text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]">
                Property Advisor
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-site px-4 py-3.5 text-site-ink">
              <div className="h-10 w-10 overflow-hidden rounded-full ring-1 ring-white/30">
                <SvgAvatar speaking={false} compact />
              </div>
              <p className="flex-1 text-[14px] font-semibold">Property Advisor</p>
              {mode === "avatar" && dismissed && (
                <button onClick={() => avatar.restore()} className="mr-9 rounded-full border border-white/30 px-3 py-1.5 text-[12px] font-semibold hover:bg-white/10">
                  Bring back the avatar
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => toggle(false)}
            aria-label="Minimise the Property Advisor"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-paper">
          <Transcript turns={turns} busy={busy} error={error} showPills onRetry={onRetry} />
        </div>
        {banner}
        <Composer chips={chips} busy={busy} onSend={onSend} />
      </section>

      {!open && (
        <button
          onClick={() => toggle(true)}
          aria-label="Open the Property Advisor"
          className="pointer-events-auto relative flex items-center gap-3 rounded-full border border-gold/40 bg-site py-2 pl-2 pr-6 text-site-ink shadow-[0_18px_40px_-12px_rgb(0_0_0/0.5)] transition hover:-translate-y-0.5"
        >
          <span className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-gold/70">
            <SvgAvatar speaking={speaking} compact />
          </span>
          <span className="text-left">
            <span className="block text-[14px] font-semibold leading-tight">Ask your advisor</span>
            <span className="block text-[11.5px] text-white/65">{busy ? "Thinking…" : speaking ? "Speaking…" : "Property Advisor"}</span>
          </span>
          {unread && <span className="absolute right-1 top-1 h-3 w-3 rounded-full bg-[#ed1c24] ring-2 ring-site" />}
        </button>
      )}
    </div>
  );
}
