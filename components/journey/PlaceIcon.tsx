// Thin line icon for a nearby place, picked from keywords in its name.

type Kind = "metro" | "road" | "airport" | "shopping" | "water" | "ship" | "landmark" | "business" | "park" | "pin";

function kindOf(label: string): Kind {
  const l = label.toLowerCase();
  if (/airport/.test(l)) return "airport";
  if (/cruise|boat|port |marina|ferry/.test(l)) return "ship";
  if (/metro|station|tram|railway/.test(l)) return "metro";
  if (/\broad\b|highway|street|\be\d{2,3}\b/.test(l)) return "road";
  if (/mall|walk|souk|market|village/.test(l)) return "shopping";
  if (/beach|canal|creek|lagoon|waterfront/.test(l)) return "water";
  if (/safari|park|garden|golf|zoo/.test(l)) return "park";
  if (/trade cent|business|office|tech|it park/.test(l)) return "business";
  if (/burj|museum|tower|opera|expo|frame|palm|fountain/.test(l)) return "landmark";
  return "pin";
}

const PATHS: Record<Kind, React.ReactNode> = {
  metro: (
    <>
      <rect x="7" y="3" width="18" height="21" rx="3" />
      <rect x="10" y="7" width="12" height="7" rx="1" />
      <path d="M10 19h2M20 19h2M11 24l-3 5M21 24l3 5M9 29h14" />
    </>
  ),
  road: (
    <>
      <path d="M11 3L7 29M21 3l4 26" />
      <path d="M16 5v4M16 12v4M16 19v4M16 26v2" />
    </>
  ),
  airport: (
    <>
      <path d="M14.500 16.500L4 13l1.500-2.500 11 1L22 5c1-1.200 3.500-1.400 4-.8.500.6.300 3-.8 4L19.500 15l1 11-2.500 1.500-3.500-10.500L9 20l-.5 3.500-2 .5-.5-5z" />
      <path d="M5 29h22" />
    </>
  ),
  shopping: (
    <>
      <path d="M6 10h20l-1.500 18h-17L6 10z" />
      <path d="M11 10V8a5 5 0 0110 0v2" />
    </>
  ),
  water: (
    <path d="M3 10c3 0 3-2 6.500-2s3.500 2 6.500 2 3-2 6.500-2 3.500 2 6.500 2M3 17c3 0 3-2 6.500-2s3.500 2 6.500 2 3-2 6.500-2 3.500 2 6.500 2M3 24c3 0 3-2 6.500-2s3.500 2 6.500 2 3-2 6.500-2 3.500 2 6.500 2" />
  ),
  ship: (
    <>
      <path d="M3 22l3 5h20l3-5-13-4-13 4z" />
      <path d="M16 18V4l8 10h-8M11 14h5" />
    </>
  ),
  landmark: (
    <>
      <path d="M16 2v7M13 9h6l1.500 18h-9L13 9z" />
      <path d="M8 29h16M13.500 17h5" />
    </>
  ),
  business: (
    <>
      <rect x="6" y="4" width="13" height="25" />
      <path d="M19 12h7v17h-7M9.500 8h2M13.500 8h2M9.500 12h2M13.500 12h2M9.500 16h2M13.500 16h2M9.500 20h2M13.500 20h2M22 16h1M22 20h1M22 24h1" />
    </>
  ),
  park: (
    <>
      <path d="M16 29v-9" />
      <path d="M16 20c-6 0-9-4.500-7.500-9 1.800-4.500 4.500-7.500 7.500-10 3 2.500 5.700 5.500 7.500 10 1.500 4.500-1.500 9-7.500 9z" />
    </>
  ),
  pin: (
    <>
      <path d="M16 29s9-8 9-15a9 9 0 00-18 0c0 7 9 15 9 15z" />
      <circle cx="16" cy="14" r="3.500" />
    </>
  ),
};

export function PlaceIcon({ label, className = "h-10 w-10" }: { label: string; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[kindOf(label)]}
    </svg>
  );
}
