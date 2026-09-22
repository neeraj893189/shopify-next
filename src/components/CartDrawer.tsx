"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CART_STORAGE_KEY, fetchCart, removeCartLine, updateCartLineQuantity, type CartSummary } from "@/lib/shopify/cart";

export function CartDrawer() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);
  const revision = useRef(0);
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    async function refresh() {
      const current = ++revision.current;
      try {
        const id = window.localStorage.getItem(CART_STORAGE_KEY);
        const nextCart = id ? await fetchCart(id) : null;
        if (!active || current !== revision.current) return;
        if (id && !nextCart) window.localStorage.removeItem(CART_STORAGE_KEY);
        setCart(nextCart);
        setError("");
      } catch (error) {
        if (active && current === revision.current) setError(error instanceof Error ? error.message : "Unable to load your cart.");
      } finally {
        if (active && current === revision.current) setLoading(false);
      }
    }
    void refresh();
    const updated = (event: Event) => {
      revision.current++;
      setCart((event as CustomEvent<CartSummary>).detail);
      setLoading(false);
      setError("");
    };
    const storage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY || event.key === null) void refresh();
    };
    window.addEventListener("cart:updated", updated);
    window.addEventListener("storage", storage);
    return () => {
      active = false;
      window.removeEventListener("cart:updated", updated);
      window.removeEventListener("storage", storage);
    };
  }, [retry]);

  async function change(operation: () => Promise<CartSummary>) {
    if (busy.current) return;
    busy.current = true;
    setUpdating(true);
    setError("");
    try { await operation(); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to update your cart."); }
    finally { busy.current = false; setUpdating(false); }
  }
  const money = (amount: string) => new Intl.NumberFormat("en-US", { style: "currency", currency: cart?.currency ?? "USD" }).format(Number(amount));
  const close = () => dialog.current?.close();

  return (
    <>
      <button ref={trigger} type="button" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}
        className="button-secondary inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium">
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0">
          <path d="M3 3h2l2.4 12h11.2l2-8H6" />
          <circle cx="9" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
        </svg>
        Cart <span aria-live="polite">{cart?.totalQuantity ? `(${cart.totalQuantity})` : ""}</span>
      </button>
      <dialog ref={dialog} aria-labelledby="cart-heading" onClose={() => trigger.current?.focus()}
        onClick={event => { if (event.target === event.currentTarget) close(); }}
        className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-md bg-surface p-0 text-foreground shadow-2xl shadow-shadow backdrop:bg-overlay">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 id="cart-heading" className="text-lg font-semibold">Cart</h2>
            <button type="button" onClick={close} className="button-quiet rounded p-2 text-sm">Close</button>
          </div>
          {error ? <div role="alert" className="p-5 text-sm text-danger">{error}
            <button type="button" disabled={updating} onClick={() => { setLoading(true); setRetry(value => value + 1); }} className="ml-2 underline disabled:cursor-not-allowed disabled:text-disabled-foreground">Reload cart</button>
          </div> : null}
          <div className="flex-1 overflow-y-auto px-5 py-4" aria-busy={loading || updating}>
            {loading ? <p role="status">Loading cart...</p> : !cart?.lines.length ? (
              <p className="py-12 text-center">{error ? "Your cart could not be loaded." : "Your cart is empty."}</p>
            ) : <div className="space-y-4">{cart.lines.map(line => (
              <div key={line.id} className="flex gap-3 rounded-xl border border-border p-3">
                {line.image ? <Image src={line.image} alt={line.title} width={80} height={80} className="h-20 w-20 rounded-lg object-cover" /> : <div className="h-20 w-20 rounded-lg bg-secondary" />}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{line.title}</p>
                  {line.variantTitle !== "Default Title" ? <p className="text-sm text-muted-foreground">{line.variantTitle}</p> : null}
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" aria-label={`Decrease quantity of ${line.title}`} disabled={updating || line.quantity <= 1}
                      onClick={() => void change(() => updateCartLineQuantity(line.id, line.quantity - 1))} className="button-secondary h-9 w-9 border">-</button>
                    <span>{line.quantity}</span>
                    <button type="button" aria-label={`Increase quantity of ${line.title}`} disabled={updating}
                      onClick={() => void change(() => updateCartLineQuantity(line.id, line.quantity + 1))} className="button-secondary h-9 w-9 border">+</button>
                    <span className="ml-auto text-sm">{money(line.totalAmount)}</span>
                  </div>
                  <button type="button" disabled={updating} onClick={() => void change(() => removeCartLine(line.id))} className="button-quiet mt-2 text-sm underline">Remove</button>
                </div>
              </div>
            ))}</div>}
          </div>
          {cart?.lines.length ? <div className="border-t border-border p-5">
            <div className="mb-4 flex justify-between"><span>Subtotal</span><span>{money(cart.totalAmount)}</span></div>
            {updating || loading || error ? <span aria-disabled="true" className="button-primary block rounded-full p-3 text-center">Checkout</span> :
              <a href={cart.checkoutUrl} className="button-primary block rounded-full p-3 text-center">Checkout</a>}
            <Link href="/products" onClick={close} className="theme-link mt-3 block text-center text-sm">Continue shopping</Link>
          </div> : null}
        </div>
      </dialog>
    </>
  );
}
