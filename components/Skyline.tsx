// Abstract tower outlines, the motif used behind hero areas and as a stand-in
// when a project has no photography yet.

const TOWERS = [
  { x: 20, w: 46, h: 150 },
  { x: 74, w: 36, h: 210 },
  { x: 118, w: 52, h: 120 },
  { x: 178, w: 40, h: 260 },
  { x: 226, w: 48, h: 180 },
  { x: 282, w: 36, h: 230 },
  { x: 326, w: 52, h: 140 },
];

export function Skyline({ className = "", stroke = "currentColor", opacity = 0.18 }: { className?: string; stroke?: string; opacity?: number }) {
  return (
    <svg className={className} viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g fill="none" stroke={stroke} strokeWidth="1" opacity={opacity}>
        {TOWERS.map((t) => (
          <g key={t.x}>
            <rect x={t.x} y={300 - t.h} width={t.w} height={t.h} />
            {Array.from({ length: Math.floor(t.h / 22) }, (_, i) => (
              <path key={i} d={`M ${t.x} ${300 - t.h + 14 + i * 22} H ${t.x + t.w}`} />
            ))}
          </g>
        ))}
        <path d="M 0 299 H 400" />
      </g>
    </svg>
  );
}

/** A small building-facade glyph: four units across, three floors, one unit highlighted. */
export function UnitGrid({ className = "" }: { className?: string }) {
  const cells = Array.from({ length: 12 }, (_, i) => i);
  return (
    <svg className={className} viewBox="0 0 120 92" aria-hidden="true">
      {cells.map((i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = 4 + col * 29;
        const y = 4 + row * 30;
        const hot = i === 5;
        const sold = i === 2 || i === 7 || i === 9;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width="25"
            height="26"
            rx="2"
            fill={hot ? "var(--gold)" : sold ? "currentColor" : "none"}
            fillOpacity={hot ? 0.9 : sold ? 0.18 : 0}
            stroke="currentColor"
            strokeOpacity="0.55"
          />
        );
      })}
    </svg>
  );
}
