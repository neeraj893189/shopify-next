import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { shopifyFetch } from "@/lib/shopify/client";
import { PRODUCTS_QUERY, COLLECTION_PRODUCTS_QUERY } from "@/lib/shopify/queries";
import type { Product } from "@/lib/shopify/types";
import { ProductGrid } from "@/components/ProductGrid";
import { Breadcrumb } from "@/components/Breadcrumb";
export const metadata: Metadata = { title: "Products", description: "Explore our Shopify catalog." };
type Connection = { nodes: Product[]; pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean; startCursor: string | null; endCursor: string | null } };
type Params = { after?: string; before?: string; collection?: string };
export default async function ProductsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const before = typeof params.before === "string" ? params.before : undefined;
  const after = !before && typeof params.after === "string" ? params.after : undefined;
  const collection = typeof params.collection === "string" ? params.collection : undefined;
  const variables = before ? { last: 8, before } : { first: 8, after };
  let products: Connection;
  let title = "Products";
  if (collection) {
    const data = await shopifyFetch<{ collection: { title: string; products: Connection } | null }>(COLLECTION_PRODUCTS_QUERY, { ...variables, handle: collection });
    if (!data.collection) notFound();
    products = data.collection.products;
    title = data.collection.title;
  } else {
    products = (await shopifyFetch<{ products: Connection }>(PRODUCTS_QUERY, variables)).products;
  }
  function href(direction: "after" | "before", cursor: string) {
    const query = new URLSearchParams({ [direction]: cursor });
    if (collection) query.set("collection", collection);
    return `/products?${query}`;
  }
  return <main className="mx-auto max-w-6xl px-6 py-16">
    <Breadcrumb className="mb-6" items={collection
      ? [{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label: title }]
      : [{ label: "Home", href: "/" }, { label: "Products" }]} />
    <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
    <div className="mt-10"><ProductGrid products={products.nodes} collectionHandle={collection} /></div>
    <nav aria-label="Products pagination" className="mt-12 flex justify-between border-t border-border pt-6">
      {products.pageInfo.hasPreviousPage && products.pageInfo.startCursor ? <Link className="theme-link" href={href("before", products.pageInfo.startCursor)}>Previous</Link> : <span />}
      {products.pageInfo.hasNextPage && products.pageInfo.endCursor ? <Link className="theme-link" href={href("after", products.pageInfo.endCursor)}>Next</Link> : null}
    </nav>
  </main>;
}
