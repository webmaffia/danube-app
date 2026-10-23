"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/store";
import { avatar } from "@/lib/avatar/controller";
import { projectReturnLine } from "@/lib/avatar/screen-lines";
import { STATUS_LABEL, availabilityLabel, entryTicket, getUnits, getProject, PROJECTS } from "@/lib/inventory";
import { lookupKnowledge } from "@/lib/knowledge";
import { aedShort } from "@/lib/journey";
import { SITE_MAPS, flushScroll } from "@/lib/maps";
import { Badge, Button, Card, Disclosure, Section, Stat } from "@/components/journey/ui";
import { Skyline, UnitGrid } from "@/components/Skyline";
import { FilmStrip } from "@/components/journey/FilmStrip";
import { Gallery } from "@/components/journey/Gallery";
import { PinIcon } from "@/components/icons";

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
  const maxMin = Math.max(...ladder.map((c) => c.minutes));
  const title = lookupKnowledge("title_approvals", project.id);
  const timeline = lookupKnowledge("timeline", project.id);
  const amenities = lookupKnowledge("amenities", project.id);

  return (
    <div>
      {/* Hero: the films inline, narrated by the Property Advisor, else the photo or a generated skyline. */}
      {films.length > 0 ? (
        <FilmStrip
          key={project.id}
          projectName={project.name}
          videos={films}
          poster={project.image ?? films[0].poster}
          startDone={introSeen.includes(project.id)}
          returnLine={projectReturnLine(project.name, available, units.length, entryTicket(project), profile.name?.split(" ")[0] ?? null)}
          onFinished={() => markIntroSeen(project.id)}
        />
      ) : (
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[#555555] to-[#222222] text-site-ink">
          {project.image ? (
            <Image src={project.image} alt={project.name} fill sizes="428px" className="object-cover" priority />
          ) : (
            <>
              <Skyline className="absolute inset-0 h-full w-full" opacity={0.3} />
              <UnitGrid className="absolute left-1/2 top-1/2 h-28 -translate-x-1/2 -translate-y-1/2" />
            </>
          )}
        </div>
      )}

      <div className="px-4 pb-3 pt-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={soldOut ? "muted" : "verd"}>{soldOut ? availabilityLabel(project) : STATUS_LABEL[project.status]}</Badge>
          {project.illustrative && <Badge tone="gold">Sample pricing</Badge>}
        </div>
        <h1 className="mt-2 font-display text-[38px] font-medium leading-[1] tracking-tight">{project.name}</h1>
        <p className="mt-0.5 flex items-center gap-1 text-[13px] text-ink-soft">
          <PinIcon className="h-3.5 w-3.5" />
          {project.location}
        </p>
      </div>

      <div className="mx-4 overflow-hidden rounded-2xl border border-gold/30 bg-card shadow-[0_12px_30px_-20px_rgb(0_0_0/0.18)]">
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
      <Section title="The 1% payment plan">
        <Card className="px-3.5 py-3">
          <p className="text-[13.5px] leading-snug">
            Around 20% down, then 1% of the price a month while the building is built, and the balance on completion ({project.handover}).
            {project.plan.confirmed ? " These are the terms on the project page." : " This project's page doesn't publish its exact terms, so the schedule is indicative."} See what it comes to for a unit in the calculator.
          </p>
          <Button variant="secondary" size="sm" className="mt-2.5" onClick={() => router.push("/money/calculator")}>
            Open the calculator
          </Button>
        </Card>
      </Section>
      )}

      {project.notes?.length ? (
        <Section title="Notes from the project page">
          <Card className="divide-y divide-line">
            {project.notes.map((n) => (
              <p key={n} className="px-3.5 py-2.5 text-[13px] leading-snug">
                {n}
              </p>
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

      <Section title="Getting around (travel time)">
        <Card className="px-3.5 py-3">
          <ol className="relative">
            <span className="absolute bottom-2 left-[5px] top-2 w-px bg-line" />
            {ladder.map((c) => (
              <li key={c.label} className="relative flex items-start gap-3 py-1.5">
                <span className="relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-verd bg-card" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13.5px] font-medium">{c.label}</span>
                    <span className="shrink-0 text-[13.5px] font-semibold">{c.minutes} min</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-line">
                    <div className="h-1 rounded-full bg-verd/70" style={{ width: `${Math.max(4, (c.minutes / maxMin) * 100)}%` }} />
                  </div>
                  {c.note && <div className="mt-0.5 text-[11.5px] text-ink-soft">{c.note}</div>}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </Section>

      {SITE_MAPS[project.id] && (
        <div id="location" className="scroll-mt-2">
          <Section title="Location">
            <Card className="overflow-hidden">
              <iframe
                title={`${project.name} map`}
                src={SITE_MAPS[project.id].embed}
                loading="lazy"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="block h-64 w-full border-0"
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

      <Section title="What you get">
        <ul className="grid gap-2">
          {project.features.map((f) => (
            <li key={f} className="flex gap-3 rounded-2xl border border-line bg-card px-3.5 py-3 text-[13.5px] leading-snug">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              {f}
            </li>
          ))}
        </ul>
      </Section>

      {amenities.length > 0 && (
        <Section title="Amenities">
          <Card className="divide-y divide-line">
            {amenities.map((c) => (
              <p key={c.text} className="px-3.5 py-2.5 text-[13px] leading-snug">
                {c.text}
              </p>
            ))}
          </Card>
        </Section>
      )}

      <Section title="Paperwork and timeline">
        <Card className="divide-y divide-line">
          <div className="px-3.5 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Registration</div>
            <div className="mt-0.5 text-[13.5px] font-semibold">{project.rera_no}</div>
          </div>
          {[...title, ...timeline].map((c) => (
            <p key={c.text} className="px-3.5 py-2.5 text-[13px] leading-snug">
              {c.text}
            </p>
          ))}
        </Card>
      </Section>

      {PROJECTS.length > 1 && (
        <Section title="Other projects you can book">
          <div className="flex flex-col gap-2.5">
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
      <div className="h-28" />

      {/* Pinned to the bottom of the screen while scrolling; the avatar tile floats just above it. */}
      <div className="sticky bottom-0 z-10 grid grid-cols-2 gap-2 border-t border-gold/10 bg-paper/80 px-4 py-3 backdrop-blur-xl">
        {soldOut ? <Button onClick={() => router.push("/units")}>See projects to book</Button> : <Button onClick={() => router.push(`/units/${project.id}/map`)}>See the unit map</Button>}
        <Button variant="secondary" onClick={() => {
            avatar.bargeIn();
            void requestHuman();
          }}>
          Ask the advisor
        </Button>
      </div>
    </div>
  );
}
