"use client";

// Recommendations: the Property Advisor's top match for this customer as a hero
// card, the next best matches, and then every Danube project, so none is missed.

import Image from "next/image";
import { useAppRouter as useRouter, useIsDesktop } from "@/lib/nav";
import { useSession, type SearchResult } from "@/lib/store";
import { searchProjects } from "@/lib/agent/tools";
import { PROJECTS, STATUS_LABEL, availabilityLabel, entryTicket, getUnits, getProject, type Project, type Purpose } from "@/lib/inventory";
import { aedShort } from "@/lib/journey";
import { Button, Disclosure } from "@/components/journey/ui";
import { Skyline, UnitGrid } from "@/components/Skyline";
import { ArrowIcon, PinIcon, SparkleIcon } from "@/components/icons";

export default function Recommendations() {
  const router = useRouter();
  const desktop = useIsDesktop();
  const { lastSearch, profile, overrides, send } = useSession();
  // If the agent hasn't searched yet (a direct visit), rank from the profile.
  const results: SearchResult[] = lastSearch.length
    ? lastSearch
    : searchProjects(
        { budget_max: profile.budget_max, purpose: profile.purpose as Purpose | null, region: profile.region, horizon_years: profile.horizon_years },
        { overrides },
      ).projects;
  // The featured project leads (search_projects already puts it first), then the next best that can still be booked.
  const [top, ...rest] = results;
  const matches = rest.filter((p) => !p.sold_out);
  const open = (id: string) => router.push(`/units/${id}`);
  const first = profile.name?.split(" ")[0];
  const bookable = PROJECTS.filter((p) => p.availability === "available");
  const soldOut = PROJECTS.filter((p) => p.availability === "sold_out");

  return (
    <div className="d-full pb-4">
      {desktop && top && <DesktopHero p={top} first={first} onOpen={() => open(top.id)} overrides={overrides} />}
      <div className="d-wrap">
      <div className="px-4 pt-5 desk:hidden">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-gold">Curated for you</p>
        <h1 className="mt-1 font-display text-[34px] font-medium leading-[1.02] tracking-tight desk:mt-3 desk:text-[60px]">Choose where to explore</h1>
        <p className="mt-2 text-[14px] leading-snug text-ink-soft desk:mt-4 desk:max-w-[60ch] desk:text-[18px]!">
          Danube projects. Your Property Advisor has matched one to {first ? `your profile, ${first}` : "your profile"}.
        </p>
      </div>

      {!desktop && top && <TopPick p={top} onOpen={() => open(top.id)} overrides={overrides} />}

      {matches.length > 0 && (
        <section className="mt-6 px-4 desk:mt-14 desk:px-0">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-soft">Other good matches</h2>
          <div className="flex flex-col gap-2.5 desk:grid desk:grid-cols-2 desk:gap-5 deskxl:grid-cols-3 deskxxl:grid-cols-4">
            {matches.map((p) => {
              const project = getProject(p.id);
              return project ? <ProjectRow key={p.id} project={project} onOpen={() => open(p.id)} /> : null;
            })}
          </div>
        </section>
      )}

      <div className="mt-4 px-4 desk:mt-8 desk:px-0">
        <button onClick={() => void send("Can you compare these for me?")} className="w-full rounded-full desk:w-auto desk:px-10 border border-gold/40 bg-transparent py-3.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-gold">
          Ask the Property Advisor to compare
        </button>
      </div>

      <section className="mt-7 px-4 desk:mt-16 desk:px-0">
        <h2 className="font-display text-[26px] font-medium tracking-tight desk:text-[40px]">All {PROJECTS.length} Danube projects</h2>
        <div className="mt-1 h-px w-full bg-linear-to-r from-gold/40 to-transparent" />
        <h3 className="mb-3 mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-soft">Available to book · {bookable.length}</h3>
        <div className="flex flex-col gap-2.5 desk:grid desk:grid-cols-2 desk:gap-5 deskxl:grid-cols-3 deskxxl:grid-cols-4">
          {bookable.map((p) => (
            <ProjectRow key={p.id} project={p} onOpen={() => open(p.id)} />
          ))}
        </div>
        <h3 className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-soft">Sold out and completed · {soldOut.length}</h3>
        <div className="flex flex-col gap-2.5 desk:grid desk:grid-cols-2 desk:gap-5 deskxl:grid-cols-3 deskxxl:grid-cols-4">
          {soldOut.map((p) => (
            <ProjectRow key={p.id} project={p} onOpen={() => open(p.id)} />
          ))}
        </div>
      </section>

      <Disclosure>
        Profile fit ranks projects against what you&rsquo;ve told the Property Advisor. Rental income and resale value are not guaranteed, and property is a
        long-term, less liquid asset. Facts come from each project&rsquo;s page on danubeproperties.com, while unit prices and availability for bookable
        projects are sample data, so confirm them with the Danube sales team.
      </Disclosure>
      </div>
    </div>
  );
}

/** Desktop: the top match as a full-width banner under the nav. */
function DesktopHero({ p, first, onOpen, overrides }: { p: SearchResult; first?: string; onOpen: () => void; overrides: Record<string, "available" | "held" | "sold"> }) {
  const project = getProject(p.id);
  const units = getUnits(p.id, overrides);
  const taken = units.filter((x) => x.status !== "available").length;
  return (
    <section className="relative min-h-[620px] overflow-hidden bg-site text-white">
      <Thumb id={p.id} image={project?.image} sizes="100vw" priority />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      <div className="d-wrap relative flex min-h-[620px] flex-col justify-center py-16">
        <p className="text-[12px] font-semibold uppercase tracking-[0.32em] text-[#e0cfb0]">Curated for you{first ? `, ${first}` : ""}</p>
        <span className="mt-5 flex w-fit items-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-site">
          <SparkleIcon className="h-3.5 w-3.5" />
          Top recommendation for you
        </span>
        <h1 className="mt-5 max-w-[20ch] font-display text-[76px] font-medium leading-[0.98] tracking-tight [text-shadow:0_2px_20px_rgb(0_0_0/0.45)]">{p.name}</h1>
        <p className="mt-3 flex items-center gap-1.5 text-[16px] text-white/85">
          <PinIcon className="h-4 w-4" />
          {p.location}
        </p>
        <p className="mt-5 max-w-[54ch] text-[18px] leading-relaxed text-white/90">{project?.hook}</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-5">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-white/65">From</div>
            <div className="font-display text-[40px] font-medium leading-none text-[#e6d3b3]">{aedShort(p.cheapest_in_budget ?? p.entry_ticket)}</div>
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-white/65">Profile fit</div>
            <div className="font-display text-[40px] font-medium leading-none">{p.fit_score}%</div>
          </div>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-white/65">Units booked</div>
            <div className="font-display text-[40px] font-medium leading-none">
              {taken}/{units.length}
            </div>
          </div>
          {p.illustrative && <span className="rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">Sample pricing</span>}
        </div>
        <div className="mt-9 w-[240px]">
          <Button onClick={onOpen}>
            Explore
            <ArrowIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function TopPick({ p, onOpen, overrides }: { p: SearchResult; onOpen: () => void; overrides: Record<string, "available" | "held" | "sold"> }) {
  const project = getProject(p.id);
  const units = getUnits(p.id, overrides);
  const taken = units.filter((x) => x.status !== "available").length;
  return (
    <article className="mx-4 mt-5 overflow-hidden rounded-[28px] border border-gold/50 bg-card shadow-[0_24px_60px_-24px_rgba(201,176,142,0.45)] desk:mx-0 desk:mt-10 desk:grid desk:grid-cols-[1.35fr_1fr] desk:rounded-[36px]">
      <div className="relative h-52 bg-site desk:h-auto desk:min-h-[440px]">
        <Thumb id={p.id} image={project?.image} sizes="(min-width: 1024px) 720px, 428px" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/10" />
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-site">
          <SparkleIcon className="h-3.5 w-3.5" />
          Top recommendation for you
        </span>
        {p.illustrative && <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-1 text-[10.5px] font-semibold text-white backdrop-blur">Sample pricing</span>}
        <div className="absolute inset-x-4 bottom-3 text-white">
          <h2 className="font-display text-[32px] font-medium leading-none tracking-tight [text-shadow:0_2px_12px_rgb(0_0_0/0.55)] desk:text-[48px]">{p.name}</h2>
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-white/85">
            <PinIcon className="h-3.5 w-3.5" />
            {p.location}
          </p>
        </div>
      </div>
      <div className="px-4 pb-4 pt-3.5 desk:flex desk:flex-col desk:justify-center desk:p-12">
        <p className="text-[14px] leading-snug text-ink/90 desk:text-[18px]! desk:leading-relaxed">{project?.hook}</p>
        <div className="mt-3 flex items-center justify-between text-[13px]">
          <span className="font-semibold">{p.fit_score}% profile fit</span>
          <span className="font-semibold text-danger">
            {taken}/{units.length} units booked
          </span>
        </div>
        <div className="mt-3.5 flex items-center justify-between gap-3 desk:mt-10">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-ink-soft">From</div>
            <div className="font-display text-[30px] font-medium leading-none text-gold">{aedShort(p.cheapest_in_budget ?? p.entry_ticket)}</div>
          </div>
          <Button onClick={onOpen} className="px-5">
            Explore
            <ArrowIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}

function ProjectRow({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const soldOut = project.availability === "sold_out";
  const price = entryTicket(project);
  return (
    <button onClick={onOpen} className="group flex items-center gap-3.5 rounded-2xl border border-line bg-card p-3 text-left transition active:bg-verd-soft desk:flex-col desk:items-stretch desk:gap-0 desk:overflow-hidden desk:p-0 desk:hover:-translate-y-1 desk:hover:shadow-[0_24px_50px_-26px_rgb(0_0_0/0.4)]">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-site ring-1 ring-gold/25 desk:h-48 desk:w-full desk:rounded-none desk:ring-0">
        <Thumb id={project.id} image={project.image} sizes="(min-width: 1024px) 400px, 64px" />
      </div>
      <div className="min-w-0 flex-1 desk:p-5">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-display text-[19px] font-semibold tracking-tight desk:text-[24px]">{project.name}</span>
        </div>
        <p className="mt-0.5 flex items-center gap-1 truncate text-[12.5px] text-ink-soft">
          <PinIcon className="h-3 w-3 shrink-0" />
          <span className="truncate">{project.location}</span>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide">
          {soldOut ? (
            <span className="rounded bg-line px-1.5 py-px text-ink-soft">{availabilityLabel(project)}</span>
          ) : (
            <>
              <span className="rounded bg-verd-soft px-1.5 py-px text-verd">{STATUS_LABEL[project.status]}</span>
              {price > 0 && <span className="text-gold">From {aedShort(price, 1)}</span>}
            </>
          )}
          {project.handover && !soldOut && <span className="text-ink-soft">{project.handover}</span>}
        </div>
      </div>
    </button>
  );
}

/** Real imagery where we have it; a generated site plan otherwise. */
function Thumb({ id, image, sizes, priority = false }: { id: string; image?: string; sizes: string; priority?: boolean }) {
  if (image) return <Image src={image} alt="" fill sizes={sizes} priority={priority} className="object-cover" />;
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#555555] to-[#222222] text-white">
      <Skyline className="absolute inset-0 h-full w-full" opacity={0.3} />
      <UnitGrid className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80 ${id ? "h-1/2" : ""}`} />
    </div>
  );
}
