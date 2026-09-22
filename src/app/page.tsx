import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thoughtfully selected goods",
  description: "Browse simple, thoughtfully selected goods from our Shopify storefront.",
  openGraph: {
    title: "Thoughtfully selected goods",
    description: "Browse simple, thoughtfully selected goods from our Shopify storefront.",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl flex-col justify-center px-6 py-20">
      <p className="mb-4 text-sm uppercase tracking-[0.2em] text-primary">Shopify storefront</p>
      <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-7xl">Simple goods, thoughtfully selected.</h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">Browse the latest products and collections from our Shopify catalog.</p>
      <Link href="/products" className="mt-10 w-fit button-primary px-6 py-3 text-sm font-medium">Shop products</Link>
    </main>
  );
}