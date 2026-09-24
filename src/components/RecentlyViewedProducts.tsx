"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/shopify/types";

type RecentProduct = {
  id: string;
  handle: string;
  title: string;
  image: string | null;
  imageAlt: string;
  price: string;
  currencyCode: string;
  viewedAt: number;
};

const STORAGE_KEY = "storefront:recently-viewed-products";
const MAX_RECENT_PRODUCTS = 8;

function readRecentProducts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as RecentProduct[];
    return Array.isArray(parsed) ? parsed.filter(product => product?.handle && product?.title) : [];
  } catch {
    return [];
  }
}

function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(Number(amount));
}

export function RecentlyViewedProducts({ product }: { product: Product }) {
  const [products, setProducts] = useState<RecentProduct[]>([]);

  useEffect(() => {
    const price = product.priceRange.minVariantPrice;
    const current: RecentProduct = {
      id: product.id,
      handle: product.handle,
      title: product.title,
      image: product.featuredImage?.url ?? null,
      imageAlt: product.featuredImage?.altText ?? product.title,
      price: price.amount,
      currencyCode: price.currencyCode,
      viewedAt: Date.now(),
    };
    const previous = readRecentProducts();
    const visibleProducts = previous.filter(item => item.handle !== current.handle).slice(0, 4);
    queueMicrotask(() => setProducts(visibleProducts));

    const next = [
      current,
      ...previous.filter(item => item.handle !== current.handle),
    ].slice(0, MAX_RECENT_PRODUCTS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage can fail in private browsing or when quota is full.
    }
  }, [product]);

  if (!products.length) return null;

  return (
    <section className="mt-16 border-t border-border pt-10 sm:mt-20 sm:pt-12" aria-labelledby="recently-viewed-heading">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-primary">Recently viewed</p>
          <h2 id="recently-viewed-heading" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Pick up where you left off
          </h2>
        </div>
        <Link href="/products" className="theme-link shrink-0 text-sm underline underline-offset-4">
          View all
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map(product => (
          <Link
            key={product.handle}
            href={`/products/${product.handle}`}
            className="group rounded-2xl border border-border bg-surface p-3 shadow-sm shadow-shadow transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 260px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-secondary-foreground">
                  {product.title}
                </span>
              )}
            </div>
            <div className="px-1 pt-4">
              <h3 className="line-clamp-2 text-sm font-medium leading-6 transition-colors group-hover:text-primary">
                {product.title}
              </h3>
              <p className="mt-1 text-sm font-semibold text-primary">{formatPrice(product.price, product.currencyCode)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
