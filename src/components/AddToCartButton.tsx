"use client";

import { useRef, useState } from "react";
import { addProductToCart } from "@/lib/shopify/cart";

export function AddToCartButton({
  variantId,
  quantity = 1,
  disabled = false,
  className,
  buttonText = "Add to cart",
  onSuccess,
}: {
  variantId: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  buttonText?: string;
  onSuccess?: () => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const busy = useRef(false);

  async function handleAddToCart() {
    if (!variantId || disabled || busy.current) return;

    setIsAdding(true);
    busy.current = true;
    setError("");
    setAdded(false);
    try {
      await addProductToCart(variantId, quantity);
      setAdded(true);
      onSuccess?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to add this item. Please try again.");
    } finally {
      busy.current = false;
      setIsAdding(false);
    }
  }

  return (
    <>
    <button
      type="button"
      disabled={disabled || isAdding || !variantId}
      onClick={handleAddToCart}
      className={className}
    >
      {isAdding ? "Adding..." : disabled ? "Sold out" : buttonText}
    </button>
    {error ? <p role="alert" className="mt-2 text-sm text-danger">{error}</p> : null}
    <p role="status" className={added ? "mt-2 text-sm text-muted-foreground" : "sr-only"}>{added ? "Added to cart." : ""}</p>
    </>
  );
}
