"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { CartDrawer } from "@/components/CartDrawer";

type ProductSuggestion = { id: string; title: string; handle: string; image?: string };
export function Header() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const listId = useId();
  useEffect(() => {
    if (!query.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search is unavailable. Please try again.");
        const result = await response.json() as { products: ProductSuggestion[] };
        if (!controller.signal.aborted) setSuggestions(result.products);
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Search failed.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);
  function change(value: string) {
    setQuery(value);
    setSuggestions([]);
    setError("");
    setLoading(Boolean(value.trim()));
  }
  return (
    <header className="border-b border-border px-4 py-5 sm:px-6">
      <nav aria-label="Main navigation" className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 lg:grid-cols-[auto_1fr_minmax(12rem,16rem)_auto]">
        <Link href="/" className="theme-link col-start-1 row-start-1 text-lg font-semibold tracking-tight">Shopify Storefront</Link>
        <div className="col-span-2 row-start-2 flex items-center gap-4 text-sm lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:justify-self-center">
          <Link href="/products" className="theme-link">Products</Link>
          <Link href="/collections" className="theme-link">Collections</Link>
        </div>
        <div className="relative col-span-2 row-start-3 w-full lg:col-span-1 lg:col-start-3 lg:row-start-1" role="search"
          onFocus={() => setFocused(true)}
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
          onKeyDown={event => { if (event.key === "Escape") setFocused(false); }}>
          <label htmlFor={`${listId}-input`} className="sr-only">Search products</label>
          <input id={`${listId}-input`} type="search" maxLength={200} value={query} onChange={event => { change(event.target.value); setFocused(true); }}
            aria-controls={focused && query.trim() ? listId : undefined}
            placeholder="Search products" className="w-full rounded-full border border-border bg-secondary text-secondary-foreground placeholder:text-secondary-foreground/70 px-4 py-2.5 text-sm" />
          {focused && query.trim() ? <div id={listId} className="absolute left-0 top-full z-40 mt-2 w-full rounded-xl border border-border bg-surface p-2 shadow-lg shadow-shadow">
            {loading ? <p role="status" className="p-3 text-sm">Searching...</p> : error ? <p role="alert" className="p-3 text-sm text-danger">{error}</p> : suggestions.length ?
              <ul aria-label="Search results">{suggestions.map(product => <li key={product.id}>
                <Link href={`/products/${product.handle}`} onClick={() => { change(""); setFocused(false); }} className="flex items-center gap-3 rounded-lg p-3 text-sm hover:bg-secondary hover:text-secondary-foreground focus:bg-secondary focus:text-secondary-foreground">
                  {product.image ? <Image src={product.image} alt="" width={40} height={40} className="h-10 w-10 rounded-md object-cover" /> : null}
                  {product.title}
                </Link>
              </li>)}</ul> : <p role="status" className="p-3 text-sm">No products found.</p>}
          </div> : null}
        </div>
        <div className="col-start-2 row-start-1 justify-self-end lg:col-start-4">
          <CartDrawer />
        </div>
      </nav>
    </header>
  );
}
