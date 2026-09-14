import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { shopifyFetch } from "@/lib/shopify/client";
import { PRODUCT_QUERY } from "@/lib/shopify/queries";
import type { Product } from "@/lib/shopify/types";

type ProductResponse = {
  product: Product | null;
};

type ProductPageProps = {
  params: Promise<{ handle: string }>;
};

async function getProduct(handle: string) {
  const { product } = await shopifyFetch<ProductResponse>(PRODUCT_QUERY, { handle });
  return product;
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

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    notFound();
  }

  const images = product.images?.nodes.length
    ? product.images.nodes
    : product.featuredImage
      ? [product.featuredImage]
      : [];
  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.priceRange.minVariantPrice.currencyCode,
  }).format(Number(product.priceRange.minVariantPrice.amount));
  const hasAvailableVariant = product.variants?.nodes.some((variant) => variant.availableForSale) ?? true;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Link href="/products" className="text-sm text-zinc-500 transition-colors hover:text-zinc-950">
        ← Back to products
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-20">
        <div className="grid grid-cols-2 gap-3">
          {images.map((image, index) => (
            <div key={`${image.url}-${index}`} className={`relative aspect-[4/5] overflow-hidden bg-zinc-100 ${index === 0 ? "col-span-2" : ""}`}>
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
          <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Shopify collection</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{product.title}</h1>
          <p className="mt-5 text-xl text-zinc-700">{price}</p>

          <div className="mt-8 border-y border-zinc-200 py-8">
            <p className="whitespace-pre-line text-sm leading-7 text-zinc-600">
              {product.description || "Designed for everyday use, with thoughtful details throughout."}
            </p>
          </div>

          {product.variants && product.variants.nodes.length > 1 ? (
            <div className="mt-8">
              <div className="mb-3 flex justify-between text-sm font-medium">
                <span>Options</span>
                <span className="text-zinc-500">Select one</span>
              </div>
              <div className="grid gap-2">
                {product.variants.nodes.map((variant) => (
                  <div key={variant.id} className="flex items-center justify-between border border-zinc-200 px-4 py-3 text-sm">
                    <span>{variant.title}</span>
                    <span className="text-zinc-500">{variant.availableForSale ? "Available" : "Sold out"}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <button type="button" disabled={!hasAvailableVariant} className="mt-8 w-full bg-zinc-950 px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300">
            {hasAvailableVariant ? "Add to cart" : "Sold out"}
          </button>
          <p className="mt-3 text-center text-xs text-zinc-500">Free shipping on orders over $75</p>
        </section>
      </div>
    </main>
  );
}