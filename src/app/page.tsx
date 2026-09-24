import type { Metadata } from "next";
import { HomeSections } from "@/components/HomeSections";
import { getHomeContent } from "@/lib/contentful";

export async function generateMetadata(): Promise<Metadata> {
  const home = await getHomeContent();
  return { title: home.title, description: home.description, openGraph: { title: home.title, description: home.description, type: "website" } };
}

export default async function Home() {
  const home = await getHomeContent();
  return <HomeSections sections={home.sections} />;
}
