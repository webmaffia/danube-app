"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useAppRouter as useRouter } from "@/lib/nav";
import { useSession } from "@/lib/store";
import { avatar } from "@/lib/avatar/controller";
import { projectBriefing, projectReturnLine } from "@/lib/avatar/screen-lines";
import { STATUS_LABEL, availabilityLabel, entryTicket, getUnits, getProject, PROJECTS } from "@/lib/inventory";
import { lookupKnowledge } from "@/lib/knowledge";
import { aedShort } from "@/lib/journey";
import { SITE_MAPS, flushScroll } from "@/lib/maps";
import { Badge, Button, Card, Disclosure, Section, Stat } from "@/components/journey/ui";
import { Skyline, UnitGrid } from "@/components/Skyline";
import { FilmStrip } from "@/components/journey/FilmStrip";
import { AmenityShowcase, Gallery } from "@/components/journey/Gallery";
import { PlaceIcon } from "@/components/journey/PlaceIcon";
import { PLACE_ICONS } from "@/lib/place-icons";
import { PinIcon } from "@/components/icons";

function Check({ className = "" }: { className?: string }) {
  return (
    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold ${className}`} aria-hidden>
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8.5l3.2 3L13 4.5" />
      </svg>
    </span>
  );
}

const JUMPS = [
  { id: "plan", label: "Payment plan" },
  { id: "travel", label: "Getting around" },
  { id: "location", label: "Location" },
  { id: "features", label: "What you get" },
  { id: "paperwork", label: "Paperwork" },
];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { overrides, lastSearch, requestHuman, markIntroSeen, introSeen, profile } = useSession();
  const project = getProject(id);
  // The advisor asked for the map: scroll to it once the page has settled at the top.
  useEffect(() => {
    const t = setTimeout(flushScroll, 450);
    return () => clearTimeout(t);
  }, [id]);
  if (!project) return <p className="p-6 text-ink-soft">Project not found.</p>;

  const films = project.videos ?? [];
  const units = getUnits(project.id, overrides);
  const available = units.filter((p) => p.status === "available").length;
  const soldOut = project.availability === "sold_out";
  const fit = lastSearch.find((s) => s.id === project.id);
  const ladder = [...project.connectivity].sort((a, b) => a.minutes - b.minutes);
  const title = lookupKnowledge("title_approvals", project.id);
  const timeline = lookupKnowledge("timeline", project.id);
  const amenities = lookupKnowledge("amenities", project.id);

  return (
    <div className="d-split desk:pt-10">
      {/* Hero: the films inline, narrated by the Property Advisor, else the photo or a generated skyline. */}
      <div className="desk:overflow-hidden desk:rounded-3xl">
      {films.length > 0 ? (
        <FilmStrip
          key={project.id}
          projectName={project.name}
          videos={films}
          poster={project.image ?? films[0].poster}
          startDone={introSeen.includes(project.id)}
          returnLine={projectReturnLine(project.name, available, units.length, entryTicket(project), profile.name?.split(" ")[0] ?? null)}
          briefing={projectBriefing(project.id, available, units.length, entryTicket(project), false) ?? undefined}
          onFinished={() => markIntroSeen(project.id)}
        />
      ) : (
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[#555555] to-[#222222] text-site-ink">
          {project.image ? (
            <Image src={project.image} alt={project.name} fill sizes="(min-width: 1024px) 760px, 428px" className="object-cover" priority />
          ) : (
            <>
              <Skyline className="absolute inset-0 h-full w-full" opacity={0.3} />
              <UnitGrid className="absolute left-1/2 top-1/2 h-28 -translate-x-1/2 -translate-y-1/2" />
            </>
          )}
        </div>
      )}
      </div>

      <div className="d-aside">
      <div className="px-4 pb-3 pt-4 desk:px-0 desk:pt-0">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={soldOut ? "muted" : "verd"}>{soldOut ? availabilityLabel(project) : STATUS_LABEL[project.status]}</Badge>
          {project.illustrative && <Badge tone="gold">Sample pricing</Badge>}
        </div>
        <h1 className="mt-2 font-display text-[38px] font-medium leading-[1] tracking-tight desk:mt-3 desk:text-[44px]">{project.name}</h1>
        <p className="mt-0.5 flex items-center gap-1 text-[13px] text-ink-soft desk:mt-2 desk:text-[15px]">
          <PinIcon className="h-3.5 w-3.5" />
          {project.location}
        </p>
      </div>

      <div className="mx-4 overflow-hidden rounded-2xl border border-gold/30 bg-card shadow-[0_12px_30px_-20px_rgb(0_0_0/0.18)] desk:mx-0 desk:mt-2">
        <div className="flex items-end justify-between gap-3 bg-gold-soft px-4 py-3.5">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">{soldOut ? "Was from" : "Starting from"}</div>
            <div className="mt-0.5 font-display text-[34px] font-semibold leading-none tracking-tight text-ink">
              {entryTicket(project) > 0 ? aedShort(entryTicket(project), 2) : "Not available"}
            </div>
          </div>
          {project.planLabel && <div className="shrink-0 pb-0.5 text-right text-[12px] font-medium text-ink-soft">{project.planLabel}</div>}
        </div>
        <div className="grid grid-cols-3 divide-x divide-line px-1 py-3">
          <Stat label="Handover" value={project.handover.replace(/ 20(\d\d)/, " '$1")} />
          <Stat label="Available" value={soldOut ? "Sold out" : `${available}/${units.length}`} />
          <Stat label="Hold" value={project.hold.replace(" years", "y")} />
        </div>
      </div>

      {/* Desktop: the actions live beside the page, so they never scroll away. */}
      <div className="mt-5 hidden flex-col gap-3 desk:flex">
        {soldOut ? (
          <Button onClick={() => router.push("/units")}>More projects</Button>
        ) : (
          <>
            <Button onClick={() => router.push(`/units/${project.id}/map`)}>View the unit map</Button>
            <Button variant="secondary" onClick={() => router.push("/money/calculator")}>
              Payment plan calculator
            </Button>
          </>
        )}
        <Button
          variant="secondary"
          onClick={() => {
            avatar.bargeIn();
            void requestHuman();
          }}
        >
          Ask an advisor
        </Button>
      </div>
      </div>

      <nav aria-label="Jump to a section" className="mt-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] desk:mt-8 desk:flex-wrap desk:overflow-visible desk:px-0">
        {JUMPS.map((j) => (
          <button
            key={j.id}
            onClick={() => document.getElementById(j.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="shrink-0 rounded-full border border-gold/40 bg-card px-3.5 py-1.5 text-[12.5px] font-medium text-ink-soft active:bg-gold-soft"
          >
            {j.label}
          </button>
        ))}
      </nav>

      <Gallery projectId={project.id} projectName={project.name} />

      {soldOut ? (
        <Section title="Availability">
          <Card className="px-3.5 py-3">
            <p className="text-[13.5px] leading-snug">
              {project.name} is {project.status === "completed" ? "completed and sold out" : "sold out"}, so there are no units to book. {project.planLabel ? `Its page lists the payment plan as ${project.planLabel}. ` : ""}Ask the Property Advisor about a similar project that still has units.
            </p>
            <Button variant="secondary" size="sm" className="mt-2.5" onClick={() => router.push("/units")}>
              See projects you can book
            </Button>
          </Card>
        </Section>
      ) : (
      <Section id="plan" title="The 1% payment plan">
        <Card className="overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-line bg-gold-soft/60 py-4 text-center">
            <div className="px-2">
              <div className="font-display text-[26px] font-semibold leading-none">20%</div>
              <div className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">Down</div>
            </div>
            <div className="px-2">
              <div className="font-display text-[26px] font-semibold leading-none text-gold">1%</div>
              <div className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">Every month</div>
            </div>
            <div className="px-2">
              <div className="font-display text-[26px] font-semibold leading-none">Rest</div>
              <div className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">On handover</div>
            </div>
          </div>
          <div className="px-4 py-3.5">
            <p className="text-[13.5px] leading-relaxed text-ink-soft">
              About 20% down, then 1% of the price a month while the building is built, and the balance on completion ({project.handover}).
              {project.plan.confirmed ? " These are the terms on the project page." : " This project's page doesn't publish its exact terms, so the schedule is indicative."}
            </p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => router.push("/money/calculator")}>
              Open the calculator
            </Button>
          </div>
        </Card>
      </Section>
      )}

      {project.notes?.length ? (
        <Section title="Notes from the project page">
          <Card className="divide-y divide-line">
            {project.notes.map((n) => (
              <div key={n} className="flex items-start gap-3 px-3.5 py-3">
                <Check className="mt-px" />
                <p className="text-[13.5px] leading-snug">{n}</p>
              </div>
            ))}
          </Card>
        </Section>
      ) : null}

      {fit && (
        <Section title="Why it fits you">
          <Card className="px-3.5 py-3">
            <div className="flex flex-wrap gap-1.5">
              {fit.fit_reason.split("; ").map((r) => (
                <Badge key={r} tone={/^no |outside|longer/.test(r) ? "muted" : "verd"}>
                  {r}
                </Badge>
              ))}
            </div>
            <p className="mt-2 text-[13.5px] leading-snug">{project.hook}</p>
          </Card>
        </Section>
      )}

      <Section id="travel" title="Getting around">
        <p className="-mt-1 mb-4 text-center text-[12.5px] text-ink-soft">Travel time from {project.name}</p>
        <ul className="grid grid-cols-3 overflow-hidden rounded-xl border border-line bg-card">
          {ladder.map((c, i) => {
            const icon = PLACE_ICONS[project.id]?.[c.label];
            const rows = Math.ceil(ladder.length / 3);
            const lastRow = Math.floor(i / 3) === rows - 1;
            return (
              <li
                key={c.label}
                className={`flex flex-col items-center px-2 py-5 text-center ${i % 3 !== 2 ? "border-r border-line" : ""} ${lastRow ? "" : "border-b border-line"}`}
              >
                {icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={icon} alt="" width={40} height={40} className="h-10 w-10 object-contain" />
                ) : (
                  <PlaceIcon label={c.label} className="h-10 w-10 text-gold" />
                )}
                <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">{c.minutes} {c.minutes === 1 ? "min" : "mins"}</div>
                <div className="mt-0.5 text-[11px] font-medium uppercase leading-snug tracking-[0.1em] text-muted">{c.label}</div>
                {c.note && <div className="mt-1 text-[10px] leading-tight text-muted">{c.note}</div>}
              </li>
            );
          })}
        </ul>
      </Section>

      {SITE_MAPS[project.id] && (
        <div id="location" className="scroll-mt-3">
          <Section title="Location">
            <Card className="overflow-hidden">
              <iframe
                title={`${project.name} map`}
                src={SITE_MAPS[project.id].embed}
                loading="lazy"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="block h-64 w-full border-0 desk:h-96"
              />
              <a
                href={SITE_MAPS[project.id].link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2.5 text-[13.5px] font-semibold text-verd"
              >
                <PinIcon className="h-4 w-4" />
                <span className="flex-1">Open in Google Maps</span>
                <span aria-hidden>↗</span>
              </a>
            </Card>
          </Section>
        </div>
      )}

      <Section id="features" title="What you get">
        <ul className="grid gap-2 desk:grid-cols-2 desk:gap-3 deskxl:grid-cols-3">
          {project.features.map((f) => (
            <li key={f} className="flex items-start gap-3 rounded-2xl border border-line bg-card px-3.5 py-3 text-[13.5px] leading-snug shadow-[0_10px_28px_-24px_rgb(0_0_0/0.25)]">
              <Check className="mt-px" />
              {f}
            </li>
          ))}
        </ul>
      </Section>

      <AmenityShowcase projectId={project.id} projectName={project.name} />

      {amenities.length > 0 && (
        <Section title="Amenities">
          <Card className="divide-y divide-line">
            {amenities.map((c) => (
              <div key={c.text} className="flex items-start gap-3 px-3.5 py-3">
                <Check className="mt-px" />
                <p className="text-[13.5px] leading-snug">{c.text}</p>
              </div>
            ))}
          </Card>
        </Section>
      )}

      <Section id="paperwork" title="Paperwork and timeline">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/40 bg-gold-soft px-4 py-3.5">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Registration (RERA)</div>
            <div className="mt-0.5 text-[15px] font-semibold">{project.rera_no}</div>
          </div>
          <Check className="h-7 w-7" />
        </div>
        <ol className="relative mt-4 pl-1">
          <span className="absolute bottom-2 left-[8px] top-2 w-px bg-line" />
          {[...title, ...timeline].map((c) => (
            <li key={c.text} className="relative flex items-start gap-3 py-2">
              <span className="relative mt-1.5 h-[11px] w-[11px] shrink-0 border-2 border-gold bg-card" />
              <p className="text-[13.5px] leading-snug">{c.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      {PROJECTS.length > 1 && (
        <Section title="Other projects you can book">
          <div className="flex flex-col gap-2.5 desk:grid desk:grid-cols-2 desk:gap-3">
            {PROJECTS.filter((p) => p.id !== project.id && p.availability === "available").slice(0, 6).map((p) => (
              <button
                key={p.id}
                onClick={() => router.push(`/units/${p.id}`)}
                className="flex items-center gap-3 rounded-2xl border border-line bg-card p-2.5 text-left active:bg-verd-soft"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#555555] to-[#222222] text-site-ink">
                  {p.image ? (
                    <Image src={p.image} alt={p.name} fill sizes="56px" className="object-cover" />
                  ) : (
                    <>
                      <Skyline className="absolute inset-0 h-full w-full" opacity={0.25} />
                      <UnitGrid className="absolute left-1/2 top-1/2 h-10 -translate-x-1/2 -translate-y-1/2" />
                    </>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-display text-[18px] font-semibold tracking-tight">{p.name}</span>
                    {p.illustrative && <span className="shrink-0 rounded bg-line px-1 py-px text-[9.5px] font-semibold uppercase tracking-wide text-ink-soft">Sample pricing</span>}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[12.5px] text-ink-soft">
                    <PinIcon className="h-3 w-3 shrink-0" />
                    {p.location}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </Section>
      )}

      <Disclosure>
        Risk disclosure: property values and rents can fall as well as rise, and past performance doesn&rsquo;t predict future results. Rental
        income and resale value are not guaranteed, and property is a long-term, less liquid asset: plan to hold for {project.hold}. Confirm the
        project&rsquo;s RERA registration before paying. Prices, layouts and dates shown here are sample data.
      </Disclosure>

      {/* Room for the avatar tile above the pinned buttons at the end of the page. */}
      <div className="h-28 desk:hidden" />

      {/* Pinned to the bottom of the screen while scrolling; the avatar tile floats just above it. */}
      <div className="sticky bottom-0 z-10 grid grid-cols-2 gap-2 border-t border-gold/10 bg-paper/80 px-4 py-3 backdrop-blur-xl desk:hidden">
        {soldOut ? <Button onClick={() => router.push("/units")}>More projects</Button> : <Button onClick={() => router.push(`/units/${project.id}/map`)}>Unit map</Button>}
        <Button variant="secondary" onClick={() => {
            avatar.bargeIn();
            void requestHuman();
          }}>
          Ask advisor
        </Button>
      </div>
    </div>
  );
}
