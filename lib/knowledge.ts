// Policies, facts and the objection playbook. Plain objects, no embeddings: at
// three projects the whole corpus is small enough to look up by key.
//
// Project facts come from the project pages on danubeproperties.com (fetched
// October 2026) and the 1% payment plan page. The booking and cancellation
// terms and the token amount are SAMPLE content written for this prototype:
// confirm them with Danube before launch.

import { PROJECTS, getProject, type Project } from "@/lib/inventory";

export const PROJECT_TOPICS = [
  "connectivity",
  "location",
  "payment_plan",
  "booking_policy",
  "title_approvals",
  "timeline",
  "amenities",
  "infrastructure",
  "developer",
  "market",
] as const;

export const OBJECTION_TOPICS = [
  "why_here",
  "price",
  "consult_spouse",
  "asset_class",
  "finance",
  "stall",
] as const;

export const TOPICS = [...PROJECT_TOPICS, ...OBJECTION_TOPICS] as const;

export type ProjectTopic = (typeof PROJECT_TOPICS)[number];
export type ObjectionTopic = (typeof OBJECTION_TOPICS)[number];
export type Topic = (typeof TOPICS)[number];

/** Booking token in AED. Sample amount. */
export const TOKEN_AMOUNT = 20000;
/** Down payment as a share of the price, as Danube's 1% plan page puts it ("around 20%"). */
export const DOWN_PAYMENT_PCT = 20;
/** Each monthly instalment, as a share of the price. */
export const MONTHLY_PCT = 1;
export const MIN_PLAN_MONTHS = 12;
/** The longest monthly plan Danube advertises. */
export const MAX_PLAN_MONTHS = 80;

const PLAN_BASE =
  "Danube's 1% payment plan: a down payment of around 20%, then 1% of the price every month while the building is built, and the balance when the building is ready. Danube says it was the first developer in the region to launch the 1% plan and has delivered over 15,000 apartments through it. Booking starts with a token of AED 20,000 (sample amount), which counts toward the down payment. Government fees such as the Dubai Land Department registration fee are separate, so confirm the exact amount with the sales team.";

const UNCONFIRMED_PLAN = (listed: string, months: number) =>
  `${PLAN_BASE} This project's page lists a ${listed} payment plan and links the 1% plan without giving its terms, so the schedule shown in the app (20% down, then ${months} monthly instalments of 1%, then the balance on completion) is indicative. Confirm this project's exact terms with the sales team.`;

// Connectivity is generated from the inventory's travel times.
type ProjectKnowledge = Record<Exclude<ProjectTopic, "connectivity">, string[]>;

const DEVELOPER_FACTS = [
  "Danube Properties was founded in 1993 by Rizwan Sajan and describes itself as one of Dubai's top three developers. It has launched 32 projects, delivered 16 and has 16 under construction, covering over 25.5 million sq ft.",
  "Danube is known for its 1% monthly payment plan, 40+ amenities in its buildings, fully furnished homes and freehold ownership.",
  `This app lists all ${PROJECTS.length} Danube projects. Those with units to book are ${PROJECTS.filter((p) => p.availability === "available").map((p) => p.name.replace(" by Danube", "")).join(", ")}. The rest are completed or sold out.`,
];

const BOOKING_POLICY = [
  "The AED 20,000 token holds the unit for 15 days and is fully refundable within that window, no questions asked. This is a sample term: confirm it with the sales team.",
  "The sales and purchase agreement is issued after the down payment is complete, and the sale is then registered with the Dubai Land Department through Oqood. Cancellation terms after signing follow the signed agreement and Dubai's off-plan rules, which the sales team walks through.",
];

const TITLE_APPROVALS = [
  "Dubai off-plan projects are registered with RERA, the Real Estate Regulatory Agency, and buyer payments are held in a project escrow account under Dubai law.",
  "Ownership is freehold, open to all nationalities. The project's RERA registration number is shared in the sales and purchase agreement.",
];

const INVESTMENT_POINTS =
  "Danube highlights freehold ownership, 100% tax-free income, long-term Golden Visa eligibility, a safe-city reputation and a fast-growing economy. Golden Visa eligibility is decided by the authorities, so confirm the current requirements with the sales team.";

export const KNOWLEDGE: Record<string, ProjectKnowledge> = {
  bayz102: {
    location: [
      "Bayz 102 is in Business Bay, Dubai, beside Business Bay Canal. The project page puts the canal 2 minutes away, the metro, Burj Khalifa and The Dubai Mall 3 minutes away, and City Walk and the Museum of the Future 5 minutes away.",
      "Site visits: customers are welcome to visit. The sales team arranges the visit and meets you there, so confirm a date with them first.",
    ],
    payment_plan: [UNCONFIRMED_PLAN("30/70", getProject("bayz102")!.plan.months)],
    booking_policy: BOOKING_POLICY,
    title_approvals: TITLE_APPROVALS,
    timeline: [
      "The project overview gives handover as June 2029, while the project FAQ gives an estimated completion of December 2028. Confirm the date with the sales team.",
    ],
    amenities: [
      "Bayz 102 has 956 apartments across 102 levels. Highlights are the Skyway, a helipad with sky taxi and helicopter access, an infinity pool with canal views, an indoor gym, an aquatic gym and rain showers.",
      "The full list also includes an anti-current pool, arcade zone, sky garden, sky golf, sky meditation deck, outdoor cinema, library, cafe, spa, jacuzzi, padel and tennis courts. Homes are fully furnished with premium Italian Dolce Vita furniture.",
    ],
    infrastructure: [
      "Business Bay Canal is 2 minutes away, and the Business Bay metro, Burj Khalifa and The Dubai Mall are each 3 minutes away.",
      "Business Bay is one of Dubai's central, high-liquidity areas. This describes the area, not a guarantee of returns.",
    ],
    developer: DEVELOPER_FACTS,
    market: [
      INVESTMENT_POINTS,
      "Published starting prices on the project page: studio from about AED 1.27 million, 1-bedroom executive from AED 2.23 million, 2-bedroom from AED 3.05 million, 3-bedroom from AED 4.9 million and 4-bedroom from AED 6.7 million. Rental income and resale value are not guaranteed.",
    ],
  },
  shahrukhzres: {
    location: [
      "Shahrukhz Residences is in Dubai Maritime City, a waterfront district of Dubai. The project page puts Port Rashid Boat Station 2 minutes away and Dubai Cruise Terminal 2 about 3 minutes away.",
      "Site visits: customers are welcome to visit. The sales team arranges the visit and meets you there, so confirm a date with them first.",
    ],
    payment_plan: [UNCONFIRMED_PLAN("30/70", getProject("shahrukhzres")!.plan.months)],
    booking_policy: BOOKING_POLICY,
    title_approvals: TITLE_APPROVALS,
    timeline: ["The project page gives handover as Q4 2029."],
    amenities: [
      "Shahrukhz Residences is a fully furnished waterfront residence. Highlights are Infinity 33, the King's Club Deck, an indoor gym, the Longevity Lounge, a beach lagoon and a sports hub.",
      "The full list also includes cryo therapy, an ice bath, a golf simulator, padel and tennis courts, a spa, aquatic gym, party hall, kids' areas, a business center and a prayer hall.",
    ],
    infrastructure: [
      "Port Rashid Boat Station is 2 minutes away and Dubai Cruise Terminal 2 about 3 minutes. Dubai World Trade Centre and Jumeirah Beach are about 8 minutes away, Burj Khalifa 10 minutes and Dubai International Airport 15 minutes.",
    ],
    developer: [
      ...DEVELOPER_FACTS,
      "Shahrukhz Residences is Danube's latest launch. It is separate from Shahrukhz, a 55-storey commercial office tower on Sheikh Zayed Road.",
    ],
    market: [
      INVESTMENT_POINTS,
      "The project page gives a starting price of AED 1.65 million, with studio, 1, 2 and 3-bedroom apartments and penthouses. Prices for the other types are not published. Rental income and resale value are not guaranteed.",
    ],
  },
  greenz: {
    location: [
      "Greenz is a gated community in Dubai Academic City, Dubai, close to Emirates Road, Dubai–Al Ain Road and Sheikh Mohammed Bin Zayed Road, with the Blue Line metro about 5 minutes away.",
      "Site visits: customers are welcome to visit. The sales team arranges the visit and meets you there, so confirm a date with them first.",
    ],
    payment_plan: [
      `${PLAN_BASE} For Greenz, the project FAQ gives 20% down, 1% monthly instalments for 40 months, and the final 40% after completion in Q4 2029. The project banner shows a 30/60 plan, so confirm the exact terms with the sales team. Greenz may also be eligible for Danube's Summer Bonanza offer, subject to its terms.`,
    ],
    booking_policy: BOOKING_POLICY,
    title_approvals: TITLE_APPROVALS,
    timeline: ["The project page gives completion as Q4 2029."],
    amenities: [
      "Greenz is fully furnished with branded Italian furniture by Dolce Vita. The community covers about 4.9 million sq ft, with about 400,000 sq ft for lifestyle amenities and green space.",
      "The four hubs are the Beach Hub, the Dancing Fountain, the Wellness Hub and the Sports Hub with 10 courts, plus a beach clubhouse with a rooftop deck. The list includes infinity and kids' pools, a gym, spa, padel, tennis, basketball, cricket and pickleball courts, jogging tracks and a prayer hall.",
    ],
    infrastructure: [
      "Emirates Road is 1 minute away, Dubai–Al Ain Road 2 minutes, the Blue Line metro and Sheikh Mohammed Bin Zayed Road 5 minutes, Silicon Central Mall 10 minutes and Dubai Safari Park 11 minutes.",
      "IMG Worlds of Adventure is about 13 minutes away, Global Village about 15 minutes, and Dubai International Airport and Downtown Dubai about 17 to 18 minutes.",
    ],
    developer: [
      ...DEVELOPER_FACTS,
      "Greenz is described as Dubai's first fully furnished master villa project, with 768 townhouses and villas.",
    ],
    market: [
      INVESTMENT_POINTS,
      "The project page lists 3-bedroom townhouses from about 2,350 sq ft, 4-bedroom townhouses at 2,750 to 3,100 sq ft, and 5-bedroom semi-detached villas of about 3,700 sq ft and twin villas of about 3,950 sq ft, all starting from AED 3.7 million. Danube says buyers can qualify for the Golden Visa at the AED 2 million property threshold, subject to government requirements.",
    ],
  },
};

// Every project without a hand-written entry above gets one built from its
// project page data, so the advisor can answer about all of them. Projects with
// nothing left to book say so.
function generated(p: Project): ProjectKnowledge {
  const soldOut = p.availability === "sold_out";
  const near = p.connectivity.map((c) => `${c.label} ${c.minutes} minutes`).join(", ");
  const status = p.status === "completed" ? "completed" : p.status === "latest_launch" ? "a latest launch" : "ongoing";
  const notes = p.notes?.length ? [`Notes from the project page: ${p.notes.join(" ")}`] : [];
  const planLabel = p.planLabel ? `The project page lists the payment plan as ${p.planLabel}.` : "The project page does not list a payment plan.";
  return {
    location: [
      `${p.name} is in ${p.location}, and is ${status}. The project page gives these travel times (the mode is not stated): ${near}.`,
      soldOut
        ? `${p.name} is sold out, so there are no units to book here.`
        : "Site visits: customers are welcome to visit. The sales team arranges the visit and meets you there, so confirm a date with them first.",
    ],
    payment_plan: soldOut
      ? [`${p.name} is sold out, so there is no plan to book. ${planLabel} Danube's 1% payment plan is a down payment of around 20%, then 1% of the price a month, then the balance when the building is ready.`]
      : [
          `${PLAN_BASE} ${planLabel} The page does not publish the terms, so the schedule shown in the app (20% down, then ${p.plan.months} monthly instalments of 1%, then the balance on completion) is indicative. Confirm this project's exact terms with the sales team.`,
        ],
    booking_policy: soldOut
      ? [`${p.name} is sold out, so there is nothing to book. Offer an available project instead.`]
      : BOOKING_POLICY,
    title_approvals: TITLE_APPROVALS,
    timeline: [
      p.status === "completed" ? `${p.name} is completed${p.handover && p.handover !== "Completed" ? ` (${p.handover})` : ""}.` : `${p.name} is ${status}, with handover ${p.handover}.`,
      ...notes,
    ],
    amenities: [
      `Amenities listed on the project page: ${p.amenities?.join(", ")}.${p.furnished ? " Homes are fully furnished." : ""}`,
      `${p.totalUnits ? `${p.totalUnits.toLocaleString("en-US")} ${p.office ? "offices" : "units"}` : "Unit count not stated"}${p.floors ? ` across ${p.floors} floors` : ""}. Layouts listed: ${p.types?.join(", ")}.`,
    ],
    infrastructure: [`Travel times from ${p.name}: ${near}.`],
    developer: DEVELOPER_FACTS,
    market: [
      INVESTMENT_POINTS,
      p.startingPrice
        ? `The project page gives a starting price of AED ${p.startingPrice.toLocaleString("en-US")}${soldOut ? ", although the project is sold out" : ""}. Rental income and resale value are not guaranteed.`
        : "The project page gives no starting price. Rental income and resale value are not guaranteed.",
    ],
  };
}
for (const p of PROJECTS) KNOWLEDGE[p.id] ??= generated(p);

/** Approved response shapes. The agent paraphrases them and never goes beyond them. */
export const OBJECTIONS: Record<ObjectionTopic, { general: string; byProject?: Record<string, string> }> = {
  why_here: {
    general:
      "Answer with facts about the area, the travel times and what Danube has already delivered (16 projects delivered, per Danube). Pull the project's infrastructure and timeline topics for figures.",
    byProject: {
      bayz102:
        "Bayz 102 is the central address: Business Bay, 3 minutes from Burj Khalifa and The Dubai Mall, in an area Danube describes as high-liquidity with low vacancy, with a canal-view infinity pool and a sky-level helipad.",
      shahrukhzres:
        "Shahrukhz Residences is Danube's latest launch, a fully furnished waterfront residence in Dubai Maritime City, 15 minutes from Dubai International Airport and 10 minutes from Burj Khalifa.",
      greenz:
        "Greenz suits buyers who want space: a gated community of fully furnished 3 to 5-bedroom townhouses and villas, with a beach clubhouse and 10 sports courts, a few minutes from the Blue Line metro and the main Dubai highways.",
    },
  },
  price: {
    general:
      "Never offer a discount or price exception. Offer, in this order: a smaller unit or a lower floor, the 1% payment plan (about 20% down, then 1% a month, so the cost is spread over the build), and a different project with a lower entry ticket. Ask which of these helps most.",
  },
  consult_spouse: {
    general:
      "Treat it as sensible. Offer to send a short summary of the shortlisted unit, price and payment plan, and suggest a time to reconnect together. Do not push for a decision today.",
  },
  asset_class: {
    general:
      "You may point to what Danube highlights: freehold ownership, 100% tax-free income, Golden Visa eligibility, fully furnished homes that are ready to rent, and the 1% plan that spreads the cost. Say clearly that no one can guarantee rental income or resale value, and that property is less liquid than shares or deposits. Do not quote yields or price growth unless a tool result gives them.",
  },
  finance: {
    general:
      "Danube's own plan is the finance: around 20% down, then 1% a month while the building is built, then the balance on completion, so the customer does not need a bank loan to start. Offer to run the payment calculator. If the customer asks about a mortgage for the completion balance, say the sales team can explain the options and offer a human advisor.",
  },
  stall: {
    general:
      "Ask gently what is holding them back (timing, budget, family or something else), note the reason, offer a follow-up, and apply no pressure. On a second stall, offer to connect a human advisor.",
  },
};

export interface KnowledgeChunk {
  text: string;
  topic: string;
}

export function lookupKnowledge(topic: Topic, projectId?: string | null): KnowledgeChunk[] {
  if ((OBJECTION_TOPICS as readonly string[]).includes(topic)) {
    const entry = OBJECTIONS[topic as ObjectionTopic];
    const chunks: KnowledgeChunk[] = [{ text: entry.general, topic }];
    if (projectId && entry.byProject?.[projectId]) chunks.push({ text: entry.byProject[projectId], topic });
    return chunks;
  }
  const projectIds = projectId ? [projectId] : Object.keys(KNOWLEDGE);
  return projectIds.flatMap((id) => {
    const texts = topic === "connectivity" ? connectivityText(id) : KNOWLEDGE[id]?.[topic as Exclude<ProjectTopic, "connectivity">] ?? [];
    return texts.map((text) => ({ text: projectId ? text : `[${id}] ${text}`, topic }));
  });
}

function connectivityText(projectId: string): string[] {
  const project = getProject(projectId);
  if (!project) return [];
  return [
    `${project.name} travel times (the project page does not say by what mode): ` +
      project.connectivity.map((c) => `${c.label} ${c.minutes} minutes${c.note ? ` (${c.note})` : ""}`).join("; ") + ".",
  ];
}
