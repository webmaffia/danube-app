"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useIsDesktop } from "@/lib/nav";
import data from "@/lib/project-gallery.json";
import amenityData from "@/lib/project-amenities.json";

const GALLERIES = data as Record<string, { src: string; alt: string }[]>;

/** Image gallery from the project's page on danubeproperties.com: a swipeable strip on a phone, a slider with thumbnails on desktop. */
export function Gallery({ projectId, projectName }: { projectId: string; projectName: string }) {
  const desktop = useIsDesktop();
  const images = GALLERIES[projectId];
  if (!images?.length) return null;
  return (
    <section className="pt-5 desk:pt-14">
      <p className="px-4 text-center text-[10.5px] font-semibold uppercase tracking-[0.24em] text-ink-soft desk:px-0 desk:text-left">Media</p>
      <h2 className="mb-3 px-4 text-center font-display text-[26px] uppercase leading-tight tracking-[0.12em] text-gold desk:mb-6 desk:px-0 desk:text-left">Image gallery</h2>
      {desktop ? (
        <GallerySlider key={projectId} images={images} projectName={projectName} />
      ) : (
        <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <li key={img.src} className="relative aspect-[4/3] w-[82%] shrink-0 snap-center overflow-hidden rounded-2xl bg-card">
              <Image src={img.src} alt={img.alt || `${projectName} gallery ${i + 1}`} fill sizes="100vw" quality={90} className="object-cover" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Desktop: the active image large, every image as a thumbnail underneath. */
function GallerySlider({ images, projectName }: { images: { src: string; alt: string }[]; projectName: string }) {
  const [active, setActive] = useState(0);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const last = images.length - 1;
  const go = (i: number) => setActive(i < 0 ? last : i > last ? 0 : i);

  // Keep the active thumbnail in view in the strip (never scrolls the page itself).
  useEffect(() => {
    thumbs.current[active]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  const arrow = "absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-black/50 text-white backdrop-blur transition hover:bg-black/75";

  return (
    <div
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label={`${projectName} image gallery`}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(active - 1);
        if (e.key === "ArrowRight") go(active + 1);
      }}
      className="outline-none"
    >
      {/* Most of the site's gallery photos are only 673px wide, so each is shown whole (never cropped or stretched to fill)
          over a soft blur of itself, which keeps it as sharp as the file allows. */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active].src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
        {images.map((img, i) => (
          <Image
            key={img.src}
            src={img.src}
            alt={img.alt || `${projectName} gallery ${i + 1}`}
            fill
            sizes="(min-width: 1024px) 70vw, 100vw"
            quality={90}
            priority={i === 0}
            className={`object-contain transition-opacity duration-500 ${i === active ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <button onClick={() => go(active - 1)} aria-label="Previous image" className={`${arrow} left-4`}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button onClick={() => go(active + 1)} aria-label="Next image" className={`${arrow} right-4`}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <span className="absolute bottom-4 right-4 bg-black/55 px-3 py-1.5 text-[13px] font-semibold text-white backdrop-blur">
          {active + 1} / {images.length}
        </span>
      </div>

      <ul className="mt-3 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]" aria-label="Thumbnails">
        {images.map((img, i) => (
          <li key={img.src} className="shrink-0">
            <button
              ref={(el) => {
                thumbs.current[i] = el;
              }}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={`relative block aspect-[4/3] w-36 overflow-hidden bg-card transition ${
                i === active ? "opacity-100 ring-2 ring-gold ring-offset-2 ring-offset-paper" : "opacity-55 hover:opacity-100"
              }`}
            >
              <Image src={img.src} alt="" fill sizes="144px" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const AMENITIES = amenityData as Record<string, { src: string; title: string; text: string }[]>;

/** Featured amenities from the project's page, each a photo with its name and a line of copy. */
export function AmenityShowcase({ projectId, projectName }: { projectId: string; projectName: string }) {
  const items = AMENITIES[projectId];
  if (!items?.length) return null;
  return (
    <section className="pt-5 desk:pt-14">
      <h2 className="mb-3 px-4 text-center font-display text-[26px] uppercase leading-tight tracking-[0.12em] text-gold desk:mb-6 desk:px-0 desk:text-left">Amenities</h2>
      <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden desk:grid desk:grid-cols-3 desk:gap-4 desk:overflow-visible desk:px-0">
        {items.map((a) => (
          <li key={a.src} className="relative aspect-[4/5] w-[78%] shrink-0 snap-center overflow-hidden rounded-xl bg-card desk:w-auto">
            <Image src={a.src} alt={`${projectName} ${a.title}`} fill sizes="100vw" quality={90} className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-3.5 pb-3.5 pt-12 text-white">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em]">{a.title}</h3>
              <p className="mt-1 text-[12.5px] leading-snug text-white/85">{a.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
