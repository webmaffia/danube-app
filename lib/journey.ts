// Maps the agent's `show` views to routes and back. The agent drives the
// screen; the customer can also navigate, and the current screen goes back to
// the agent as context on every turn.

import { findUnit } from "@/lib/inventory";

export type View = "recommendations" | "project" | "location" | "units" | "unit" | "calculator" | "booking" | "kyc" | "plan";

export interface Screen {
  view: View;
  id: string | null;
}

export const VIEW_LABEL: Record<View, string> = {
  recommendations: "Recommendations",
  project: "Project details",
  location: "Site location",
  units: "Unit map",
  unit: "Unit details",
  calculator: "Payment plan calculator",
  booking: "Booking",
  kyc: "KYC",
  plan: "Payment schedule",
};

export function routeFor(screen: Screen): string {
  switch (screen.view) {
    case "recommendations":
      return "/units";
    case "project":
      return `/units/${screen.id ?? "bayz102"}`;
    case "location":
      return `/units/${screen.id ?? "bayz102"}`;
    case "units":
      return `/units/${screen.id ?? "bayz102"}/map`;
    case "unit": {
      const unit = screen.id ? findUnit(screen.id) : undefined;
      return `/units/${unit?.projectId ?? "bayz102"}/map`;
    }
    case "calculator":
      return "/money/calculator";
    case "booking":
      return "/booking";
    case "kyc":
      return "/booking/kyc";
    case "plan":
      return "/booking/plan";
  }
}

/** The screen a path shows, or null for the bare advisor screen. */
export function screenFromPath(path: string, selectedUnit: string | null): Screen | null {
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "units") {
    if (parts.length === 1) return { view: "recommendations", id: null };
    if (parts[2] === "map") return selectedUnit && findUnit(selectedUnit)?.projectId === parts[1] ? { view: "unit", id: selectedUnit } : { view: "units", id: parts[1] };
    return { view: "project", id: parts[1] };
  }
  if (parts[0] === "money") return { view: "calculator", id: selectedUnit };
  if (parts[0] === "booking") return { view: parts[1] === "kyc" ? "kyc" : parts[1] === "plan" ? "plan" : "booking", id: selectedUnit };
  return null;
}

// ---------------------------------------------------------------- formatting

export function aedShort(amount: number, digits = 2): string {
  if (amount >= 1e6) return `AED ${(amount / 1e6).toFixed(digits)}M`;
  return `AED ${Math.round(amount / 1e3).toLocaleString("en-US")}K`;
}

export function aed(amount: number): string {
  return `AED ${Math.round(amount).toLocaleString("en-US")}`;
}

export function sqft(n: number): string {
  return `${n.toLocaleString("en-US")} sq ft`;
}

/** Whole years since an ISO date (yyyy-mm-dd), or null if it isn't one. */
export function yearsSince(iso: string): number | null {
  const t = new Date(iso).getTime();
  if (!iso || Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / (365.25 * 86400000));
}

export function dateIn(days: number, from = Date.now()): string {
  return new Date(from + days * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ------------------------------------------------------- payment schedule

export interface ScheduleStep {
  key: "down" | "spa" | "oqood" | "monthly";
  title: string;
  detail: string;
  /** Present when the step takes a payment. */
  amount?: number;
  date: string;
}

/**
 * The steps after KYC, in order: the rest of the 20% down payment, the sales
 * and purchase agreement, Oqood registration and the first 1% monthly
 * instalment (of `months`). Dates run from the day the token was paid.
 */
export function scheduleSteps(price: number, token: number, paidAt: number, months = 40): ScheduleStep[] {
  const down = price * 0.2 - token;
  const monthly = price * 0.01;
  return [
    { key: "down", title: "Balance of down payment", detail: `${aed(down)} · completes the 20% down payment`, amount: down, date: dateIn(30, paidAt) },
    { key: "spa", title: "Sales and purchase agreement", detail: "Issued once the down payment is complete", date: dateIn(37, paidAt) },
    { key: "oqood", title: "Oqood registration", detail: "Your purchase is registered with the Dubai Land Department", date: dateIn(45, paidAt) },
    { key: "monthly", title: "First 1% monthly instalment", detail: `${aed(monthly)} a month for ${months} months, then the balance on completion`, amount: monthly, date: dateIn(60, paidAt) },
  ];
}
