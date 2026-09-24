import Image from "next/image";
import Link from "next/link";
import type { HomeSection } from "@/lib/contentful";

export function HomeSections({ sections }: { sections: HomeSection[] }) {
  return <main className="mx-auto max-w-7xl space-y-8 px-6 py-10 sm:py-16">
    {sections.map((section, index) => {
      const Heading = index === 0 ? "h1" : "h2";
      const withImage = Boolean(section.image && ["hero", "imageText"].includes(section.kind));
      return <section key={`${section.id}-${index}`} className={`overflow-hidden rounded-3xl ${section.kind === "banner" ? "bg-secondary p-8 text-center sm:p-16" : withImage ? "grid items-center gap-8 bg-surface p-6 sm:p-10 lg:grid-cols-2" : "py-12 sm:py-20"}`}>
        <div className={`${section.kind === "banner" ? "mx-auto" : ""} max-w-3xl ${withImage && !section.imageRight ? "lg:order-2" : ""}`}>
          {section.eyebrow ? <p className="mb-4 text-sm uppercase tracking-[0.2em] text-primary">{section.eyebrow}</p> : null}
          <Heading className={`${section.kind === "hero" ? "text-5xl sm:text-7xl" : "text-3xl sm:text-5xl"} font-semibold tracking-tight`}>{section.heading}</Heading>
          {section.body ? <p className="mt-6 whitespace-pre-line text-lg leading-8 text-muted-foreground">{section.body}</p> : null}
          {section.buttonLabel && section.buttonUrl ? <Link href={section.buttonUrl} className="button-primary mt-8 inline-block rounded-xl px-6 py-3 text-sm font-medium">{section.buttonLabel}</Link> : null}
        </div>
        {withImage && section.image ? <div className="relative aspect-[4/3] overflow-hidden rounded-2xl"><Image src={section.image.url} alt={section.image.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" /></div> : null}
      </section>;
    })}
  </main>;
}
