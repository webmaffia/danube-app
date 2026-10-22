import Image from "next/image";

// The Danube wordmark: red and white on transparent, for the app's dark navy
// brand background. Source: danubeproperties.com.
export function Logo({ className = "w-40", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/danube-logo.png"
      alt="Danube Properties"
      width={373}
      height={20}
      priority={priority}
      className={`h-auto ${className}`}
    />
  );
}
