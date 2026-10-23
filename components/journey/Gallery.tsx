import Image from "next/image";
import data from "@/lib/project-gallery.json";
import amenityData from "@/lib/project-amenities.json";

const GALLERIES = data as Record<string, { src: string; alt: string }[]>;

/** Image gallery from the project's page on danubeproperties.com, as a swipeable strip. */
export function Gallery({ projectId, projectName }: { projectId: string; projectName: string }) {
  const images = GALLERIES[projectId];
  if (!images?.length) return null;
  return (
    <section className="pt-5">
      <p className="px-4 text-center text-[10.5px] font-semibold uppercase tracking-[0.24em] text-ink-soft">Media</p>
      <h2 className="mb-3 px-4 text-center font-display text-[26px] uppercase leading-tight tracking-[0.12em] text-gold">Image gallery</h2>
      <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {images.map((img, i) => (
          <li key={img.src} className="relative aspect-[4/3] w-[82%] shrink-0 snap-center overflow-hidden rounded-2xl bg-card">
            <Image src={img.src} alt={img.alt || `${projectName} gallery ${i + 1}`} fill sizes="100vw" quality={90} className="object-cover" />
          </li>
        ))}
      </ul>
    </section>
  );
}

const AMENITIES = amenityData as Record<string, { src: string; title: string; text: string }[]>;

/** Featured amenities from the project's page, each a photo with its name and a line of copy. */
export function AmenityShowcase({ projectId, projectName }: { projectId: string; projectName: string }) {
  const items = AMENITIES[projectId];
  if (!items?.length) return null;
  return (
    <section className="pt-5">
      <h2 className="mb-3 px-4 text-center font-display text-[26px] uppercase leading-tight tracking-[0.12em] text-gold">Amenities</h2>
      <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((a) => (
          <li key={a.src} className="relative aspect-[4/5] w-[78%] shrink-0 snap-center overflow-hidden rounded-xl bg-card">
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
