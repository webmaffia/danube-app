import Image from "next/image";

// The Danube wordmark: red and white on transparent. `onDark` keeps the white "PROPERTIES" for photo/dark hero areas; the default is the charcoal version for light screens. Source: danubeproperties.com.
export function Logo({ className = "w-40", priority = false, onDark = false }: { className?: string; priority?: boolean; onDark?: boolean }) {
  return (
    <Image
      src={onDark ? "/brand/danube-logo.png" : "/brand/danube-logo-dark.png"}
      alt="Danube Properties"
      width={373}
      height={20}
      priority={priority}
      className={`h-auto ${className}`}
    />
  );
}
