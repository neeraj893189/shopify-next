import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/shopify/types";

export function ProductCard({ product, collectionHandle }: { product: Product; collectionHandle?: string }) {
  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.priceRange.minVariantPrice.currencyCode,
  }).format(Number(product.priceRange.minVariantPrice.amount));

  return (
    <article className="group">
      <Link href={collectionHandle
        ? { pathname: `/products/${product.handle}`, query: { collection: collectionHandle } }
        : `/products/${product.handle}`}>
        <div className="relative aspect-square overflow-hidden bg-secondary">
          {product.featuredImage ? (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : null}
        </div>
        <div className="flex items-start justify-between gap-4 py-4">
          <h2 className="font-medium">{product.title}</h2>
          <span className="text-sm text-muted-foreground">{price}</span>
        </div>
      </Link>
    </article>
  );
}
