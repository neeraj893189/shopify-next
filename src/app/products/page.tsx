import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { shopifyFetch } from "@/lib/shopify/client";
import { CATALOG_QUERY, CATALOG_FILTERS_QUERY, COLLECTION_PRODUCTS_QUERY, COLLECTION_FILTERS_QUERY } from "@/lib/shopify/queries";
import type { Product } from "@/lib/shopify/types";
import { ProductGrid } from "@/components/ProductGrid";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductFilters, ProductSort } from "@/components/ProductFilters";
import { parseCatalogParams, catalogQuery, catalogSort, productFilters, getSizeOptions, getTagOptions, getPriceMaximum, type CatalogParams, type StoreFilter } from "@/lib/catalog";
export const metadata: Metadata = { title: "Products", description: "Explore our Shopify catalog." };
type Connection = { nodes: Product[]; totalCount?: number; pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean; startCursor: string | null; endCursor: string | null } };
type FilterResponse = {
  localization: { country: { currency: { isoCode: string } } };
  search?: { productFilters: StoreFilter[] };
  collection?: { title: string; products: { filters: StoreFilter[] } } | null;
};
export default async function ProductsPage({ searchParams }: { searchParams: Promise<CatalogParams> }) {
  const params = await searchParams;
  const state = parseCatalogParams(params);
  const collection = state.collection;
  const filterData = await shopifyFetch<FilterResponse>(collection ? COLLECTION_FILTERS_QUERY : CATALOG_FILTERS_QUERY, collection ? { handle: collection } : {});
  if (collection && !filterData.collection) notFound();
  const title = filterData.collection?.title ?? "Products";
  const availableFilters = filterData.collection?.products.filters ?? filterData.search?.productFilters ?? [];
  const sizes = getSizeOptions(availableFilters, process.env.SHOPIFY_SIZE_OPTION_NAME || "Size");
  const tags = getTagOptions(availableFilters);
  state.tags = state.tags.filter(tag => tags.some(option => option.value === tag));
  state.sizes = state.sizes.filter(size => sizes.some(option => option.value === size));
  const before = typeof params.before === "string" ? params.before : undefined;
  const after = !before && typeof params.after === "string" ? params.after : undefined;
  const variables = { ...(before ? { last: 12, before } : { first: 12, after }), filters: productFilters(state, sizes, tags), ...catalogSort(state, Boolean(collection)) };
  let products: Connection;
  if (collection) {
    const data = await shopifyFetch<{ collection: { products: Connection } | null }>(COLLECTION_PRODUCTS_QUERY, { ...variables, handle: collection });
    if (!data.collection) notFound();
    products = data.collection.products;
  } else {
    products = (await shopifyFetch<{ search: Connection }>(CATALOG_QUERY, variables)).search;
  }
  const query = catalogQuery(state);
  const clearQuery = catalogQuery({ ...state, sizes: [], tags: [], availability: "all", min: undefined, max: undefined });
  function href(direction: "after" | "before", cursor: string) {
    const next = new URLSearchParams(query); next.set(direction, cursor); return `/products?${next}`;
  }
  const chips = [
    ...state.tags.map(tag => ({ label: `Tag: ${tags.find(option => option.value === tag)?.label ?? tag}`, key: "tag", value: tag })),
    ...state.sizes.map(size => ({ label: `Size: ${size}`, key: "size", value: size })),
    ...(state.availability !== "all" ? [{ label: state.availability === "in-stock" ? "In stock" : "Sold out", key: "availability", value: state.availability }] : []),
    ...(state.min !== undefined ? [{ label: `Min: ${state.min} ${filterData.localization.country.currency.isoCode}`, key: "min", value: String(state.min) }] : []),
    ...(state.max !== undefined ? [{ label: `Max: ${state.max} ${filterData.localization.country.currency.isoCode}`, key: "max", value: String(state.max) }] : []),
  ];
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
    <Breadcrumb className="mb-6" items={collection
      ? [{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label: title }]
      : [{ label: "Home", href: "/" }, { label: "Products" }]} />
    <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
    <div className="mt-8 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
      <ProductFilters key={query.toString()} state={state} sizes={sizes} tags={tags} priceMaximum={getPriceMaximum(availableFilters)} currency={filterData.localization.country.currency.isoCode} />
      <section aria-label="Product results" className="min-w-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p role="status" className="text-sm text-muted-foreground">{products.totalCount !== undefined ? `${products.totalCount} products found` : `${products.nodes.length} products on this page`}</p>
          <ProductSort key={query.toString()} state={state} />
        </div>
        {chips.length ? <div className="mb-6 flex flex-wrap gap-2" aria-label="Active filters">{chips.map(chip => {
          const next = new URLSearchParams(query); next.delete(chip.key, chip.value);
          return <Link key={`${chip.key}-${chip.value}`} href={`/products?${next}`} aria-label={`Remove ${chip.label} filter`} className="button-secondary rounded-full border border-border px-3 py-1.5 text-xs">{chip.label} <span aria-hidden="true">×</span></Link>;
        })}</div> : null}
        {products.nodes.length ? <ProductGrid products={products.nodes} collectionHandle={collection} withSidebar /> : <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center">
          <h2 className="text-xl font-medium">No products match these filters</h2><p className="mt-2 text-sm text-muted-foreground">Try different tags, another size, or a wider price range.</p>
          <Link href={`/products?${clearQuery}`} className="button-primary mt-6 inline-block rounded-xl px-5 py-3 text-sm">Clear filters</Link>
        </div>}
        <nav aria-label="Products pagination" className="mt-10 flex justify-between border-t border-border pt-6">
          {products.pageInfo.hasPreviousPage && products.pageInfo.startCursor ? <Link className="theme-link" href={href("before", products.pageInfo.startCursor)}>Previous</Link> : <span />}
          {products.pageInfo.hasNextPage && products.pageInfo.endCursor ? <Link className="theme-link" href={href("after", products.pageInfo.endCursor)}>Next</Link> : null}
        </nav>
      </section>
    </div>
  </main>;
}
