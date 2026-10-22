// Projects and a seeded unit generator. Deterministic: every demo run sees the
// same units, prices and statuses.
//
// DATA SOURCES. Project facts (locations, handover dates, unit types, starting
// prices, amenities, nearby places, payment plan) come from the project pages
// on danubeproperties.com, fetched October 2026. Where a page gives a price for
// a unit type, `sizeRates` is that price divided by the size.
//
// SAMPLE DATA. The project pages publish no unit sizes (except Greenz), no unit
// counts per floor, no views and no per-unit availability. Those are
// placeholders so the journey has something to run on, and prices for types the
// pages don't price are derived from the nearest published price. Every
// project is labelled "Sample pricing" on screen. Confirm before launch.

import { PROJECT_SPECS, type ProjectSpec, type ProjectStatus } from "@/lib/projects-data";

export type UnitStatus = "available" | "held" | "sold";
export type { ProjectStatus };

/** Whether a project has units to book. Completed and sold-out projects don't. */
export type Availability = "available" | "sold_out";

export interface Connectivity {
  label: string;
  /** Travel time in minutes, as the project page states it (mode not stated). */
  minutes: number;
  note?: string;
}

export interface ProjectVideo {
  src: string;
  poster: string;
  title: string;
  /** What the Property Advisor says over this film (the films play muted). */
  narration: string;
  /** The film's own audio is the point (customer stories): it plays with sound, after the narration, and runs to its end. */
  sound?: boolean;
}

export interface PaymentPlan {
  /** Down payment as a share of the price. The booking token counts toward it. */
  downPct: number;
  /** Monthly instalments of 1% of the price. */
  months: number;
  /** Whether the project's own page states these terms. */
  confirmed: boolean;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  region: string;
  developer: string;
  /** Prices and layouts are partly sample data, labelled as such on screen. */
  illustrative: boolean;
  /** Headline AED per sq ft (derived from the starting price). */
  ratePerSqft: number;
  /** AED per sq ft for each size, where the page publishes a price for that type. */
  sizeRates?: Record<number, number>;
  /** Sizes in sq ft, one per layout. */
  sizes: number[];
  /** Bedrooms for each size; 0 is a studio. */
  bedrooms: Record<number, number>;
  /** Names for layouts that aren't just a bedroom count, e.g. "3 bed townhouse". */
  layoutNames?: Record<number, string>;
  unitCount: number;
  unitPrefix: string;
  outlook: string;
  /** How long a buyer typically holds, used to fit the customer's horizon. */
  hold: string;
  holdYearsMin: number;
  /** Handover as the project page gives it. */
  handover: string;
  plan: PaymentPlan;
  rera_no: string;
  hook: string;
  connectivity: Connectivity[];
  features: string[];
  purposes: Purpose[];
  /** Lower-case words a customer might use for this area. */
  regionKeywords: string[];
  /** Units per row. */
  cols: number;
  /** A villa and townhouse community: rows are streets, not floors. */
  community?: boolean;
  /** Floor (or row number) of the lowest row of units, and the gap between rows. */
  firstFloor: number;
  floorStep: number;
  /** Price premium per floor above the first row, as a fraction. */
  floorPremium: number;
  /** Views a unit can have; the first is the premium one. */
  views: string[];
  /** Walkthrough films, shown full screen the first time the project opens. */
  videos?: ProjectVideo[];
  /** Hero image for cards and the project page. */
  image?: string;
  status: ProjectStatus;
  availability: Availability;
  /** Starting price in AED where the page gives one, including for sold-out projects. */
  startingPrice?: number;
  /** The payment plan exactly as the project page labels it, e.g. "30/70". */
  planLabel?: string;
  /** Total units in the whole project, as stated (the app generates a sample of them). */
  totalUnits?: number;
  floors?: number;
  furnished?: boolean;
  amenities?: string[];
  /** Layouts as the project page lists them. */
  types?: string[];
  /** Conflicts and extra facts from the project page. */
  notes?: string[];
  /** An office tower, not homes. */
  office?: boolean;
}

export type Purpose = "investment" | "holiday_home" | "self_use" | "rental_income" | "golden_visa";

export interface Unit {
  id: string;
  projectId: string;
  unitNo: string;
  sizeSqft: number;
  bedrooms: number;
  /** "Studio", "2 bed", "3 bed townhouse" and so on. */
  layout: string;
  /** Floor in a tower, or row number in a community. */
  floor: number;
  view: string;
  gridRow: number;
  gridCol: number;
  isCorner: boolean;
  isPremiumView: boolean;
  price: number;
  status: UnitStatus;
}

const IMG = "https://danubeproperties.com/wp-content/uploads";

const HAND_BUILT: Project[] = [
  {
    id: "bayz102",
    status: "ongoing",
    availability: "available",
    totalUnits: 956,
    floors: 102,
    furnished: true,
    name: "Bayz 102 by Danube",
    location: "Business Bay, Dubai",
    region: "Business Bay, Dubai",
    developer: "Danube Properties",
    illustrative: true,
    ratePerSqft: 2820,
    // Published "from" prices per type (studio ~AED 1.27M, 1-bed executive AED 2.23M,
    // 2-bed AED 3.05M, 3-bed AED 4.9M, 4-bed AED 6.7M), divided by sample sizes.
    sizeRates: { 450: 2822, 780: 2859, 1400: 2179, 2100: 2333, 3200: 2094 },
    sizes: [450, 780, 1400, 2100, 3200],
    bedrooms: { 450: 0, 780: 1, 1400: 2, 2100: 3, 3200: 4 },
    unitCount: 25,
    unitPrefix: "BY",
    outlook: "Danube describes Business Bay as a high-liquidity area with low vacancy. Rental income and resale value are not guaranteed.",
    hold: "3–5 years",
    holdYearsMin: 3,
    handover: "June 2029",
    plan: { downPct: 20, months: 32, confirmed: false },
    rera_no: "RERA-registered. Project number to be confirmed by Danube.",
    hook: "A 102-level residential skyscraper in Business Bay, three minutes from Burj Khalifa and The Dubai Mall, with a sky-level helipad, a canal-view infinity pool and fully furnished homes.",
    connectivity: [
      { label: "Business Bay Canal", minutes: 2 },
      { label: "Business Bay metro station", minutes: 3 },
      { label: "Burj Khalifa", minutes: 3 },
      { label: "The Dubai Mall", minutes: 3 },
      { label: "City Walk", minutes: 5 },
      { label: "Museum of the Future", minutes: 5 },
    ],
    features: [
      "956 apartments across 102 levels",
      "Skyway with a helipad, sky taxi and helicopter access",
      "Canal-view infinity pool, aquatic gym, sky garden and sky golf",
      "Fully furnished with premium Italian Dolce Vita furniture",
    ],
    purposes: ["investment", "rental_income", "holiday_home", "golden_visa"],
    regionKeywords: ["dubai", "business bay", "downtown", "burj", "central", "canal", "city", "metro", "skyscraper", "luxury"],
    cols: 5,
    firstFloor: 10,
    floorStep: 15,
    floorPremium: 0.0008,
    views: ["Canal", "Burj Khalifa", "City"],
    image: `${IMG}/2024/09/1-2.jpg`,
  },
  {
    id: "shahrukhzres",
    status: "latest_launch",
    availability: "available",
    furnished: true,
    name: "Shahrukhz Residences by Danube",
    location: "Dubai Maritime City, Dubai",
    region: "Dubai Maritime City, Dubai",
    developer: "Danube Properties",
    illustrative: true,
    ratePerSqft: 3000,
    // Only the AED 1.65M starting price is published. Other types are derived
    // from it at the same rate, over sample sizes.
    sizeRates: { 550: 3000, 850: 3000, 1350: 3000, 1900: 3000 },
    sizes: [550, 850, 1350, 1900],
    bedrooms: { 550: 0, 850: 1, 1350: 2, 1900: 3 },
    unitCount: 24,
    unitPrefix: "SH",
    outlook: "Rental income and resale value are not guaranteed.",
    hold: "3–5 years",
    holdYearsMin: 3,
    handover: "Q4 2029",
    plan: { downPct: 20, months: 38, confirmed: false },
    rera_no: "RERA-registered. Project number to be confirmed by Danube.",
    hook: "Danube's latest launch: fully furnished waterfront residences in Dubai Maritime City, minutes from the Port Rashid boat station, with a King's Club Deck, Infinity 33 and a beach lagoon.",
    connectivity: [
      { label: "Port Rashid Boat Station", minutes: 2 },
      { label: "Dubai Cruise Terminal 2", minutes: 3 },
      { label: "Dubai World Trade Centre", minutes: 8 },
      { label: "Jumeirah Beach", minutes: 8 },
      { label: "Burj Khalifa", minutes: 10 },
      { label: "Dubai International Airport", minutes: 15 },
    ],
    features: [
      "Studio to 3-bedroom apartments, plus penthouses",
      "Infinity 33, King's Club Deck, Longevity Lounge, Beach Lagoon and Sports Hub",
      "Cryo therapy, ice bath, golf simulator and padel tennis",
      "Fully furnished waterfront residences",
    ],
    purposes: ["investment", "rental_income", "holiday_home", "self_use"],
    regionKeywords: ["dubai", "maritime", "maritime city", "waterfront", "sea", "beach", "port rashid", "cruise", "marina", "new launch"],
    cols: 4,
    firstFloor: 5,
    floorStep: 5,
    floorPremium: 0.003,
    views: ["Waterfront", "Skyline", "Community"],
    image: `${IMG}/2026/10/shahrukhz-residences-by-danube-waterfront-development.webp`,
  },
  {
    id: "greenz",
    status: "latest_launch",
    availability: "available",
    totalUnits: 768,
    furnished: true,
    name: "Greenz by Danube",
    location: "Dubai Academic City, Dubai",
    region: "Dubai Academic City, Dubai",
    developer: "Danube Properties",
    illustrative: true,
    ratePerSqft: 1574,
    // The page says all types start at AED 3.7M, with the 3-bed townhouse from
    // about 2,350 sq ft. Other types are priced at that rate.
    sizeRates: { 2350: 1574, 2900: 1574, 3700: 1574, 3950: 1574 },
    sizes: [2350, 2900, 3700, 3950],
    bedrooms: { 2350: 3, 2900: 4, 3700: 5, 3950: 5 },
    layoutNames: { 2350: "3 bed townhouse", 2900: "4 bed townhouse", 3700: "5 bed semi-detached villa", 3950: "5 bed twin villa" },
    unitCount: 24,
    unitPrefix: "GR",
    outlook: "Danube says buyers can qualify for the Golden Visa at the AED 2 million property threshold, subject to government requirements. Rental income and resale value are not guaranteed.",
    hold: "3–5 years",
    holdYearsMin: 3,
    handover: "Q4 2029",
    plan: { downPct: 20, months: 40, confirmed: true },
    rera_no: "RERA-registered. Project number to be confirmed by Danube.",
    hook: "Dubai's first fully furnished master villa project: a gated community of 3 to 5-bedroom townhouses and villas in Dubai Academic City, with a beach clubhouse and 10 sports courts.",
    connectivity: [
      { label: "Emirates Road", minutes: 1 },
      { label: "Dubai–Al Ain Road", minutes: 2 },
      { label: "Metro Blue Line", minutes: 5 },
      { label: "Sheikh Mohammed Bin Zayed Road", minutes: 5 },
      { label: "Silicon Central Mall", minutes: 10 },
      { label: "Dubai Safari Park", minutes: 11 },
      { label: "Global Village", minutes: 15 },
      { label: "Dubai International Airport and Downtown Dubai", minutes: 17 },
    ],
    features: [
      "768 townhouses and villas, from 3 to 5 bedrooms",
      "Fully furnished with branded Italian furniture by Dolce Vita",
      "A 4.9 million sq ft gated community with about 400,000 sq ft of amenities and green space",
      "The Beach Hub, Dancing Fountain, Wellness Hub and a Sports Hub with 10 courts",
    ],
    purposes: ["investment", "rental_income", "self_use", "golden_visa"],
    regionKeywords: ["dubai", "academic city", "villa", "townhouse", "family", "garden", "community", "gated", "silicon", "metro"],
    cols: 4,
    community: true,
    firstFloor: 1,
    floorStep: 1,
    floorPremium: 0,
    views: ["Garden", "Pool", "Street"],
    image: `${IMG}/2026/04/greenz-by-danube-pool-deck.webp`,
  },
];

// ------------------------------------------------- projects built from specs

// Sample sizes by bedroom count, for projects whose pages publish none.
const SAMPLE_SIZES: Record<number, number> = { 0: 450, 1: 780, 2: 1250, 3: 1850, 4: 3000, 5: 4200 };
const OFFICE_SIZES = [650, 1100, 1800, 2800];
const OFFICE_NAMES = ["Standard office", "Prestige office", "Premium office", "Executive office"];

const AREA_WORDS: [RegExp, string[]][] = [
  [/Jumeirah Village Circle/i, ["jvc", "jumeirah village circle"]],
  [/Jumeirah Village Triangle/i, ["jvt", "jumeirah village triangle"]],
  [/Jumeirah Lake Towers/i, ["jlt", "jumeirah lake towers", "marina"]],
  [/Silicon Oasis/i, ["dso", "silicon oasis"]],
  [/Sports City/i, ["sports city"]],
  [/Studio City/i, ["studio city"]],
  [/Maritime City/i, ["maritime", "maritime city", "waterfront", "port rashid"]],
  [/Business Bay/i, ["business bay", "downtown", "burj", "canal", "central"]],
  [/Al Furjan/i, ["furjan", "al furjan", "metro"]],
  [/Dubai Marina/i, ["marina", "dubai marina"]],
  [/Arjan/i, ["arjan", "miracle garden"]],
  [/Sheikh Zayed Road/i, ["sheikh zayed road", "office", "commercial"]],
];

/** Months from October 2026 to a handover such as "Q4 2028", "June 2028" or "2029". */
export function monthsUntil(handover: string | undefined, from = new Date(2026, 9, 1)): number {
  if (!handover) return 36;
  const year = Number(handover.match(/20\d\d/)?.[0]);
  if (!year) return 12;
  const quarter = handover.match(/Q([1-4])/i);
  const monthIndex = MONTHS.findIndex((m) => handover.toLowerCase().includes(m));
  const month = quarter ? Number(quarter[1]) * 3 - 1 : monthIndex >= 0 ? monthIndex : 11;
  return (year - from.getFullYear()) * 12 + (month - from.getMonth());
}
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

function fromSpec(s: ProjectSpec): Project {
  const bookable = !s.sold;
  const area = s.area;
  const keywords = new Set<string>(["dubai", ...area.toLowerCase().split(",").map((x) => x.trim()), s.name.toLowerCase().split(" ")[0]]);
  for (const [re, words] of AREA_WORDS) if (re.test(area)) words.forEach((w) => keywords.add(w));

  // Sizes, rates and layouts exist only for projects with units to book.
  let sizes: number[] = [];
  const bedrooms: Record<number, number> = {};
  let layoutNames: Record<number, string> | undefined;
  const sizeRates: Record<number, number> = {};
  let baseRate = 0;
  if (bookable && s.from) {
    if (s.office) {
      sizes = OFFICE_SIZES;
      layoutNames = {};
      sizes.forEach((sz, i) => {
        bedrooms[sz] = 0;
        layoutNames![sz] = OFFICE_NAMES[i];
      });
      baseRate = s.from / sizes[0];
      sizes.forEach((sz) => (sizeRates[sz] = Math.round(baseRate)));
    } else {
      const beds = s.beds ?? [0, 1, 2, 3];
      sizes = beds.map((b) => SAMPLE_SIZES[b]);
      beds.forEach((b) => (bedrooms[SAMPLE_SIZES[b]] = b));
      const first = beds[0];
      baseRate = (s.typePrices?.[first] ?? s.from) / SAMPLE_SIZES[first];
      for (const b of beds) {
        const published = s.typePrices?.[b];
        sizeRates[SAMPLE_SIZES[b]] = Math.round(published ? published / SAMPLE_SIZES[b] : baseRate);
      }
    }
  }

  const rows = 6;
  const floorStep = s.floors ? Math.max(3, Math.floor((s.floors - 5) / rows)) : 3;
  const maxBuildYears = Math.min(80, 100 - 20);
  const months = Math.max(12, Math.min(maxBuildYears, monthsUntil(s.handover)));
  const first = s.types[0]?.toLowerCase() ?? "units";
  const last = s.types[s.types.length - 1]?.toLowerCase() ?? first;
  const status = s.status;
  const opening = bookable ? "" : status === "completed" ? "Completed and sold out. " : "Listed as sold out. ";
  const homes = s.office ? "offices" : "homes";

  return {
    id: s.id,
    name: s.name,
    location: area,
    region: area,
    developer: "Danube Properties",
    illustrative: bookable,
    ratePerSqft: Math.round(baseRate),
    sizeRates: bookable ? sizeRates : undefined,
    sizes,
    bedrooms,
    layoutNames,
    unitCount: bookable ? 24 : 0,
    unitPrefix: s.prefix ?? "XX",
    outlook: "Rental income and resale value are not guaranteed.",
    hold: "3–5 years",
    holdYearsMin: 3,
    handover: s.handover ?? (status === "completed" ? "Completed" : "Not stated"),
    plan: { downPct: 20, months, confirmed: false },
    rera_no: "RERA-registered. Project number to be confirmed by Danube.",
    hook: `${opening}${s.types.length > 1 ? `${first} to ${last}` : first} ${homes} in ${area}, ${s.nearby[0][1]} ${s.nearby[0][1] === 1 ? "minute" : "minutes"} from ${s.nearby[0][0]}.`,
    connectivity: s.nearby.map(([label, minutes]) => ({ label, minutes })),
    features: [
      `${s.units ? `${s.units.toLocaleString("en-US")} ${s.office ? "offices" : "units"}` : "Units"}${s.floors ? ` across ${s.floors} floors` : ""}`,
      `Amenities include ${s.amenities.slice(0, 4).join(", ").toLowerCase()}`,
      s.furnished ? "Fully furnished" : "Freehold ownership for all nationalities",
      s.plan ? `Payment plan listed as ${s.plan}` : "Payment plan not listed on the project page",
    ],
    purposes: s.office ? ["investment", "rental_income"] : ["investment", "rental_income", "self_use", "golden_visa"],
    regionKeywords: [...keywords],
    cols: 4,
    firstFloor: 5,
    floorStep,
    floorPremium: 0.05 / ((rows - 1) * floorStep),
    views: ["Skyline", "Pool", "Community"],
    image: s.image,
    status,
    availability: bookable ? "available" : "sold_out",
    startingPrice: s.from,
    planLabel: s.plan,
    totalUnits: s.units,
    floors: s.floors,
    furnished: s.furnished,
    amenities: s.amenities,
    types: s.types,
    notes: s.notes,
    office: s.office,
  };
}

const FROM_SPECS = PROJECT_SPECS.map(fromSpec);

/** Every Danube project: the three with detailed data first, then those with units to book, then the rest. */
export const PROJECTS: Project[] = [
  ...HAND_BUILT,
  ...FROM_SPECS.filter((p) => p.availability === "available"),
  ...FROM_SPECS.filter((p) => p.availability === "sold_out"),
];


// mulberry32, seeded from the project id
function seededRandom(seedText: string): () => number {
  let seed = 0;
  for (const ch of seedText) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) | 0;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function rateFor(project: Project, sizeSqft: number): number {
  return project.sizeRates?.[sizeSqft] ?? project.ratePerSqft;
}

/** Floor of a row of units on the layout grid (the row number in a community). */
export function floorOf(project: Project, row: number): number {
  return project.firstFloor + row * project.floorStep;
}

export function bedroomLabel(bedrooms: number): string {
  return bedrooms === 0 ? "Studio" : `${bedrooms} bed`;
}

/** What to call the rows of the layout: floors in a tower, rows in a community. */
export function rowWord(project: Project): "Floor" | "Row" {
  return project.community ? "Row" : "Floor";
}

/** Corner, premium view and height each add to the base rate. */
export function unitPrice(project: Project, sizeSqft: number, isCorner: boolean, isPremiumView: boolean, floor: number): number {
  const heightPremium = (floor - project.firstFloor) * project.floorPremium;
  const multiplier = 1 + (isCorner ? 0.04 : 0) + (isPremiumView ? 0.03 : 0) + heightPremium;
  return Math.round((sizeSqft * rateFor(project, sizeSqft) * multiplier) / 1000) * 1000;
}

function generateUnits(project: Project): Unit[] {
  const rand = seededRandom(project.id);

  // Even spread of sizes, shuffled.
  const sizes = shuffle(
    Array.from({ length: project.unitCount }, (_, i) => project.sizes[i % project.sizes.length]),
    rand,
  );

  const units: Unit[] = [];
  for (let i = 0; i < project.unitCount; i++) {
    const gridRow = Math.floor(i / project.cols);
    const gridCol = i % project.cols;
    const isCorner = gridCol === 0 || gridCol === project.cols - 1;
    const floor = floorOf(project, gridRow);
    const view = project.views[Math.floor(rand() * project.views.length)];
    const isPremiumView = view === project.views[0];
    const sizeSqft = sizes[i];
    const bedrooms = project.bedrooms[sizeSqft];
    units.push({
      id: `${project.id}-${i + 1}`,
      projectId: project.id,
      unitNo: `${project.unitPrefix}-${String(floor).padStart(2, "0")}${String(gridCol + 1).padStart(2, "0")}`,
      sizeSqft,
      bedrooms,
      layout: project.layoutNames?.[sizeSqft] ?? bedroomLabel(bedrooms),
      floor,
      view,
      gridRow,
      gridCol,
      isCorner,
      isPremiumView,
      price: unitPrice(project, sizeSqft, isCorner, isPremiumView, floor),
      status: "available",
    });
  }

  // About 35% sold and 10% held, chosen by seeded shuffle.
  const order = shuffle(units.map((_, i) => i), rand);
  const sold = Math.round(project.unitCount * 0.35);
  const held = Math.round(project.unitCount * 0.1);
  order.slice(0, sold).forEach((i) => (units[i].status = "sold"));
  order.slice(sold, sold + held).forEach((i) => (units[i].status = "held"));

  // Every size keeps at least two units available, so no budget bracket is
  // ever sold out in the demo.
  for (const size of project.sizes) {
    const ofSize = units.filter((p) => p.sizeSqft === size);
    let free = ofSize.filter((p) => p.status === "available").length;
    for (const p of ofSize) {
      if (free >= Math.min(2, ofSize.length)) break;
      if (p.status !== "available") {
        p.status = "available";
        free++;
      }
    }
  }
  return units;
}

const UNITS: Record<string, Unit[]> = Object.fromEntries(PROJECTS.filter((p) => p.availability === "available").map((p) => [p.id, generateUnits(p)]));

/** Status changes made during the session (a paid token flips a unit to held). */
export type UnitOverrides = Record<string, UnitStatus>;

export function getProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}

export function getUnits(projectId: string, overrides: UnitOverrides = {}): Unit[] {
  return (UNITS[projectId] ?? []).map((p) => (overrides[p.id] ? { ...p, status: overrides[p.id] } : p));
}

export function getUnit(unitId: string, overrides: UnitOverrides = {}): Unit | undefined {
  const projectId = unitId.slice(0, unitId.lastIndexOf("-"));
  return getUnits(projectId, overrides).find((p) => p.id === unitId);
}

/** Resolves either an internal id (`bayz102-7`) or a unit number (`BY-1004`). */
export function findUnit(ref: string, overrides: UnitOverrides = {}): Unit | undefined {
  const byId = getUnit(ref, overrides);
  if (byId) return byId;
  const upper = ref.trim().toUpperCase();
  for (const project of PROJECTS) {
    const hit = getUnits(project.id, overrides).find((p) => p.unitNo === upper);
    if (hit) return hit;
  }
  return undefined;
}

/** The cheapest unit, or the page's starting price for a project with no units to book (0 if none). */
export function entryTicket(project: Project): number {
  if (!project.sizes.length) return project.startingPrice ?? 0;
  return Math.min(...project.sizes.map((s) => Math.round((s * rateFor(project, s)) / 1000) * 1000));
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  latest_launch: "Latest launch",
  ongoing: "Ongoing",
  completed: "Completed",
};

/** What to show in place of a price for a project with no units to book. */
export function availabilityLabel(project: Project): string {
  return project.status === "completed" ? "Completed · sold out" : "Sold out";
}
