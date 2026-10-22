import { describe, expect, it } from "vitest";
import { PROJECTS, entryTicket, floorOf, getUnits, unitPrice } from "@/lib/inventory";

describe("inventory", () => {
  it("lists every Danube project exactly once", () => {
    expect(PROJECTS).toHaveLength(40);
    expect(new Set(PROJECTS.map((p) => p.id)).size).toBe(40);
    expect(PROJECTS.map((p) => p.id)).toEqual(expect.arrayContaining(["bayz102", "shahrukhzres", "greenz", "bayz101", "diamondz", "gemz", "skyz", "glitz3", "viewz"]));
    // ids carry no hyphen, so "<project>-<n>" always reads as a unit id
    for (const p of PROJECTS) expect(p.id).toMatch(/^[a-z0-9]+$/);
  });

  it("gives units only to projects that can still be booked", () => {
    for (const p of PROJECTS) {
      const units = getUnits(p.id);
      if (p.availability === "available") expect(units.length, p.id).toBeGreaterThanOrEqual(24);
      else expect(units, p.id).toEqual([]);
    }
    expect(getUnits("bayz102")).toHaveLength(25);
    expect(PROJECTS.filter((p) => p.availability === "sold_out").length).toBeGreaterThan(20);
  });

  it("keeps every completed project sold out, except Eleganz which the page prices as ready to move in", () => {
    for (const p of PROJECTS.filter((x) => x.status === "completed")) {
      expect(p.availability, p.id).toBe(p.id === "eleganz" ? "available" : "sold_out");
    }
  });

  it("uses a unique two-letter prefix for every bookable project", () => {
    const prefixes = PROJECTS.filter((p) => p.availability === "available").map((p) => p.unitPrefix);
    expect(new Set(prefixes).size).toBe(prefixes.length);
    for (const x of prefixes) expect(x).toMatch(/^[A-Z]{2}$/);
  });

  it("is deterministic across calls", () => {
    expect(JSON.stringify(getUnits("bayz102"))).toBe(JSON.stringify(getUnits("bayz102")));
  });

  it("numbers units by floor and flat, and keeps every number unique", () => {
    const all = PROJECTS.flatMap((p) => getUnits(p.id));
    expect(new Set(all.map((u) => u.unitNo)).size).toBe(all.length);
    for (const p of PROJECTS.filter((x) => x.availability === "available")) {
      const units = getUnits(p.id);
      expect(new Set(units.map((u) => u.unitNo)).size).toBe(units.length);
      for (const u of units) {
        expect(u.unitNo).toMatch(/^[A-Z]{2}-\d{4}$/);
        expect(u.floor).toBe(floorOf(p, u.gridRow));
        expect(u.unitNo.slice(3, 5)).toBe(String(u.floor).padStart(2, "0"));
      }
    }
  });

  it("has available inventory in the AED 1M–1.5M band the demo script uses", () => {
    const inBand = PROJECTS.flatMap((p) => getUnits(p.id)).filter(
      (p) => p.status === "available" && p.price >= 1_000_000 && p.price <= 1_500_000,
    );
    expect(inBand.length).toBeGreaterThanOrEqual(2);
    expect(inBand.some((p) => p.projectId === "bayz102")).toBe(true);
  });

  it("starts each project at its published starting price", () => {
    expect(entryTicket(PROJECTS.find((p) => p.id === "bayz102")!)).toBe(1_270_000);
    expect(entryTicket(PROJECTS.find((p) => p.id === "shahrukhzres")!)).toBe(1_650_000);
    expect(entryTicket(PROJECTS.find((p) => p.id === "greenz")!)).toBe(3_699_000);
  });

  it("has at least two available units in every budget bracket of the welcome question", () => {
    const brackets: [number, number][] = [
      [0, 1_500_000], // < AED 1.5M
      [1_500_000, 2_500_000], // AED 1.5M – 2.5M
      [2_500_000, 4_000_000], // AED 2.5M – 4M
      [4_000_000, Infinity], // > AED 4M
    ];
    for (const [lo, hi] of brackets) {
      const free = PROJECTS.flatMap((p) => getUnits(p.id)).filter((x) => x.status === "available" && x.price > lo && x.price <= hi);
      expect(free.length, `${lo}–${hi}`).toBeGreaterThanOrEqual(2);
    }
  });

  it("applies the floor, corner and view formula", () => {
    const bayz102 = PROJECTS[0];
    // floor 25 is one row above the first (10): 15 floors at 0.08% a floor
    expect(unitPrice(bayz102, 780, true, true, 25)).toBe(Math.round((780 * 2859 * (1 + 0.04 + 0.03 + 0.012)) / 1000) * 1000);
    expect(unitPrice(bayz102, 780, false, false, 10)).toBe(Math.round((780 * 2859) / 1000) * 1000);
    for (const unit of getUnits("bayz102")) expect(unit.price % 1000).toBe(0);
  });

  it("gives higher floors a higher price for the same layout", () => {
    const bayz102 = PROJECTS[0];
    expect(unitPrice(bayz102, 1400, false, false, 70)).toBeGreaterThan(unitPrice(bayz102, 1400, false, false, 10));
  });

  it("prices Greenz rows alike, because they are streets and not floors", () => {
    const greenz = PROJECTS.find((p) => p.id === "greenz")!;
    expect(greenz.community).toBe(true);
    expect(unitPrice(greenz, 2900, false, false, 6)).toBe(unitPrice(greenz, 2900, false, false, 1));
  });

  it("keeps each plan within 100% of the price", () => {
    for (const p of PROJECTS) {
      expect(p.plan.downPct + p.plan.months, p.id).toBeLessThanOrEqual(100);
      expect(p.plan.months, p.id).toBeGreaterThanOrEqual(12);
    }
  });

  it("marks up to about 35% sold and 10% held, keeping two units of every size free", () => {
    for (const p of PROJECTS.filter((x) => x.availability === "available")) {
      const units = getUnits(p.id);
      const sold = units.filter((x) => x.status === "sold").length;
      const held = units.filter((x) => x.status === "held").length;
      expect(sold).toBeLessThanOrEqual(Math.round(p.unitCount * 0.35));
      expect(sold + held).toBeGreaterThan(0); // scarcity still shows on the map
      for (const size of p.sizes) expect(units.filter((x) => x.sizeSqft === size && x.status === "available").length).toBeGreaterThanOrEqual(2);
    }
  });

  it("applies session overrides without mutating the base inventory", () => {
    const first = getUnits("bayz102").find((p) => p.status === "available")!;
    expect(getUnits("bayz102", { [first.id]: "held" }).find((p) => p.id === first.id)!.status).toBe("held");
    expect(getUnits("bayz102").find((p) => p.id === first.id)!.status).toBe("available");
  });
});
