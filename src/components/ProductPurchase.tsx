"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/AddToCartButton";
import type { Product } from "@/lib/shopify/types";

export function ProductPurchase({ product }: { product: Product }) {
  const variants = product.variants?.nodes ?? [];
  const initialVariant = variants.find((variant) => variant.availableForSale) ?? variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariant?.id ?? "");

  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? initialVariant;
  const hasAvailableVariant = Boolean(selectedVariant?.availableForSale);
  const price = selectedVariant?.price ?? product.priceRange.minVariantPrice;

  return (
    <>
      <p className="mt-5 text-xl text-foreground" aria-live="polite">
        {new Intl.NumberFormat("en-US", { style: "currency", currency: price.currencyCode }).format(Number(price.amount))}
      </p>
      <div className="mt-8 border-y border-border py-8">
        <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{product.description}</p>
      </div>
      {variants.length > 1 ? (
        <div className="mt-8">
          <div className="mb-3 flex justify-between text-sm font-medium">
            <span>Options</span>
            <span className="text-muted-foreground">Select one</span>
          </div>
          <div className="grid gap-2">
            {variants.map((variant) => {
              const isSelected = variant.id === selectedVariant?.id;

              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={!variant.availableForSale}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`flex items-center justify-between border px-4 py-3 text-left text-sm transition ${
                    !variant.availableForSale
                      ? "cursor-not-allowed border-border bg-disabled text-disabled-foreground"
                      : isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface text-foreground enabled:hover:border-border-hover"
                  }`}
                >
                  <span>{variant.title}</span>
                  <span className={isSelected || !variant.availableForSale ? "text-inherit" : "text-muted-foreground"}>
                    {variant.availableForSale ? "Available" : "Sold out"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <AddToCartButton
        key={selectedVariant?.id}
        variantId={selectedVariant?.id ?? ""}
        disabled={!hasAvailableVariant}
        className="button-primary mt-8 w-full px-6 py-4 text-sm font-medium"
      />
    </>
  );
}
