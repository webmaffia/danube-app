import { JourneyShell } from "@/components/journey/Shell";

// The desktop journey: same shell and screens as the phone version, laid out
// with the advisor as a side panel (the shell switches on the /desktop path).
export default function DesktopJourneyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <JourneyShell>{children}</JourneyShell>;
}
