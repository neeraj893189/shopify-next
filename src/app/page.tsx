
import HeroSlider from "@/components/contentful/homepage/HeroSlider";
import { getHomepage } from "@/lib/contentful/homepage";

export default async function Home() {
  const banner = await getHomepage();

  if (!banner) {
    return <main>Banner not found</main>;
  }

  const heroImages = banner.fields.heroImages ?? [];

  return (
    <main>
      <HeroSlider images={heroImages as any} />
    </main>
  );
}