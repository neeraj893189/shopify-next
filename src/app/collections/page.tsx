import Link from "next/link";
import type { Metadata } from "next";
import { shopifyFetch } from "@/lib/shopify/client";
import { COLLECTIONS_QUERY } from "@/lib/shopify/queries";
import { Breadcrumb } from "@/components/Breadcrumb";
export const metadata: Metadata = { title: "Collections", description: "Browse our Shopify collections." };
type Collections = { collections: {
  nodes: Array<{ id: string; handle: string; title: string; description: string }>;
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
} };
export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ after?: string }> }) {
  const params = await searchParams;
  const { collections } = await shopifyFetch<Collections>(COLLECTIONS_QUERY, { after: typeof params.after === "string" ? params.after : undefined });
  return <main className="mx-auto max-w-6xl px-6 py-16">
    <Breadcrumb className="mb-6" items={[{ label: "Home", href: "/" }, { label: "Collections" }]} />
    <h1 className="text-4xl font-semibold tracking-tight">Collections</h1>
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {collections.nodes.map(collection => <Link key={collection.id} href={`/products?collection=${encodeURIComponent(collection.handle)}`} className="border border-border bg-surface p-6 hover:border-primary">
        <h2 className="text-xl font-medium text-primary">{collection.title}</h2>
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{collection.description}</p>
      </Link>)}
    </div>
    {!collections.nodes.length ? <p className="mt-6">No collections found.</p> : null}
    <nav aria-label="Collections pagination" className="mt-10 flex justify-between">
      {params.after ? <Link className="theme-link" href="/collections">First page</Link> : <span />}
      {collections.pageInfo.hasNextPage && collections.pageInfo.endCursor ? <Link className="theme-link" href={`/collections?after=${encodeURIComponent(collections.pageInfo.endCursor)}`}>Next</Link> : null}
    </nav>
  </main>;
}
