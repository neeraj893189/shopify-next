import { cache } from "react";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { shopifyFetch } from "@/lib/shopify/client";
import { COLLECTION_QUERY, PRODUCT_QUERY } from "@/lib/shopify/queries";
import type { Product } from "@/lib/shopify/types";
import { ProductPurchase } from "@/components/ProductPurchase";
import { Breadcrumb, type BreadcrumbItem } from "@/components/Breadcrumb";

type ProductResponse = {
  product: Product | null;
};

type ProductPageProps = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ collection?: string | string[] }>;
};

async function getCollection(handle?: string) {
  if (!handle) return null;
  const { collection } = await shopifyFetch<{
    collection: { handle: string; title: string } | null;
  }>(COLLECTION_QUERY, { handle });
  return collection;
}

const getProduct = cache(async (handle: string) => {
  const { product } = await shopifyFetch<ProductResponse>(PRODUCT_QUERY, { handle });
  if (!product) return null;
  let page = product.variants;
  const variants = [...(page?.nodes ?? [])];
  while (page?.pageInfo?.hasNextPage && page.pageInfo.endCursor) {
    const response = await shopifyFetch<ProductResponse>(PRODUCT_QUERY, { handle, after: page.pageInfo.endCursor });
    page = response.product?.variants;
    if (!page) throw new Error("Unable to load product options.");
    variants.push(...page.nodes);
  }
  return { ...product, variants: { nodes: variants } };
});

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    return { title: "Product not found" };
  }

  const description = product.description || `Shop ${product.title} from our Shopify storefront.`;
  const image = product.featuredImage;

  return {
    title: product.title,
    description,
    openGraph: {
      title: product.title,
      description,
      type: "website",
      ...(image ? { images: [{ url: image.url, alt: image.altText ?? product.title }] } : {}),
    },
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { handle } = await params;
  const { collection: collectionParam } = await searchParams;
  const [product, collection] = await Promise.all([
    getProduct(handle),
    getCollection(typeof collectionParam === "string" ? collectionParam : undefined),
  ]);

  if (!product) {
    notFound();
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    ...(collection
      ? [
          { label: "Collections", href: "/collections" },
          { label: collection.title, href: { pathname: "/products", query: { collection: collection.handle } } },
        ]
      : [{ label: "Products", href: "/products" }]),
    { label: product.title },
  ];

  const images = product.images?.nodes.length
    ? product.images.nodes
    : product.featuredImage
      ? [product.featuredImage]
      : [];
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Breadcrumb items={breadcrumbs} />

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-20">
        <div className="grid grid-cols-2 gap-3">
          {images.map((image, index) => (
            <div key={`${image.url}-${index}`} className={`relative aspect-[4/5] overflow-hidden bg-secondary ${index === 0 ? "col-span-2" : ""}`}>
              <Image
                src={image.url}
                alt={image.altText ?? product.title}
                fill
                priority={index === 0}
                className="object-cover"
                sizes={index === 0 ? "(min-width: 1024px) 55vw, 100vw" : "(min-width: 1024px) 27vw, 50vw"}
              />
            </div>
          ))}
        </div>

        <section className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Shopify collection</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{product.title}</h1>
          <ProductPurchase key={product.id} product={product} />
        </section>
      </div>
    </main>
  );
}
