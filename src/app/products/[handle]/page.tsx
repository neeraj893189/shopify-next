import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { shopifyFetch } from "@/lib/shopify/client";
import { COLLECTION_QUERY } from "@/lib/shopify/queries";
import { getProduct } from "@/lib/shopify/product";
import { ProductPurchase } from "@/components/ProductPurchase";
import { Breadcrumb, type BreadcrumbItem } from "@/components/Breadcrumb";
import { ProductGallery } from "@/components/ProductGallery";
import { RecentlyViewedProducts } from "@/components/RecentlyViewedProducts";

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
        <ProductGallery images={images} title={product.title} />

        <section className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Shopify collection</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{product.title}</h1>
          <ProductPurchase key={product.id} product={product} />
        </section>
      </div>

      <RecentlyViewedProducts product={product} />
    </main>
  );
}
