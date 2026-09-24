"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AddToCartButton } from "./AddToCartButton";
import { ProductPurchase } from "./ProductPurchase";
import type { Product } from "@/lib/shopify/types";

export function ProductCard({ product, collectionHandle }: { product: Product; collectionHandle?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const request = useRef<AbortController | null>(null);
  const [details, setDetails] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const titleId = useId();
  const href = collectionHandle
    ? { pathname: `/products/${product.handle}`, query: { collection: collectionHandle } }
    : `/products/${product.handle}`;
  const variants = product.variants?.nodes ?? [];
  const singleVariant = variants.length === 1 ? variants[0] : undefined;
  const soldOut = product.availableForSale === false || (singleVariant && !singleVariant.availableForSale);
  const price = new Intl.NumberFormat("en-US", {
    style: "currency", currency: product.priceRange.minVariantPrice.currencyCode,
  }).format(Number(product.priceRange.minVariantPrice.amount));
  const images = details?.images?.nodes.length ? details.images.nodes : product.featuredImage ? [product.featuredImage] : [];
  const activeImage = images[imageIndex] ?? images[0];

  useEffect(() => () => request.current?.abort(), []);

  async function loadDetails() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    setDetails(null);
    setImageIndex(0);
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(product.handle)}`, { signal: controller.signal, cache: "no-store" });
      const result = await response.json() as { product?: Product; error?: string };
      if (!response.ok || !result.product) throw new Error(result.error ?? "Unable to load this product.");
      if (!controller.signal.aborted) setDetails(result.product);
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to load this product. Please try again.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  function openQuickView(button: HTMLButtonElement) {
    opener.current = button;
    dialog.current?.showModal();
    void loadDetails();
  }
  function closeQuickView() {
    request.current?.abort();
    dialog.current?.close();
  }

  return (
    <article className="group flex h-full min-w-0 flex-col rounded-2xl border border-border bg-surface p-3 shadow-sm shadow-shadow transition-shadow hover:shadow-lg focus-within:shadow-lg">
      <div className="relative overflow-hidden rounded-xl bg-secondary">
        <Link href={href} aria-label={`View ${product.title}`} className="relative block aspect-[4/5] overflow-hidden rounded-xl">
          {product.featuredImage ? <Image src={product.featuredImage.url} alt={product.featuredImage.altText ?? product.title} fill
            sizes="(min-width: 1280px) 270px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105" /> :
            <span className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-secondary-foreground">{product.title}</span>}
        </Link>
        {soldOut ? <span className="absolute left-3 top-3 rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">Sold out</span> : null}
        <button type="button" aria-haspopup="dialog" aria-label={`Quick view ${product.title}`} onClick={event => openQuickView(event.currentTarget)}
          className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium text-primary shadow-sm shadow-shadow transition-colors hover:bg-secondary">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
          Quick view
        </button>
      </div>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
        {product.productType ? <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{product.productType}</p> : null}
        <h2 className="min-h-12 text-base font-medium leading-6"><Link href={href} className="line-clamp-2 transition-colors hover:text-primary">{product.title}</Link></h2>
        <p className="mb-5 mt-2 font-semibold text-primary">{variants.length > 1 ? <span className="mr-1 text-xs font-normal text-muted-foreground">From</span> : null}{price}</p>
        <div className="mt-auto">
          {soldOut ? <button type="button" disabled className="button-primary w-full rounded-xl px-4 py-3 text-sm font-medium">Sold out</button> : singleVariant ?
            <AddToCartButton variantId={singleVariant.id} className="button-primary w-full rounded-xl px-4 py-3 text-sm font-medium" /> :
            <button type="button" aria-haspopup="dialog" onClick={event => openQuickView(event.currentTarget)} className="button-primary w-full rounded-xl px-4 py-3 text-sm font-medium">Choose options</button>}
        </div>
      </div>

      <dialog ref={dialog} aria-labelledby={titleId}
        onCancel={() => request.current?.abort()}
        onClose={() => { request.current?.abort(); opener.current?.focus(); }}
        onClick={event => { if (event.target === event.currentTarget) closeQuickView(); }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-4xl overflow-y-auto overscroll-contain rounded-3xl border border-border bg-surface p-0 text-foreground shadow-2xl shadow-shadow backdrop:bg-overlay">
        <div className="p-5 sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">A closer look</p>
            <button type="button" onClick={closeQuickView} aria-label="Close quick view" className="button-secondary flex size-10 shrink-0 items-center justify-center rounded-full">
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><path d="m6 6 12 12M6 18 18 6" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            <div className="min-w-0">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary">
                {activeImage ? <Image src={activeImage.url} alt={activeImage.altText ?? product.title} fill sizes="(min-width: 768px) 400px, 90vw" className="object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-sm text-secondary-foreground">No image available</span>}
              </div>
              {images.length > 1 ? <div className="mt-3 flex gap-2 overflow-x-auto p-1" aria-label="Product images">
                {images.map((image, index) => <button key={`${image.url}-${index}`} type="button" aria-label={`View image ${index + 1}`} aria-pressed={imageIndex === index}
                  onClick={() => setImageIndex(index)} className={`relative size-14 shrink-0 overflow-hidden rounded-lg border-2 ${imageIndex === index ? "border-primary" : "border-transparent"}`}>
                  <Image src={image.url} alt="" fill sizes="56px" className="object-cover" />
                </button>)}
              </div> : null}
            </div>
            <section className="min-w-0">
              <h2 id={titleId} className="text-2xl font-semibold tracking-tight sm:text-3xl">{product.title}</h2>
              {loading ? <p role="status" className="mt-6 text-sm text-muted-foreground">Loading product options...</p> : error ? <div role="alert" className="mt-6 text-sm text-danger">
                <p>{error}</p><button type="button" onClick={() => void loadDetails()} className="button-secondary mt-3 rounded-xl px-4 py-2">Try again</button>
              </div> : details ? <ProductPurchase key={details.id} product={details} compact /> : null}
              <Link href={href} onClick={closeQuickView} className="theme-link mt-6 inline-block text-sm underline underline-offset-4">View full product details</Link>
            </section>
          </div>
        </div>
      </dialog>
    </article>
  );
}
