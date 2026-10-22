"use client";

// Landing-page photo slider: Danube project photos cross-fading every few
// seconds, each one filling the whole screen behind the headline.

import Image from "next/image";
import { useEffect, useState } from "react";

export interface Slide {
  src: string;
  name: string;
  /** CSS object-position, to keep the building in frame when the image is cropped. */
  position?: string;
}

export function HeroSlider({ slides, interval = 4500 }: { slides: Slide[]; interval?: number }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), interval);
    return () => clearInterval(t);
  }, [slides.length, interval]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {slides.map((s, n) => (
        <Image
          key={s.src}
          src={s.src}
          alt={s.name}
          fill
          sizes="100vw"
          quality={90}
          priority={n === 0}
          style={{ objectPosition: s.position }}
          className={`object-cover transition-opacity duration-1000 ${n === i ? "opacity-100" : "opacity-0"}`}
        />
      ))}
    </div>
  );
}
