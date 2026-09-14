import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse curated collections from our Shopify storefront.",
  openGraph: {
    title: "Collections | Shopify Storefront",
    description: "Browse curated collections from our Shopify storefront.",
    type: "website",
  },
};

export default function CollectionsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Collections</h1>
      <p className="mt-4 text-zinc-600">Collections will appear here from Shopify.</p>
    </main>
  );
}