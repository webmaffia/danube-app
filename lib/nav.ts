"use client";

// The app runs twice over the same screens: the phone version at the root and
// the desktop version under /desktop. Screens navigate with root-relative
// routes ("/units"); these helpers add the /desktop prefix when needed, so a
// screen never has to know which version it is in.

import Link from "next/link";
import { createElement, useMemo, type ComponentProps } from "react";
import { usePathname, useRouter } from "next/navigation";

export const DESKTOP_BASE = "/desktop";

export function isDesktopPath(pathname: string): boolean {
  return pathname === DESKTOP_BASE || pathname.startsWith(`${DESKTOP_BASE}/`);
}

/** "/desktop/units/gemz" becomes "/units/gemz"; "/desktop" becomes "/". */
export function stripBase(pathname: string): string {
  if (!isDesktopPath(pathname)) return pathname;
  return pathname.slice(DESKTOP_BASE.length) || "/";
}

export function withBase(href: string, desktop: boolean): string {
  if (!desktop || !href.startsWith("/") || isDesktopPath(href)) return href;
  return href === "/" ? DESKTOP_BASE : `${DESKTOP_BASE}${href}`;
}

/** The root-relative path of the current screen, in either version. */
export function useAppPath(): string {
  return stripBase(usePathname());
}

export function useIsDesktop(): boolean {
  return isDesktopPath(usePathname());
}

/** next/navigation's router, taking root-relative routes in either version. */
export function useAppRouter() {
  const router = useRouter();
  const desktop = useIsDesktop();
  // Stable between renders: effects list the router as a dependency.
  return useMemo(
    () => ({
      ...router,
      push: (href: string) => router.push(withBase(href, desktop)),
      replace: (href: string) => router.replace(withBase(href, desktop)),
    }),
    [router, desktop],
  );
}

/** next/link, taking root-relative routes in either version. */
export function AppLink({ href, ...rest }: ComponentProps<typeof Link>) {
  const desktop = useIsDesktop();
  return createElement(Link, { ...rest, href: typeof href === "string" ? withBase(href, desktop) : href });
}
