import Link from "next/link";
import type { Metadata } from "next";
import { shopifyFetch } from "@/lib/shopify/client";
import { PRODUCTS_QUERY } from "@/lib/shopify/queries";
import type { Product } from "@/lib/shopify/types";
import { ProductGrid } from "@/components/ProductGrid";

const PRODUCTS_PER_PAGE = 8;
const SHOPIFY_BATCH_SIZE = 250;

export const metadata: Metadata = {
  title: "Products",
  description: "Explore the latest products available from our Shopify storefront.",
  openGraph: {
    title: "Products | Shopify Storefront",
    description: "Explore the latest products available from our Shopify storefront.",
    type: "website",
  },
};

type ProductsResponse = {
  products: {
    nodes: Product[];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
  };
};

type ProductsPageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

function getVisiblePages(totalPages: number, currentPage: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const firstPage = Math.min(
    Math.max(currentPage - 2, 1),
    totalPages - 4,
  );

  return Array.from({ length: 5 }, (_, index) => firstPage + index);
}

async function getAllProducts() {
  const allProducts: Product[] = [];
  let after: string | null = null;

  while (true) {
    const response: ProductsResponse = await shopifyFetch<ProductsResponse>(PRODUCTS_QUERY, {
      first: SHOPIFY_BATCH_SIZE,
      after,
      last: null,
      before: null,
    });
    const { products } = response;

    allProducts.push(...products.nodes);

    if (!products.pageInfo.hasNextPage || !products.pageInfo.endCursor) {
      return allProducts;
    }

    after = products.pageInfo.endCursor;
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { page: pageParam } = await searchParams;
  const parsedPage = Number.parseInt(pageParam ?? "1", 10);
  const allProducts = await getAllProducts();
  const totalPages = Math.max(1, Math.ceil(allProducts.length / PRODUCTS_PER_PAGE));
  const page = Number.isNaN(parsedPage)
    ? 1
    : Math.min(Math.max(parsedPage, 1), totalPages);
  const visiblePages = getVisiblePages(totalPages, page);
  const pageStart = (page - 1) * PRODUCTS_PER_PAGE;
  const pageProducts = allProducts.slice(pageStart, pageStart + PRODUCTS_PER_PAGE);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Products</h1>
      <div className="mt-10">
        <ProductGrid products={pageProducts} />
      </div>
      <nav aria-label="Products pagination" className="mt-12 flex items-center justify-between border-t border-zinc-200 pt-6">
        {page > 1 ? (
          <Link href={`/products?page=${page - 1}`} className="text-sm font-medium hover:underline">Previous</Link>
        ) : <span />}
        <div className="flex items-center gap-2" aria-label="Page numbers">
          {visiblePages.map((pageNumber) => (
            <Link
              key={pageNumber}
              href={`/products?page=${pageNumber}`}
              aria-current={pageNumber === page ? "page" : undefined}
              className={`flex size-9 items-center justify-center text-sm font-medium ${pageNumber === page ? "bg-zinc-950 text-white" : "border border-zinc-200 hover:border-zinc-950"}`}
            >
              {pageNumber}
            </Link>
          ))}
        </div>
        {page < totalPages ? (
          <Link href={`/products?page=${page + 1}`} className="text-sm font-medium hover:underline">Next</Link>
        ) : <span />}
      </nav>
    </main>
  );
}