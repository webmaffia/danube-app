// The welcome questions asked right after registration. They run scripted (no
// model call), so they're instant and identical every time. Once all three are
// answered, the Property Advisor takes over with the answers as the customer's
// profile.

import type { Profile } from "@/lib/agent/prompt";

export interface OnboardingQuestion {
  ask: (name: string | null) => string;
  options: string[];
}

/**
 * Spoken before the first question: who Danube is and who the Property
 * Advisor is. Figures are from danubeproperties.com.
 */
export function intro(name: string | null): string {
  const first = name?.split(" ")[0];
  return `Hi${first ? ` ${first}` : ""}, welcome to Danube Properties. Danube has been building in Dubai since 1993, and is known for its 1% monthly payment plan, freehold homes and over 25 million square feet of projects. I'm your Property Advisor. I'll help you find the right unit, answer anything about price, location or paperwork, and hold a unit for you when you're ready.`;
}

export const QUESTIONS: OnboardingQuestion[] = [
  {
    // The opener minus its greeting, which the intro already covers.
    ask: () => "Let's find the right home for you. What are you mainly buying for?",
    options: ["Investment", "Personal use", "Both"],
  },
  {
    ask: () => "What's your approximate budget?",
    options: ["< AED 1.5M", "AED 1.5M – 2.5M", "AED 2.5M – 4M", "> AED 4M"],
  },
  {
    ask: () => "What matters most to you in this purchase?",
    options: ["Rental income", "Long-term wealth creation", "Golden Visa", "A home to live in"],
  },
];

const BUDGETS: Record<string, number> = {
  "< AED 1.5M": 1_500_000,
  "AED 1.5M – 2.5M": 2_500_000,
  "AED 2.5M – 4M": 4_000_000,
  "> AED 4M": 8_000_000,
};

/** Maps the three answers onto the profile fields the agent and search use. */
export function profileFrom(answers: string[]): Partial<Profile> {
  const [buyingFor, budget, priority] = answers;
  const byPriority: Record<string, string | null> = {
    "Rental income": "rental_income",
    "Long-term wealth creation": "investment",
    "Golden Visa": "golden_visa",
    "A home to live in": "self_use",
  };
  const byBuyingFor: Record<string, string> = { Investment: "investment", "Personal use": "self_use", Both: "investment" };
  return {
    purpose: byPriority[priority] ?? byBuyingFor[buyingFor] ?? null,
    budget_max: BUDGETS[budget] ?? null,
  };
}

// The budget in full, so every figure carries its AED prefix and the guardrail
// reads "1,500,000" rather than a bare "1.5M" (which would parse as metres).
const BUDGET_TEXT: Record<string, string> = {
  "< AED 1.5M": "under AED 1,500,000",
  "AED 1.5M – 2.5M": "between AED 1,500,000 and AED 2,500,000",
  "AED 2.5M – 4M": "between AED 2,500,000 and AED 4,000,000",
  "> AED 4M": "above AED 4,000,000",
};

/** The hand-off message the agent sees (not shown in the transcript). */
export function handoff(answers: string[]): string {
  const [buyingFor, budget, priority] = answers;
  return `[Onboarding] The customer answered the welcome questions in the app. Buying for: ${buyingFor}. Approximate budget: ${BUDGET_TEXT[budget] ?? budget}. What matters most: ${priority}.`;
}
