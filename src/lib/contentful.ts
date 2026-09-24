import { cache } from "react";

type Entry = { sys: { id: string }; fields: Record<string, unknown> };
type Response = { items?: Entry[]; includes?: { Entry?: Entry[]; Asset?: Entry[] } };
export type HomeSection = {
  id: string; kind: "hero" | "imageText" | "text" | "banner";
  heading: string; eyebrow?: string; body?: string; buttonLabel?: string; buttonUrl?: string;
  image?: { url: string; alt: string }; imageRight: boolean;
};
export type HomeContent = { title: string; description: string; sections: HomeSection[] };
const string = (value: unknown) => typeof value === "string" ? value : "";
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const linkId = (value: unknown) => string(object(object(value).sys).id);
export function safeContentLink(value: unknown): string | undefined {
  const url = string(value).trim();
  if (!url || /[\\\s\u0000-\u001f]/.test(url)) return undefined;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try { const parsed = new URL(url); if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.href; } catch {}
  return undefined;
}
export const FALLBACK_HOME: HomeContent = {
  title: "Thoughtfully selected goods",
  description: "Browse simple, thoughtfully selected goods from our Shopify storefront.",
  sections: [{ id: "default", kind: "hero", eyebrow: "Shopify storefront", heading: "Simple goods, thoughtfully selected.", body: "Browse the latest products and collections from our Shopify catalog.", buttonLabel: "Shop products", buttonUrl: "/products", imageRight: true }],
};
export function parseHomeContent(data: Response): HomeContent | null {
  const page = data.items?.[0];
  if (!page || !Array.isArray(page.fields.sections)) return null;
  const entries = new Map((data.includes?.Entry ?? []).map(entry => [entry.sys.id, entry]));
  const assets = new Map((data.includes?.Asset ?? []).map(entry => [entry.sys.id, entry]));
  const sections: HomeSection[] = [];
  for (const reference of page.fields.sections) {
    const entry = entries.get(linkId(reference));
    if (!entry || entry.fields.enabled === false) continue;
    const fields = entry.fields;
    const kind = string(fields.kind);
    const heading = string(fields.heading);
    if (!["hero", "imageText", "text", "banner"].includes(kind) || !heading) continue;
    const asset = assets.get(linkId(fields.image));
    const file = object(asset?.fields.file);
    const rawUrl = string(file.url);
    const url = safeContentLink(rawUrl.startsWith("//") ? `https:${rawUrl}` : rawUrl);
    const imageUrl = url ? new URL(url, "https://invalid.local") : undefined;
    const image = imageUrl?.protocol === "https:" && imageUrl.hostname === "images.ctfassets.net" && string(file.contentType).startsWith("image/")
      ? { url: imageUrl.href, alt: string(fields.imageAlt) || string(asset?.fields.description) || heading } : undefined;
    sections.push({ id: entry.sys.id, kind: kind as HomeSection["kind"], heading,
      eyebrow: string(fields.eyebrow), body: string(fields.body), buttonLabel: string(fields.buttonLabel),
      buttonUrl: safeContentLink(fields.buttonUrl), image, imageRight: fields.imageRight !== false });
  }
  if (!sections.length) return null;
  return { title: string(page.fields.seoTitle) || FALLBACK_HOME.title, description: string(page.fields.seoDescription) || FALLBACK_HOME.description, sections };
}
export const getHomeContent = cache(async (): Promise<HomeContent> => {
  const space = process.env.CONTENTFUL_SPACE_ID;
  const token = process.env.CONTENTFUL_DELIVERY_ACCESS_TOKEN;
  if (!space || !token) return FALLBACK_HOME;
  const environment = process.env.CONTENTFUL_ENVIRONMENT || "master";
  const url = new URL(`https://cdn.contentful.com/spaces/${encodeURIComponent(space)}/environments/${encodeURIComponent(environment)}/entries`);
  url.search = new URLSearchParams({ content_type: "homePage", "fields.slug": "home", include: "2", limit: "1", locale: process.env.CONTENTFUL_LOCALE || "en-US" }).toString();
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Contentful status ${response.status}`);
    const home = parseHomeContent(await response.json());
    if (!home) console.warn("Contentful homepage has no published, supported sections; using fallback.");
    return home ?? FALLBACK_HOME;
  } catch {
    console.warn("Contentful homepage unavailable; using fallback. Check configuration and published entries.");
    return FALLBACK_HOME;
  }
});
