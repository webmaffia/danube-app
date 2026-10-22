import { describe, expect, it } from "vitest";
import { QUESTIONS, handoff, intro, profileFrom } from "@/lib/onboarding";
import { collectEvidence } from "@/lib/agent/guard";

describe("welcome questions", () => {
  it("asks three preset questions with their options", () => {
    expect(QUESTIONS.map((q) => q.options.length)).toEqual([3, 4, 4]);
    expect(QUESTIONS[0].ask(null)).toBe("Let's find the right home for you. What are you mainly buying for?");
  });

  it("introduces Danube and the Property Advisor first, by first name", () => {
    expect(intro("Priya Nair")).toMatch(/^Hi Priya, welcome to Danube Properties\./);
    expect(intro("Priya Nair")).toMatch(/I'm your Property Advisor/);
    expect(intro(null)).toMatch(/^Hi, welcome/);
    expect(intro("Priya")).not.toMatch(/\bAI\b/);
  });

  it("never uses the word AI", () => {
    for (const q of QUESTIONS) expect(q.ask("Ravi")).not.toMatch(/\bAI\b/);
  });

  it("maps answers onto the profile", () => {
    expect(profileFrom(["Investment", "AED 1.5M – 2.5M", "Long-term wealth creation"])).toEqual({ purpose: "investment", budget_max: 2_500_000 });
    expect(profileFrom(["Personal use", "< AED 1.5M", "A home to live in"])).toEqual({ purpose: "self_use", budget_max: 1_500_000 });
    expect(profileFrom(["Both", "something typed", "Rental income"])).toEqual({ purpose: "rental_income", budget_max: null });
    expect(profileFrom(["Investment", "> AED 4M", "Golden Visa"])).toEqual({ purpose: "golden_visa", budget_max: 8_000_000 });
  });

  it("hands the budget to the agent as figures it may repeat", () => {
    const ev = collectEvidence(handoff(["Investment", "AED 1.5M – 2.5M", "Long-term wealth creation"]));
    expect(ev.numbers).toEqual(expect.arrayContaining([1_500_000, 2_500_000]));
  });
});
