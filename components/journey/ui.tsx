// Shared building blocks for the journey screens.

import { AppLink as Link } from "@/lib/nav";
import type { ReactNode } from "react";

export function ScreenTitle({ eyebrow, title, sub, right }: { eyebrow?: string; title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-4 desk:px-0 desk:pt-12">
      <div className="min-w-0">
        {eyebrow && <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-gold">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-[30px] font-medium leading-[1.05] tracking-tight desk:mt-2 desk:text-[52px]">{title}</h1>
        {sub && <p className="mt-1 text-[13.5px] leading-snug text-ink-soft desk:mt-3 desk:text-[17px]!">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Section({ title, children, className = "", id }: { title?: string; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`scroll-mt-3 px-4 pt-7 desk:px-0 desk:pt-14 ${className}`}>
      {title && (
        <h2 className="mb-4 flex items-center gap-3 font-display text-[20px] font-semibold uppercase leading-none tracking-[0.12em] text-ink desk:mb-6 desk:text-[26px]">
          <span className="h-px flex-1 bg-gold/60 desk:hidden" />
          <span className="text-center desk:text-left">{title}</span>
          <span className="h-px flex-1 bg-gold/60" />
        </h2>
      )}
      {children}
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-card shadow-[0_10px_28px_-22px_rgb(0_0_0/0.25)] ${className}`}>{children}</div>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="min-w-0 px-3 text-center">
      <div className="text-[10.5px] font-medium uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 font-display text-[19px] font-semibold leading-tight tracking-tight">{value}</div>
      {hint && <div className="text-[11px] text-ink-soft">{hint}</div>}
    </div>
  );
}

export function SandboxTag({ label = "Sandbox" }: { label?: string }) {
  return (
    <span className="shrink-0 rounded-full border border-gold px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">{label}</span>
  );
}

/**
 * The one CTA style for every screen: gold gradient primary, dark bordered
 * secondary. Pass `href` to render a link with the same look. Use `size="sm"`
 * only for buttons tucked inside chat bubbles.
 */
export function Button({
  children,
  onClick,
  href,
  variant = "primary",
  size = "md",
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "gold";
  size?: "md" | "sm";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const styles = {
    primary: "bg-charcoal text-white ring-1 ring-inset ring-white/15",
    secondary: "border border-charcoal/40 bg-transparent text-charcoal hover:bg-charcoal/5 active:bg-charcoal/10",
    gold: "bg-charcoal text-white",
  }[variant];
  const sizing = size === "sm" ? "h-9 rounded-full px-4 text-[12px] tracking-[0.04em]" : "h-[52px] rounded-full px-5 text-[12.5px] uppercase tracking-[0.1em] whitespace-nowrap";
  const cls = `flex items-center justify-center gap-2 font-semibold transition duration-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 ${sizing} ${styles} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

/**
 * Pins a screen's CTAs to the bottom of the scroll area. Put it last in the
 * screen, and give the screen's root `flex min-h-full flex-col` so it also
 * sits at the bottom when the content is short.
 */
export function StickyBar({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div
      className={`sticky bottom-0 z-10 mt-auto flex shrink-0 flex-col gap-2 border-t border-line bg-paper/90 px-4 pb-3 pt-4 backdrop-blur-xl desk:static desk:mt-10 desk:max-w-[520px] desk:border-0 desk:bg-transparent desk:px-0 desk:pb-0 desk:pt-0 desk:backdrop-blur-none ${className}`}
    >{children}</div>;
}

export function Badge({ children, tone = "verd" }: { children: ReactNode; tone?: "verd" | "gold" | "muted" }) {
  const styles = { verd: "bg-verd-soft text-verd", gold: "bg-gold-soft text-gold", muted: "bg-line text-ink-soft" }[tone];
  return <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${styles}`}>{children}</span>;
}

/** Small print that must stay visible: risk, in-principle, sandbox. */
export function Disclosure({ children }: { children: ReactNode }) {
  return <p className="mx-4 mt-6 rounded-xl border border-dashed desk:mx-0 desk:mt-14 border-line px-3 py-2.5 text-[11.5px] leading-relaxed text-ink-soft">{children}</p>;
}

export function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 px-4 pt-3 desk:px-0 desk:pt-6" aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1 flex-1 rounded-full ${i < current ? "bg-gold" : "bg-line"}`} />
      ))}
    </div>
  );
}

export function Field({ label, children, hint, error }: { label: string; children: ReactNode; hint?: string; error?: string | null }) {
  return (
    <label className="block text-[12.5px] font-medium text-ink-soft">
      {label}
      <div className="mt-1.5">{children}</div>
      {error ? <span className="mt-1 block text-[12px] text-danger">{error}</span> : hint ? <span className="mt-1 block text-[11.5px]">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "h-12 w-full rounded-xl border border-line bg-card px-3.5 text-[15px] text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-gold focus:shadow-[0_0_0_3px_rgb(201_176_142/0.15)]";
