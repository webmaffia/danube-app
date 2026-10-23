import Image from "next/image";
import data from "@/lib/project-gallery.json";

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
            <Image src={img.src} alt={img.alt || `${projectName} gallery ${i + 1}`} fill sizes="350px" className="object-cover" />
          </li>
        ))}
      </ul>
    </section>
  );
}
