// The agent tools: strict JSON schemas for OpenAI, and pure handlers.
// Keep this list short. Each extra tool is one more thing the model can pick
// wrongly under demo pressure.

import type { ChatCompletionFunctionTool } from "openai/resources/chat/completions";
import {
  PROJECTS,
  entryTicket,
  findUnit,
  getUnits,
  getProject,
  type Unit,
  type UnitOverrides,
  type Purpose,
} from "@/lib/inventory";
import { SITE_MAPS } from "@/lib/maps";
import { MAX_PLAN_MONTHS, MIN_PLAN_MONTHS, MONTHLY_PCT, TOKEN_AMOUNT, TOPICS, lookupKnowledge, type Topic } from "@/lib/knowledge";

export const VIEWS = ["recommendations", "project", "location", "units", "unit", "calculator", "booking", "kyc", "plan"] as const;
export type View = (typeof VIEWS)[number];

const PURPOSES: Purpose[] = ["investment", "holiday_home", "self_use", "rental_income", "golden_visa"];

/** The demo always leads with this project, whatever the customer's answers. */
export const FEATURED_PROJECT = "bayz102";

const nullable = (schema: Record<string, unknown>) => ({ ...schema, type: [schema.type as string, "null"] });

function fn(name: string, description: string, properties: Record<string, unknown>): ChatCompletionFunctionTool {
  return {
    type: "function",
    function: {
      name,
      description,
      strict: true,
      parameters: { type: "object", properties, required: Object.keys(properties), additionalProperties: false },
    },
  };
}

export const TOOL_DEFINITIONS: ChatCompletionFunctionTool[] = [
  fn(
    "search_projects",
    "Rank the projects against the customer's profile. Call once purpose, budget and one more field are known. Returns entry ticket, rate, available units, a fit score and a fit reason for each project.",
    {
      budget_max: nullable({ type: "number", description: "Maximum budget in AED, e.g. 1500000 for AED 1.5 million." }),
      purpose: nullable({ type: "string", enum: PURPOSES }),
      region: nullable({ type: "string", description: "Place or region in the customer's words, e.g. 'in Marina', 'Business Bay', 'near the metro'." }),
      horizon_years: nullable({ type: "number", description: "How many years the customer plans to hold." }),
    },
  ),
  fn(
    "list_units",
    "List available units in one project, filtered and sorted. Use for size, price, bedroom or floor questions such as 'the highest floor'. Sizes are fixed configurations, so a single size like 2000 matches units within 10% of it. Returns up to 20 units and the total that matched.",
    {
      project_id: { type: "string", enum: PROJECTS.map((p) => p.id) },
      min_size: nullable({ type: "number", description: "Minimum size in sq ft." }),
      max_size: nullable({ type: "number", description: "Maximum size in sq ft." }),
      max_price: nullable({ type: "number", description: "Maximum price in AED." }),
      sort: nullable({ type: "string", enum: ["price", "size", "floor"] }),
    },
  ),
  fn(
    "find_adjacent_units",
    "Find groups of units that sit next to each other, all available. Use whenever the customer wants several units together, side by side, adjacent or neighbouring (e.g. 'I want 3 units next to each other'). NEVER build such a group from list_units: unit numbers close in value are not always neighbours. Returns groups of exactly `count` units, side-by-side groups first, then cheapest.",
    {
      project_id: { type: "string", enum: PROJECTS.map((p) => p.id) },
      count: { type: "number", description: "How many units the customer wants together, 2 or more." },
      min_size: nullable({ type: "number", description: "Minimum size in sq ft for each unit." }),
      max_size: nullable({ type: "number", description: "Maximum size in sq ft for each unit." }),
      max_total_price: nullable({ type: "number", description: "Maximum combined price in AED." }),
    },
  ),
  fn(
    "compare_units",
    "Compare two or three specific units side by side. Use whenever the customer asks to compare, or which unit is better, or A versus B. Returns each unit's facts (price, size, bedrooms, rate per sq ft, floor, view, corner, premium view, status) and the worked-out differences between them.",
    {
      unit_a: { type: "string", description: "Unit id or unit number, e.g. GZ-0302." },
      unit_b: { type: "string", description: "Unit id or unit number." },
      unit_c: nullable({ type: "string", description: "Optional third unit id or number." }),
    },
  ),
  fn(
    "get_knowledge",
    "Look up approved facts: a project topic (connectivity with travel times in minutes, location for geography/travel routes/nearby places, payment_plan, booking_policy, title_approvals, timeline, amenities, infrastructure, developer, market) or an objection playbook (why_here, price, consult_spouse, asset_class, finance, stall). Always use this before stating a policy, date, approval or figure.",
    {
      project_id: nullable({ type: "string", enum: PROJECTS.map((p) => p.id), description: "null returns the topic for all projects, for comparisons." }),
      topic: { type: "string", enum: [...TOPICS] },
    },
  ),
  fn(
    "calculate_payment",
    "Work out Danube's 1% payment plan for a unit price: the down payment, the 1% monthly instalment, how many instalments, and the balance due on completion. About 20% down, then 1% of the price a month during construction, then the balance when the building is ready. Figures exclude government fees.",
    {
      price: { type: "number", description: "Unit price in AED." },
      down_payment_pct: { type: "number", description: "Down payment as a percent of the price. Use 20 unless the customer asks for another figure." },
      months: { type: "number", description: "Number of 1% monthly instalments, from 12 to 80, normally the months until handover. Greenz uses 40." },
    },
  ),
  fn(
    "show",
    "Change the customer's screen. Call right after recommending (view 'recommendations'), when discussing one project ('project' or 'units' with the project id), when the customer asks where the site is or wants to visit it ('location' with the project id: opens the project page scrolled to its embedded map), one unit ('unit' with the unit id), money ('calculator'), or when moving to booking, KYC or the payment schedule.",
    {
      view: { type: "string", enum: [...VIEWS] },
      id: nullable({ type: "string", description: "Project id for project/location/units, unit id or unit number for unit/calculator/booking." }),
    },
  ),
  fn(
    "create_booking",
    "Create an initiated booking for one unit. Takes no payment: the customer confirms the AED 20,000 token on the payment screen. Only call after the customer has clearly said they want to book that unit.",
    { unit_id: { type: "string", description: "Unit id or unit number, e.g. GZ-0302." } },
  ),
];

export type ToolName =
  | "search_projects"
  | "list_units"
  | "find_adjacent_units"
  | "compare_units"
  | "get_knowledge"
  | "calculate_payment"
  | "show"
  | "create_booking";

export interface ToolContext {
  overrides?: UnitOverrides;
  /** Where the customer stands in the booking journey: token, then KYC, then the payment schedule. */
  flow?: { paid: boolean; kyc: boolean };
}

// ---------------------------------------------------------------- handlers

export interface SearchProjectsArgs {
  budget_max: number | null;
  purpose: Purpose | null;
  region: string | null;
  horizon_years: number | null;
}

const project0Hook = (id: string) => getProject(id)?.hook;

export function searchProjects(args: SearchProjectsArgs, ctx: ToolContext = {}) {
  const region = args.region?.toLowerCase() ?? "";
  const projects = PROJECTS.map((project) => {
    const available = getUnits(project.id, ctx.overrides).filter((p) => p.status === "available");
    const inBudget = args.budget_max ? available.filter((p) => p.price <= args.budget_max!) : available;
    const reasons: string[] = [];
    let score = 20;

    if (args.budget_max) {
      if (inBudget.length > 0) {
        score += 40;
        reasons.push(`${inBudget.length} available units within budget`);
      } else {
        score -= 20;
        reasons.push("no available units within budget");
      }
    }
    if (args.purpose) {
      if (project.purposes.includes(args.purpose)) {
        score += 20;
        reasons.push(`suits ${args.purpose.replace("_", " ")}`);
      } else {
        score -= 10;
      }
    }
    if (region) {
      if (project.regionKeywords.some((k) => region.includes(k))) {
        score += 15;
        reasons.push(`matches '${args.region}'`);
      } else {
        score -= 25;
        reasons.push(`outside '${args.region}'`);
      }
    }
    if (args.horizon_years) {
      if (args.horizon_years >= project.holdYearsMin) {
        score += 5;
        reasons.push(`fits a ${args.horizon_years}-year hold`);
      } else {
        reasons.push(`suggested hold is ${project.hold}, longer than planned`);
      }
    }

    // Nothing to book in a completed or sold-out project: say so and rank it last.
    const soldOut = project.availability === "sold_out";
    if (soldOut) {
      score = Math.min(score, 10);
      reasons.length = 0;
      reasons.push(project.status === "completed" ? "completed and sold out" : "sold out");
    }

    return {
      id: project.id,
      name: project.name,
      location: project.location,
      status: project.status,
      sold_out: soldOut,
      handover: project.handover,
      illustrative: project.illustrative,
      entry_ticket: entryTicket(project),
      rate_per_sqft: project.ratePerSqft,
      outlook: project.outlook,
      hold: project.hold,
      available_units: available.length,
      available_in_budget: inBudget.length,
      cheapest_in_budget: inBudget.length ? Math.min(...inBudget.map((p) => p.price)) : null,
      // Projects that can be booked always rank above sold-out ones, whatever the area.
      fit_score: Math.max(soldOut ? 0 : 11, Math.min(100, score)),
      fit_reason: reasons.join("; ") || project.hook,
      hook: project.hook,
      featured: project.id === FEATURED_PROJECT,
    };
  }).sort((a, b) => b.fit_score - a.fit_score);

  // Demo rule: the featured project always comes first and scores highest.
  // Its reason stays honest, including when it's above the budget.
  const featured = projects.find((p) => p.featured);
  if (featured) {
    const bestOther = Math.max(0, ...projects.filter((p) => !p.featured).map((p) => p.fit_score));
    featured.fit_score = Math.min(98, Math.max(featured.fit_score, bestOther + 8, 86));
    // Nothing below the top pick may out-score it.
    for (const p of projects) if (!p.featured) p.fit_score = Math.min(p.fit_score, featured.fit_score - 6);
    featured.fit_reason = [
      "featured Danube project",
      ...featured.fit_reason.split("; ").filter((r) => r && r !== project0Hook(featured.id) && r !== "no available units within budget"),
    ].join("; ");
    if (featured.available_in_budget === 0 && args.budget_max) {
      featured.fit_reason += "; above budget, the 1% monthly payment plan spreads the cost";
    }
    projects.splice(projects.indexOf(featured), 1);
    projects.unshift(featured);
  }

  // The best eight; sold-out projects rank last, so they only show when little else fits.
  return { projects: projects.slice(0, 8), total_projects: projects.length, available_projects: projects.filter((p) => !p.sold_out).length };
}

export interface ListUnitsArgs {
  project_id: string;
  min_size: number | null;
  max_size: number | null;
  max_price: number | null;
  sort: "price" | "size" | "floor" | null;
}

function unitSummary(p: Unit) {
  return {
    id: p.id,
    unit_no: p.unitNo,
    size_sqft: p.sizeSqft,
    price: p.price,
    layout: p.layout,
    floor: p.floor,
    view: p.view,
    is_corner: p.isCorner,
    is_premium_view: p.isPremiumView,
    status: p.status,
  };
}

export function listUnits(args: ListUnitsArgs, ctx: ToolContext = {}) {
  const project = getProject(args.project_id);
  if (!project) return { error: `unknown project ${args.project_id}`, units: [], total: 0 };
  if (project.availability === "sold_out") return { units: [], total: 0, note: `${project.name} is sold out, so it has no units to book` };
  let { min_size: min, max_size: max } = args;
  // "the 2,000 sq ft options" means the nearest configuration, not exactly 2,000.
  if (min != null && max != null && max - min < min * 0.1) {
    const mid = (min + max) / 2;
    [min, max] = [mid * 0.9, mid * 1.1];
  }
  const matches = getUnits(args.project_id, ctx.overrides).filter(
    (p) =>
      p.status === "available" &&
      (min == null || p.sizeSqft >= min) &&
      (max == null || p.sizeSqft <= max) &&
      (args.max_price == null || p.price <= args.max_price),
  );
  const key = args.sort ?? "price";
  const sorted = [...matches].sort((a, b) =>
    key === "size" ? a.sizeSqft - b.sizeSqft : key === "floor" ? b.floor - a.floor : a.price - b.price,
  );
  return { units: sorted.slice(0, 20).map(unitSummary), total: matches.length };
}

export interface FindAdjacentUnitsArgs {
  project_id: string;
  count: number;
  min_size: number | null;
  max_size: number | null;
  max_total_price: number | null;
}

/**
 * Groups of `count` available units that touch on the layout grid (sharing an
 * edge). Units on the same floor sit side by side, and units directly above one
 * another count as touching, so GZ-0301 and GZ-0302 are neighbours while
 * GZ-0301 and GZ-0904 are not.
 */
export function findAdjacentUnits(args: FindAdjacentUnitsArgs, ctx: ToolContext = {}) {
  const project = getProject(args.project_id);
  if (!project) return { error: `unknown project ${args.project_id}`, groups: [], total: 0 };
  const count = Math.round(args.count);
  if (!(count >= 2) || count > 6) return { error: "count must be between 2 and 6", groups: [], total: 0 };

  const pool = getUnits(args.project_id, ctx.overrides).filter(
    (p) =>
      p.status === "available" &&
      (args.min_size == null || p.sizeSqft >= args.min_size) &&
      (args.max_size == null || p.sizeSqft <= args.max_size),
  );
  const at = new Map(pool.map((p) => [`${p.gridRow},${p.gridCol}`, p]));
  const neighbours = (p: Unit) =>
    [[0, 1], [0, -1], [1, 0], [-1, 0]].flatMap(([dr, dc]) => at.get(`${p.gridRow + dr},${p.gridCol + dc}`) ?? []);

  // Every connected set of `count` units, de-duplicated by unit ids.
  const seen = new Set<string>();
  const sets: Unit[][] = [];
  const grow = (group: Unit[]) => {
    const key = group.map((p) => p.id).sort().join("|");
    if (seen.has(key)) return;
    seen.add(key);
    if (group.length === count) return void sets.push(group);
    for (const member of group) for (const n of neighbours(member)) if (!group.includes(n)) grow([...group, n]);
  };
  for (const p of pool) grow([p]);

  const groups = sets
    .map((g) => {
      const units = [...g].sort((a, b) => a.gridRow - b.gridRow || a.gridCol - b.gridCol);
      const row = units.every((p) => p.gridRow === units[0].gridRow);
      const unbroken = row && units.every((p, i) => i === 0 || p.gridCol === units[i - 1].gridCol + 1);
      return {
        units: units.map(unitSummary),
        layout: unbroken ? "side by side in one row" : "connected, across rows",
        total_price: units.reduce((sum, p) => sum + p.price, 0),
        total_size_sqft: units.reduce((sum, p) => sum + p.sizeSqft, 0),
        _unbroken: unbroken,
      };
    })
    .filter((g) => args.max_total_price == null || g.total_price <= args.max_total_price)
    .sort((a, b) => Number(b._unbroken) - Number(a._unbroken) || a.total_price - b.total_price);

  return { groups: groups.slice(0, 5).map(({ _unbroken, ...g }) => g), total: groups.length };
}

export interface CompareUnitsArgs {
  unit_a: string;
  unit_b: string;
  unit_c: string | null;
}

/**
 * Side-by-side facts for two or three units, with the differences worked out,
 * so the advisor can say what each unit gives up and gains rather than reading
 * out two rows of specs.
 */
export function compareUnits(args: CompareUnitsArgs, ctx: ToolContext = {}) {
  const refs = [args.unit_a, args.unit_b, args.unit_c].filter((r): r is string => Boolean(r));
  const units = refs.map((r) => findUnit(r, ctx.overrides));
  const missing = refs.filter((_, i) => !units[i]);
  if (missing.length) return { error: `no unit ${missing.join(", ")}` };
  const found = units as Unit[];

  const rows = found.map((p) => ({
    ...unitSummary(p),
    project_name: getProject(p.projectId)?.name ?? p.projectId,
    price_per_sqft: Math.round(p.price / p.sizeSqft),
  }));

  const by = <T,>(pick: (r: (typeof rows)[number]) => T, better: "min" | "max") => {
    const vals = rows.map(pick) as unknown as number[];
    const target = better === "min" ? Math.min(...vals) : Math.max(...vals);
    const winners = rows.filter((_, i) => vals[i] === target);
    return winners.length === rows.length ? null : winners.map((r) => r.unit_no);
  };
  const spread = (pick: (r: (typeof rows)[number]) => number) => {
    const v = rows.map(pick);
    return Math.max(...v) - Math.min(...v);
  };

  const differences: string[] = [];
  const note = (label: string, winners: string[] | null, detail: string) => winners && differences.push(`${label}: ${winners.join(" and ")} ${detail}`);
  note("Price", by((r) => r.price, "min"), `is the lowest, by up to AED ${spread((r) => r.price)} across these`);
  note("Size", by((r) => r.size_sqft, "max"), `is the largest, by up to ${spread((r) => r.size_sqft)} sq ft`);
  note("Rate", by((r) => r.price_per_sqft, "min"), `has the lowest rate per sq ft, up to AED ${spread((r) => r.price_per_sqft)} less`);
  if (!found.some((u) => getProject(u.projectId)?.community)) {
    note("Floor", by((r) => r.floor, "max"), `is on the highest floor, by up to ${spread((r) => r.floor)} floors`);
  }
  const corner = rows.filter((r) => r.is_corner).map((r) => r.unit_no);
  if (corner.length && corner.length < rows.length) differences.push(`Position: ${corner.join(" and ")} ${corner.length > 1 ? "are corner units" : "is a corner unit"}, the rest are not`);
  const premium = rows.filter((r) => r.is_premium_view).map((r) => r.unit_no);
  if (premium.length && premium.length < rows.length) differences.push(`View: ${premium.join(" and ")} ${premium.length > 1 ? "have" : "has"} the project's premium view, the rest do not`);
  const taken = rows.filter((r) => r.status !== "available").map((r) => `${r.unit_no} is ${r.status}`);
  if (taken.length) differences.push(`Availability: ${taken.join(", ")}`);

  return {
    units: rows,
    differences,
    same_project: new Set(found.map((p) => p.projectId)).size === 1,
  };
}

export interface GetKnowledgeArgs {
  project_id: string | null;
  topic: Topic;
}

export function getKnowledge(args: GetKnowledgeArgs) {
  if (!(TOPICS as readonly string[]).includes(args.topic)) return { error: `unknown topic ${args.topic}`, chunks: [] };
  return { chunks: lookupKnowledge(args.topic, args.project_id) };
}

export interface CalculatePaymentArgs {
  price: number;
  down_payment_pct: number;
  months: number;
}

/**
 * Danube's 1% plan: a down payment (the token counts toward it), then 1% of
 * the price every month while the building is built, then the balance when it
 * is ready. No interest. The number of instalments can't push the total past
 * the price.
 */
export function calculatePayment(args: CalculatePaymentArgs) {
  const pct = Math.min(100, Math.max(0, args.down_payment_pct));
  const maxMonths = Math.min(MAX_PLAN_MONTHS, Math.floor((100 - pct) / MONTHLY_PCT));
  const months = Math.max(Math.min(MIN_PLAN_MONTHS, maxMonths), Math.min(maxMonths, Math.round(args.months)));
  const down = Math.round((args.price * pct) / 100);
  const monthly = Math.round((args.price * MONTHLY_PCT) / 100);
  const completion = Math.max(0, args.price - down - monthly * months);
  return {
    down_payment: down,
    balance_of_down_payment: Math.max(0, down - TOKEN_AMOUNT),
    token_amount: TOKEN_AMOUNT,
    months,
    monthly_instalment: monthly,
    monthly_pct_of_price: MONTHLY_PCT,
    total_monthly_payments: monthly * months,
    balance_on_completion: completion,
    completion_pct_of_price: Math.round((completion / args.price) * 10000) / 100,
    interest: 0,
    fees_note: "Excludes government fees such as the Dubai Land Department registration fee.",
  };
}

export interface ShowArgs {
  view: View;
  id: string | null;
}

export function show(args: ShowArgs, ctx: ToolContext = {}) {
  if (!VIEWS.includes(args.view)) return { ok: false, error: `unknown view ${args.view}` };
  if (args.view === "location") {
    if (!args.id || !SITE_MAPS[args.id]) return { ok: false, error: "view location needs a valid project id" };
    return { ok: true, view: args.view, id: args.id };
  }
  if (args.view === "project" || args.view === "units") {
    if (!args.id || !getProject(args.id)) return { ok: false, error: `view ${args.view} needs a valid project id` };
    if (args.view === "units" && getProject(args.id)?.availability === "sold_out") return { ok: false, error: `${getProject(args.id)!.name} is sold out, so it has no unit map. Show a project that still has units, or the project page.` };
    return { ok: true, view: args.view, id: args.id };
  }
  if (args.view === "unit") {
    const unit = args.id ? findUnit(args.id, ctx.overrides) : undefined;
    if (!unit) return { ok: false, error: "view unit needs a valid unit id or unit number" };
    return { ok: true, view: args.view, id: unit.id };
  }
  // The booking journey runs in order: token payment, KYC, then the payment schedule.
  if (ctx.flow) {
    if (args.view === "plan" && !ctx.flow.paid) {
      return { ok: false, error: "The payment plan opens after the token payment and KYC. Tell the customer to pay the token on the booking screen first." };
    }
    if (args.view === "plan" && !ctx.flow.kyc) {
      return { ok: false, error: "The payment plan opens after KYC. Tell the customer to complete KYC first; do not open the plan yet." };
    }
    if (args.view === "kyc" && !ctx.flow.paid) {
      return { ok: false, error: "KYC comes after the token payment. Tell the customer to pay the token on the booking screen first; do not open KYC yet." };
    }
  }
  // Other views take an optional unit for context.
  const unit = args.id ? findUnit(args.id, ctx.overrides) : undefined;
  return { ok: true, view: args.view, id: unit?.id ?? null };
}

export interface CreateBookingArgs {
  unit_id: string;
}

export function createBooking(args: CreateBookingArgs, ctx: ToolContext = {}) {
  const unit = findUnit(args.unit_id, ctx.overrides);
  if (!unit) return { error: `no unit ${args.unit_id}` };
  if (unit.status !== "available") return { error: `${unit.unitNo} is ${unit.status}, not available` };
  const project = getProject(unit.projectId)!;
  return {
    booking_id: `BK-${unit.unitNo}-${Date.now().toString(36).toUpperCase().slice(-5)}`,
    unit: { ...unitSummary(unit), project_id: project.id, project_name: project.name },
    token_amount: TOKEN_AMOUNT,
    status: "initiated" as const,
  };
}

// ---------------------------------------------------------------- dispatch

export function runTool(name: string, args: unknown, ctx: ToolContext = {}): unknown {
  switch (name as ToolName) {
    case "search_projects":
      return searchProjects(args as SearchProjectsArgs, ctx);
    case "list_units":
      return listUnits(args as ListUnitsArgs, ctx);
    case "find_adjacent_units":
      return findAdjacentUnits(args as FindAdjacentUnitsArgs, ctx);
    case "compare_units":
      return compareUnits(args as CompareUnitsArgs, ctx);
    case "get_knowledge":
      return getKnowledge(args as GetKnowledgeArgs);
    case "calculate_payment":
      return calculatePayment(args as CalculatePaymentArgs);
    case "show":
      return show(args as ShowArgs, ctx);
    case "create_booking":
      return createBooking(args as CreateBookingArgs, ctx);
    default:
      return { error: `unknown tool ${name}` };
  }
}

/** Short label for the tool pill, e.g. "checking availability · 9 units in range". */
export function toolPill(name: string, result: unknown): string {
  const r = result as Record<string, unknown>;
  if (r && typeof r === "object" && "error" in r) return `${name} · ${r.error}`;
  switch (name as ToolName) {
    case "search_projects": {
      const projects = (r.projects as { fit_score: number }[]) ?? [];
      return `matching projects · ${projects.filter((p) => p.fit_score >= 75).length} strong fits`;
    }
    case "list_units":
      return `checking availability · ${r.total} units in range`;
    case "find_adjacent_units":
      return `checking neighbouring units · ${r.total} groups found`;
    case "compare_units":
      return `comparing units · ${(r.units as unknown[]).length} side by side`;
    case "get_knowledge":
      return `looking up policy · ${(r.chunks as unknown[]).length} notes`;
    case "calculate_payment":
      return `working out plan · AED ${Number(r.monthly_instalment).toLocaleString("en-US")}/mo`;
    case "show":
      return r.ok ? `opening ${r.view}` : `show failed`;
    case "create_booking":
      return `holding unit · ${(r.unit as { unit_no: string }).unit_no}`;
    default:
      return name;
  }
}
