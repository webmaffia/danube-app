"use client";

// Unit map: every unit in the building, one row per floor with the top floor
// first, coloured by status. Sold units stay visible, because scarcity is part
// of the pitch. Tap a unit for its details.

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/store";
import { bedroomLabel, floorOf, getUnits, getProject, rowWord, type Unit } from "@/lib/inventory";
import { aedShort, sqft } from "@/lib/journey";
import { TOKEN_AMOUNT } from "@/lib/knowledge";
import { Badge, Button, Card, ScreenTitle } from "@/components/journey/ui";
import { avatar } from "@/lib/avatar/controller";
import { unitLine } from "@/lib/avatar/screen-lines";

export default function UnitMap() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { overrides, selectedUnit, selectUnit, profile, booking, setBooking } = useSession();
  const project = getProject(id);
  const units = useMemo(() => (project ? getUnits(project.id, overrides) : []), [project, overrides]);
  const prices = units.map((p) => p.price);
  const [size, setSize] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  // Which unit's popup is open. A unit picked earlier doesn't reopen it on arrival; a new pick does.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setOpenFor(selectedUnit);
  }, [selectedUnit]);

  if (!project) return <p className="p-6 text-ink-soft">Project not found.</p>;
  if (!units.length) {
    return (
      <div className="flex min-h-full flex-col">
        <ScreenTitle eyebrow={project.name} title="No units to book" sub={`${project.name} is ${project.status === "completed" ? "completed and sold out" : "sold out"}.`} />
        <div className="px-4 pt-4">
          <Button onClick={() => router.push("/units")}>See projects you can book</Button>
        </div>
      </div>
    );
  }

  const minP = Math.floor(Math.min(...prices) / 100000) * 100000;
  const maxP = Math.ceil(Math.max(...prices) / 100000) * 100000;
  const cap = maxPrice ?? maxP;
  const matches = (p: Unit) => (size == null || p.sizeSqft === size) && p.price <= cap;
  const available = units.filter((p) => p.status === "available");
  const shown = available.filter(matches).length;
  const rows = Math.ceil(units.length / project.cols);
  const selected = units.find((p) => p.id === selectedUnit) ?? null;
  // Top floor first, like looking at the building from the street.
  const floorRows = Array.from({ length: rows }, (_, i) => rows - 1 - i);

  return (
    <div>
      <ScreenTitle
        eyebrow={project.name}
        title="Unit map"
        sub={
          <>
            <b className="font-semibold text-ink">{available.length}</b> of {units.length} available
            {profile.budget_max ? ` · ${available.filter((p) => p.price <= profile.budget_max!).length} within your budget` : ""}
          </>
        }
      />

      {/* filters */}
      <div className="mt-3 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]">
        {[null, ...project.sizes].map((s) => (
          <button
            key={s ?? "all"}
            onClick={() => setSize(s)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold ${
              size === s ? "border-verd bg-verd text-white" : "border-line bg-card text-ink"
            }`}
          >
            {s == null ? "All layouts" : `${project.layoutNames?.[s] ?? bedroomLabel(project.bedrooms[s])} · ${sqft(s)}`}
          </button>
        ))}
      </div>
      <div className="mt-3 px-4">
        <div className="flex items-baseline justify-between text-[12px] text-ink-soft">
          <span>Up to {aedShort(cap, 1)}</span>
          <span>{shown} match</span>
        </div>
        <input
          type="range"
          min={minP}
          max={maxP}
          step={50000}
          value={cap}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="mt-1 w-full accent-[var(--verd)]"
          aria-label="Maximum price"
        />
      </div>

      {/* the building */}
      <div className="mx-4 mt-3 rounded-2xl border border-line bg-[repeating-linear-gradient(0deg,transparent,transparent_23px,var(--line)_24px)] p-3">
        <div className="mb-2 flex h-7 items-center justify-center rounded-lg bg-verd-soft text-[11px] font-semibold uppercase tracking-wider text-verd">
          {project.community ? "Community entrance" : "Rooftop"}
        </div>
        <div className="flex flex-col gap-1.5">
          {floorRows.map((row) => (
            <div key={row} className="flex items-stretch gap-1.5">
              <div className="flex w-9 shrink-0 flex-col items-center justify-center text-[10px] font-semibold uppercase leading-tight text-ink-soft">
                <span>{rowWord(project)}</span>
                <span className="text-[13px] text-ink">{floorOf(project, row)}</span>
              </div>
              <div className="grid flex-1 gap-1.5" style={{ gridTemplateColumns: `repeat(${project.cols}, minmax(0, 1fr))` }}>
                {units
                  .filter((p) => p.gridRow === row)
                  .map((p) => (
                    <UnitCell
                      key={p.id}
                      unit={p}
                      dim={!matches(p)}
                      selected={p.id === selectedUnit}
                      mine={booking?.unit_id === p.id}
                      onClick={() => {
                        selectUnit(p.id);
                        setOpenFor(p.id);
                        // The Property Advisor reads out what the customer just tapped.
                        const line = unitLine(p.id, overrides);
                        if (line) {
                          avatar.interrupt();
                          avatar.speak(line);
                        }
                      }}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-soft">
          <Legend className="border-verd bg-card" label="Available" />
          <Legend className="border-gold bg-gold-soft" label="Held" />
          <Legend className="border-line bg-[repeating-linear-gradient(45deg,var(--line),var(--line)_3px,transparent_3px,transparent_6px)]" label="Sold" />
        </div>
      </div>

      {selected && openFor === selected.id && (
        // Fixed inside the phone frame (the shell is the containing block), so it sits over the dock and composer.
        <div className="fixed inset-0 z-[60] flex items-center" role="dialog" aria-label={`Unit ${selected.unitNo}`}>
          <button className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setOpenFor(null)} aria-label="Close" />
          <Card className="relative mx-4 w-full px-4 py-3.5 shadow-2xl">
            <button
              onClick={() => setOpenFor(null)}
              aria-label="Close"
              className="absolute -top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-card text-ink"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <div className="flex items-start justify-between gap-2 pr-0">
              <div>
                <div className="font-display text-[22px] font-semibold tracking-tight">{selected.unitNo}</div>
                <div className="mt-0.5 flex flex-wrap gap-1.5">
                  <Badge tone={selected.status === "available" ? "verd" : selected.status === "held" ? "gold" : "muted"}>
                    {booking?.unit_id === selected.id ? "Held for you" : selected.status[0].toUpperCase() + selected.status.slice(1)}
                  </Badge>
                  {selected.isCorner && <Badge tone="gold">Corner</Badge>}
                  {selected.isPremiumView && <Badge tone="verd">{selected.view} view</Badge>}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-[20px] font-semibold">{aedShort(selected.price)}</div>
                <div className="text-[11.5px] text-ink-soft">excl. government fees</div>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
              <Row k="Layout" v={selected.layout} />
              <Row k="Size" v={sqft(selected.sizeSqft)} />
              <Row k={rowWord(project)} v={String(selected.floor)} />
              <Row k="View" v={selected.view} />
            </dl>
            <div className="mt-3.5 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => router.push("/money/calculator")}>
                Payment plan
              </Button>
              <Button
                disabled={selected.status !== "available" && booking?.unit_id !== selected.id}
                onClick={() => {
                  // Deterministic: hold the unit here rather than hoping the advisor's reply does.
                  if (booking?.unit_id !== selected.id) {
                    setBooking({
                      booking_id: `BK-${selected.unitNo}-${Date.now().toString(36).toUpperCase().slice(-5)}`,
                      unit_id: selected.id,
                      unit_no: selected.unitNo,
                      project_id: project.id,
                      project_name: project.name,
                      size_sqft: selected.sizeSqft,
                      price: selected.price,
                      token_amount: TOKEN_AMOUNT,
                      status: "initiated",
                    });
                  }
                  router.push("/booking");
                }}
              >
                {booking?.unit_id === selected.id ? "Go to booking" : "Book this unit"}
              </Button>
            </div>
          </Card>
        </div>
      )}
      <p className="mt-3 px-4 pb-4 text-center text-[12.5px] text-ink-soft">Tap a unit to see its details.</p>
    </div>
  );
}

function UnitCell({ unit, dim, selected, mine, onClick }: { unit: Unit; dim: boolean; selected: boolean; mine: boolean; onClick: () => void }) {
  const tone =
    unit.status === "sold"
      ? "border-line text-ink-soft bg-[repeating-linear-gradient(45deg,var(--line),var(--line)_3px,transparent_3px,transparent_7px)]"
      : unit.status === "held"
        ? "border-gold bg-gold-soft text-ink"
        : "border-verd/60 bg-card text-ink";
  return (
    <button
      onClick={onClick}
      className={`flex min-h-[58px] flex-col justify-between rounded-lg border px-1.5 py-1 text-left transition ${tone} ${dim ? "opacity-35" : ""} ${
        selected ? "ring-2 ring-gold ring-offset-1 ring-offset-paper" : ""
      }`}
      aria-label={`${unit.unitNo}, ${unit.layout}, ${unit.status}, ${unit.sizeSqft} square feet, ${aedShort(unit.price)}`}
    >
      <span className="flex items-center justify-between text-[11px] font-bold">
        {unit.unitNo.split("-")[1]}
        {mine && <span className="h-1.5 w-1.5 rounded-full bg-gold" />}
      </span>
      <span className="text-[10px] leading-tight">
        {unit.sizeSqft.toLocaleString("en-US")}
        <br />
        {unit.status === "sold" ? "Sold" : aedShort(unit.price, 1)}
      </span>
    </button>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-3 w-3 rounded border ${className}`} />
      {label}
    </span>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-line/70 pb-1.5">
      <dt className="text-ink-soft">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}
