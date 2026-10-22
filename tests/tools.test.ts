import { describe, expect, it } from "vitest";
import {
  TOOL_DEFINITIONS,
  calculatePayment,
  createBooking,
  findAdjacentUnits,
  getKnowledge,
  listUnits,
  runTool,
  searchProjects,
  show,
  toolPill,
} from "@/lib/agent/tools";
import { getUnits } from "@/lib/inventory";

describe("tool definitions", () => {
  it("has exactly eight strict tools", () => {
    expect(TOOL_DEFINITIONS.map((t) => t.function.name)).toEqual([
      "search_projects",
      "list_units",
      "find_adjacent_units",
      "compare_units",
      "get_knowledge",
      "calculate_payment",
      "show",
      "create_booking",
    ]);
    for (const t of TOOL_DEFINITIONS) {
      const params = t.function.parameters as { properties: object; required: string[]; additionalProperties: boolean };
      expect(t.function.strict).toBe(true);
      expect(params.additionalProperties).toBe(false);
      // Strict mode needs every property listed as required.
      expect(params.required.sort()).toEqual(Object.keys(params.properties).sort());
    }
  });
});

describe("search_projects", () => {
  it("ranks Bayz 102 first for investment up to AED 2M near the metro", () => {
    const { projects } = searchProjects({ budget_max: 2_000_000, purpose: "investment", region: "near the metro", horizon_years: null });
    expect(projects.length).toBeGreaterThan(3);
    expect(projects.length).toBeLessThanOrEqual(8);
    expect(projects[0].id).toBe("bayz102");
    expect(projects[0].available_in_budget).toBeGreaterThan(0);
    expect(projects[0].fit_reason).toMatch(/within budget/);
    expect(projects[0].fit_score).toBeGreaterThan(projects[projects.length - 1].fit_score);
    for (const p of projects) {
      expect(p).toMatchObject({ id: expect.any(String), entry_ticket: expect.any(Number), rate_per_sqft: expect.any(Number) });
    }
  });

  it("always leads with the featured project (demo rule), then ranks the rest", () => {
    const { projects } = searchProjects({ budget_max: 4_000_000, purpose: "holiday_home", region: "Maritime City waterfront", horizon_years: 6 });
    expect(projects[0].id).toBe("bayz102");
    expect(projects[0].fit_score).toBeGreaterThan(projects[1].fit_score);
    expect(projects[1].id).toBe("shahrukhzres"); // a waterfront search still ranks Shahrukhz best among the others
  });

  it("stays honest when the featured project is over budget", () => {
    // Bayz 102 starts at about AED 1.27M, so AED 1M is below every unit there.
    const { projects } = searchProjects({ budget_max: 1_000_000, purpose: "investment", region: null, horizon_years: null });
    expect(projects[0].id).toBe("bayz102");
    expect(projects[0].available_in_budget).toBe(0);
    expect(projects[0].fit_reason).toMatch(/above budget, the 1% monthly payment plan spreads the cost/);
  });

  it("works with an empty profile", () => {
    const r = searchProjects({ budget_max: null, purpose: null, region: null, horizon_years: null });
    expect(r.projects.length).toBeGreaterThan(0);
    expect(r.total_projects).toBe(40);
  });
});

describe("list_units", () => {
  const base = { min_size: null, max_size: null, max_price: null, sort: null } as const;

  it("returns only available units, sorted by price by default", () => {
    const { units, total } = listUnits({ ...base, project_id: "bayz102" });
    expect(total).toBe(getUnits("bayz102").filter((p) => p.status === "available").length);
    expect(units.every((p) => p.status === "available")).toBe(true);
    expect(units.map((p) => p.price)).toEqual([...units.map((p) => p.price)].sort((a, b) => a - b));
  });

  it("filters by size for 'show me the 780 sq ft options'", () => {
    const { units } = listUnits({ ...base, project_id: "bayz102", min_size: 700, max_size: 860 });
    expect(units.length).toBeGreaterThan(0);
    expect(units.every((p) => p.size_sqft === 780)).toBe(true);
  });

  it("answers 'which is on the highest floor'", () => {
    const { units } = listUnits({ ...base, project_id: "bayz102", sort: "floor" });
    const max = Math.max(...units.map((p) => p.floor));
    expect(units[0].floor).toBe(max);
  });

  it("respects max_price", () => {
    const { units } = listUnits({ ...base, project_id: "shahrukhzres", max_price: 2_000_000 });
    expect(units.every((p) => p.price <= 2_000_000)).toBe(true);
  });

  it("reports unknown projects", () => {
    expect(listUnits({ ...base, project_id: "nowhere" })).toMatchObject({ error: expect.any(String), total: 0 });
  });

  it("excludes units held during the session", () => {
    const first = listUnits({ ...base, project_id: "bayz102" }).units[0];
    const after = listUnits({ ...base, project_id: "bayz102" }, { overrides: { [first.id]: "held" } });
    expect(after.units.find((p) => p.id === first.id)).toBeUndefined();
  });
});

describe("sold-out projects", () => {
  it("ranks them last and says they are sold out", () => {
    const { projects } = searchProjects({ budget_max: null, purpose: null, region: "Arjan", horizon_years: null });
    const soldOut = projects.filter((p) => p.sold_out);
    for (const p of soldOut) {
      expect(p.available_units).toBe(0);
      expect(p.fit_reason).toMatch(/sold out/);
    }
    // an Arjan search never lets a sold-out project outrank one that can be booked
    const firstSoldOut = projects.findIndex((p) => p.sold_out);
    if (firstSoldOut >= 0) expect(projects.slice(firstSoldOut).every((p) => p.sold_out)).toBe(true);
  });

  it("has no units to list, book or map", () => {
    expect(listUnits({ project_id: "skyz", min_size: null, max_size: null, max_price: null, sort: null })).toMatchObject({ total: 0, note: expect.stringMatching(/sold out/) });
    expect(createBooking({ unit_id: "skyz-1" })).toMatchObject({ error: expect.any(String) });
    expect(show({ view: "units", id: "skyz" }).ok).toBe(false);
    expect(show({ view: "project", id: "skyz" }).ok).toBe(true);
  });

  it("still answers questions from the project page", () => {
    const text = getKnowledge({ project_id: "skyz", topic: "location" }).chunks.map((c) => c.text).join(" ");
    expect(text).toMatch(/Arjan/);
    expect(text).toMatch(/sold out/);
    expect(getKnowledge({ project_id: "skyz", topic: "booking_policy" }).chunks[0].text).toMatch(/nothing to book/);
    expect(getKnowledge({ project_id: "breez", topic: "market" }).chunks.map((c) => c.text).join(" ")).toMatch(/1,400,000/);
  });

  it("covers every project in every knowledge topic", () => {
    for (const topic of ["location", "payment_plan", "booking_policy", "title_approvals", "timeline", "amenities", "infrastructure", "developer", "market", "connectivity"] as const) {
      const chunks = getKnowledge({ project_id: null, topic }).chunks;
      expect(chunks.length, topic).toBeGreaterThanOrEqual(40);
    }
  });
});

describe("get_knowledge", () => {
  it("returns project facts", () => {
    const { chunks } = getKnowledge({ project_id: "bayz102", topic: "title_approvals" });
    expect(chunks.some((c) => c.text.includes("escrow"))).toBe(true);
  });

  it("returns the price playbook without any discount", () => {
    const text = getKnowledge({ project_id: null, topic: "price" }).chunks.map((c) => c.text).join(" ");
    expect(text).toMatch(/smaller/i);
    expect(text).toMatch(/payment plan/i);
    expect(text).toMatch(/never offer a discount/i);
  });

  it("states the 1% payment plan and says when a project's terms are unconfirmed", () => {
    const bayz = getKnowledge({ project_id: "bayz102", topic: "payment_plan" }).chunks.map((c) => c.text).join(" ");
    expect(bayz).toMatch(/1% payment plan/);
    expect(bayz).toMatch(/around 20%/);
    expect(bayz).toMatch(/indicative/);
    const greenz = getKnowledge({ project_id: "greenz", topic: "payment_plan" }).chunks.map((c) => c.text).join(" ");
    expect(greenz).toMatch(/40 months/);
    expect(greenz).toMatch(/final 40%/);
  });

  it("adds project colour to why_here", () => {
    expect(getKnowledge({ project_id: "bayz102", topic: "why_here" }).chunks).toHaveLength(2);
  });

  it("returns infrastructure across all projects when no project given", () => {
    const { chunks } = getKnowledge({ project_id: null, topic: "infrastructure" });
    expect(chunks.some((c) => c.text.startsWith("[shahrukhzres]"))).toBe(true);
    expect(chunks.some((c) => c.text.startsWith("[bayz102]"))).toBe(true);
  });

  it("rejects unknown topics", () => {
    expect(getKnowledge({ project_id: null, topic: "weather" as never })).toMatchObject({ error: expect.any(String) });
  });
});

describe("calculate_payment", () => {
  it("runs the 1% plan: 20% down, 1% a month, then the balance", () => {
    const r = calculatePayment({ price: 1_000_000, down_payment_pct: 20, months: 40 });
    expect(r.down_payment).toBe(200_000);
    expect(r.balance_of_down_payment).toBe(180_000);
    expect(r.months).toBe(40);
    expect(r.monthly_instalment).toBe(10_000);
    expect(r.monthly_pct_of_price).toBe(1);
    expect(r.total_monthly_payments).toBe(400_000);
    expect(r.balance_on_completion).toBe(400_000);
    expect(r.completion_pct_of_price).toBe(40);
    expect(r.interest).toBe(0);
    // everything adds back to the price
    expect(r.down_payment + r.total_monthly_payments + r.balance_on_completion).toBe(1_000_000);
  });

  it("leaves no balance on completion when the instalments run 80 months", () => {
    const r = calculatePayment({ price: 1_000_000, down_payment_pct: 20, months: 80 });
    expect(r.balance_on_completion).toBe(0);
  });

  it("keeps the instalments within 12 to 80 months and never past the price", () => {
    expect(calculatePayment({ price: 1_000_000, down_payment_pct: 20, months: 200 }).months).toBe(80);
    expect(calculatePayment({ price: 1_000_000, down_payment_pct: 20, months: 6 }).months).toBe(12);
    // 50% down leaves room for at most 50 instalments of 1%
    expect(calculatePayment({ price: 1_000_000, down_payment_pct: 50, months: 80 }).months).toBe(50);
  });

  it("never lets the balance of the down payment go negative", () => {
    expect(calculatePayment({ price: 100_000, down_payment_pct: 10, months: 40 }).balance_of_down_payment).toBe(0);
  });
});

describe("show", () => {
  it("accepts recommendations without an id", () => {
    expect(show({ view: "recommendations", id: null })).toMatchObject({ ok: true });
  });

  it("requires a project for project and units views", () => {
    expect(show({ view: "project", id: null }).ok).toBe(false);
    expect(show({ view: "units", id: "bayz102" })).toMatchObject({ ok: true, id: "bayz102" });
  });

  it("opens the location view for any project", () => {
    expect(show({ view: "location", id: "shahrukhzres" })).toMatchObject({ ok: true, id: "shahrukhzres" });
    expect(show({ view: "location", id: "nowhere" }).ok).toBe(false);
  });

  it("resolves a unit number to a unit id", () => {
    const unit = getUnits("bayz102")[0];
    expect(show({ view: "unit", id: unit.unitNo })).toMatchObject({ ok: true, id: unit.id });
  });

  it("keeps the booking journey in order", () => {
    expect(show({ view: "kyc", id: null }, { flow: { paid: false, kyc: false } }).ok).toBe(false);
    expect(show({ view: "plan", id: null }, { flow: { paid: true, kyc: false } }).ok).toBe(false);
    expect(show({ view: "plan", id: null }, { flow: { paid: true, kyc: true } }).ok).toBe(true);
  });
});

describe("create_booking", () => {
  it("creates an initiated booking with the AED 20,000 token and takes no payment", () => {
    const unit = getUnits("bayz102").find((p) => p.status === "available")!;
    const r = createBooking({ unit_id: unit.unitNo });
    expect(r).toMatchObject({ token_amount: 20_000, status: "initiated", unit: { id: unit.id, unit_no: unit.unitNo } });
    expect((r as { booking_id: string }).booking_id).toMatch(/^BK-BY-\d{4}-/);
  });

  it("refuses sold and held units", () => {
    const sold = getUnits("bayz102").find((p) => p.status === "sold")!;
    expect(createBooking({ unit_id: sold.id })).toMatchObject({ error: expect.stringMatching(/sold/) });
    const avail = getUnits("bayz102").find((p) => p.status === "available")!;
    expect(createBooking({ unit_id: avail.id }, { overrides: { [avail.id]: "held" } })).toMatchObject({ error: expect.stringMatching(/held/) });
  });

  it("refuses unknown units", () => {
    expect(createBooking({ unit_id: "ZZ-9999" })).toMatchObject({ error: expect.any(String) });
  });
});

describe("dispatch and pills", () => {
  it("routes by name and labels results", () => {
    const r = runTool("list_units", { project_id: "bayz102", min_size: null, max_size: null, max_price: null, sort: null });
    expect(toolPill("list_units", r)).toMatch(/^checking availability · \d+ units in range$/);
    expect(runTool("nope", {})).toMatchObject({ error: expect.any(String) });
  });

  it("labels a payment plan result", () => {
    const r = runTool("calculate_payment", { price: 1_000_000, down_payment_pct: 20, months: 40 });
    expect(toolPill("calculate_payment", r)).toBe("working out plan · AED 10,000/mo");
  });
});

describe("tuning", () => {
  it("widens a single size to the nearest layout", () => {
    const { units } = listUnits({ project_id: "bayz102", min_size: 780, max_size: 780, max_price: null, sort: null });
    expect(units.length).toBeGreaterThan(0);
    expect(units.every((p) => p.size_sqft === 780)).toBe(true);
  });

  it("serves connectivity distances from the inventory", () => {
    const text = getKnowledge({ project_id: "bayz102", topic: "connectivity" }).chunks[0].text;
    expect(text).toMatch(/Business Bay Canal 2 minutes/);
    expect(getKnowledge({ project_id: null, topic: "connectivity" }).chunks).toHaveLength(40);
  });
});

describe("find_adjacent_units", () => {
  it("returns only units that touch on the grid", () => {
    const r = findAdjacentUnits({ project_id: "bayz102", count: 3, min_size: null, max_size: null, max_total_price: null });
    const units = getUnits("bayz102");
    expect(r.groups!.length).toBeGreaterThan(0);
    for (const g of r.groups!) {
      const cells = g.units.map((x) => units.find((p) => p.id === x.id)!);
      expect(cells.every((c) => c.status === "available")).toBe(true);
      // connected: every unit touches another in the group
      for (const c of cells) {
        expect(cells.some((o) => o !== c && Math.abs(o.gridRow - c.gridRow) + Math.abs(o.gridCol - c.gridCol) === 1)).toBe(true);
      }
    }
  });
});
