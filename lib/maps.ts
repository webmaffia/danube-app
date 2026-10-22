// Google Maps for each project's area. Exact site pins aren't in the project
// data, so the embed searches the neighbourhood; swap in a pinned embed URL per
// project once Danube supplies the site coordinates.

import { PROJECTS } from "@/lib/inventory";

export interface SiteMap {
  embed: string;
  link: string;
}

export const SITE_MAPS: Record<string, SiteMap> = Object.fromEntries(
  PROJECTS.map((p) => [
    p.id,
    {
      embed: `https://www.google.com/maps?q=${encodeURIComponent(p.location)}&output=embed`,
      link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.location)}`,
    },
  ]),
);

/** Pending "scroll to this section" request, consumed by the screen once it's on show. */
let pendingSection: string | null = null;

export function requestScroll(id: string) {
  pendingSection = id;
}

/** Scrolls to the pending section if its element is on the page. Returns whether it did. */
export function flushScroll(): boolean {
  if (!pendingSection) return false;
  const el = document.getElementById(pendingSection);
  if (!el) return false;
  pendingSection = null;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}
