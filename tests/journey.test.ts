import { describe, expect, it } from "vitest";
import { aed, aedShort, routeFor, scheduleSteps, screenFromPath } from "@/lib/journey";
import { getUnits } from "@/lib/inventory";
import { unitLine, screenCue } from "@/lib/avatar/screen-lines";

describe("journey routes", () => {
  it("maps every agent view to a route", () => {
    const unit = getUnits("shahrukhzres")[0];
    expect(routeFor({ view: "recommendations", id: null })).toBe("/units");
    expect(routeFor({ view: "project", id: "shahrukhzres" })).toBe("/units/shahrukhzres");
    expect(routeFor({ view: "units", id: "bayz102" })).toBe("/units/bayz102/map");
    expect(routeFor({ view: "unit", id: unit.id })).toBe("/units/shahrukhzres/map");
    expect(routeFor({ view: "calculator", id: null })).toBe("/money/calculator");
    expect(routeFor({ view: "booking", id: null })).toBe("/booking");
    expect(routeFor({ view: "kyc", id: null })).toBe("/booking/kyc");
    expect(routeFor({ view: "plan", id: null })).toBe("/booking/plan");
  });

  it("reads the screen back from a path", () => {
    expect(screenFromPath("/agent", null)).toBeNull();
    expect(screenFromPath("/units", null)).toEqual({ view: "recommendations", id: null });
    expect(screenFromPath("/units/bayz102", null)).toEqual({ view: "project", id: "bayz102" });
    expect(screenFromPath("/units/bayz102/map", null)).toEqual({ view: "units", id: "bayz102" });
    expect(screenFromPath("/units/bayz102/map", "bayz102-5")).toEqual({ view: "unit", id: "bayz102-5" });
    expect(screenFromPath("/units/shahrukhzres/map", "bayz102-5")).toEqual({ view: "units", id: "shahrukhzres" });
    expect(screenFromPath("/booking/kyc", null)).toEqual({ view: "kyc", id: null });
  });
});

describe("money formatting", () => {
  it("writes AED amounts", () => {
    expect(aed(20000)).toBe("AED 20,000");
    expect(aedShort(1_250_000)).toBe("AED 1.25M");
    expect(aedShort(1_250_000, 1)).toBe("AED 1.3M");
    expect(aedShort(525_000)).toBe("AED 525K");
  });
});

describe("payment schedule", () => {
  it("completes the 20% down payment, then runs 1% a month", () => {
    const steps = scheduleSteps(1_000_000, 20_000, 0);
    expect(steps.map((s) => s.key)).toEqual(["down", "spa", "oqood", "monthly"]);
    expect(steps[0].amount).toBe(180_000);
    expect(steps[3].amount).toBe(10_000);
    // token + balance of the down payment = 20%; 80 monthly instalments = the other 80%
    expect(20_000 + steps[0].amount! + steps[3].amount! * 80).toBe(1_000_000);
  });
});

describe("screen cues", () => {
  const state = { firstName: "Priya", booking: null, kycDone: false };

  it("gives each screen its own line, and none on the advisor screen", () => {
    expect(screenCue("/agent", state)).toEqual({ interrupt: false, line: null });
    expect(screenCue("/units", state).line).toMatch(/^Here are the projects I'd recommend, Priya/);
    expect(screenCue("/units/bayz102/map", state).line).toMatch(/^This is the unit map for Bayz 102 by Danube/);
    expect(screenCue("/money/calculator", state).line).toMatch(/sliders/);
    expect(screenCue("/booking/kyc", state).line).toMatch(/Emirates ID/);
  });

  it("gives a line to a project page that has no films", () => {
    expect(screenCue("/units/bayz102", state).line).toMatch(/^Here's Bayz 102 by Danube/);
    expect(screenCue("/units/shahrukhzres", state).line).toMatch(/^Here's Shahrukhz Residences by Danube/);
  });

  it("follows the booking state", () => {
    expect(screenCue("/booking", state).line).toMatch(/Pick a unit/);
    expect(screenCue("/booking", { ...state, booking: { unit_no: "BY-0302", status: "initiated" } }).line).toMatch(/booking summary for unit BY-0302/);
    expect(screenCue("/booking", { ...state, booking: { unit_no: "BY-0302", status: "paid" } }).line).toMatch(/BY-0302 is held for you/);
  });

  it("reads a tapped unit's facts from the inventory", () => {
    const unit = getUnits("bayz102").find((p) => p.status === "available")!;
    const line = unitLine(unit.id)!;
    expect(line.startsWith(`${unit.unitNo} is a `)).toBe(true);
    expect(line).toContain(`${unit.sizeSqft.toLocaleString("en-US")} square feet`);
    expect(line).toContain(`floor ${unit.floor}`);
    expect(line).toContain(aedShort(unit.price));
    expect(line).toMatch(/Shall I hold it for you\?$/);
    expect(unitLine(unit.id, { [unit.id]: "held" })).toMatch(/on hold right now/);
  });
});
