"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { CartDrawer } from "@/components/CartDrawer";
import { MegaMenu } from "@/components/MegaMenu";
import { FALLBACK_NAVIGATION, type NavigationItem } from "@/lib/navigation";

type ProductSuggestion = { id: string; title: string; handle: string; image?: string };
export function Header({ navigation = FALLBACK_NAVIGATION }: { navigation?: NavigationItem[] }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [compact, setCompact] = useState(false);
  const listId = useId();

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <header className={`sticky top-0 z-50 border-b border-border/80 px-4 backdrop-blur-xl transition-all duration-300 sm:px-6 ${compact ? "bg-surface/92 py-2 shadow-lg shadow-shadow" : "bg-background/88 py-4 sm:py-5"}`}>
      <nav aria-label="Main navigation" className={`relative mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 transition-all duration-300 lg:grid-cols-[auto_minmax(0,1fr)_minmax(12rem,17rem)_auto] ${compact ? "lg:gap-3" : "lg:gap-5"}`}>
        <Link href="/" className="theme-link col-start-1 row-start-1 flex min-w-0 items-center gap-3">
          <span className={`grid shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-shadow transition-all duration-300 ${compact ? "size-9 text-sm" : "size-11 text-base"}`} aria-hidden="true">
            S
          </span>
          <span className="min-w-0">
            <span className={`block font-semibold leading-none tracking-tight transition-all duration-300 ${compact ? "text-base" : "text-lg"}`}>
              Shopify Storefront
            </span>
            <span className={`hidden text-xs uppercase tracking-[0.16em] text-muted-foreground transition-all duration-300 sm:block ${compact ? "mt-0 max-h-0 overflow-hidden opacity-0" : "mt-1 max-h-5 opacity-100"}`}>
              Curated goods
            </span>
          </span>
        </Link>
        <MegaMenu items={navigation} className="col-span-2 row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1" />
        <div className="relative col-span-2 row-start-3 w-full lg:col-span-1 lg:col-start-3 lg:row-start-1" role="search"
          onFocus={() => setFocused(true)}
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
          onKeyDown={event => { if (event.key === "Escape") setFocused(false); }}>
          <label htmlFor={`${listId}-input`} className="sr-only">Search products</label>
          <div className="relative">
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground">
              <path d="m21 21-4.2-4.2M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z" strokeLinecap="round" />
            </svg>
            <input id={`${listId}-input`} type="search" maxLength={200} value={query} onChange={event => { change(event.target.value); setFocused(true); }}
              aria-controls={focused && query.trim() ? listId : undefined}
              placeholder="Search products" className={`w-full rounded-full border border-border bg-secondary pl-10 pr-4 text-sm text-secondary-foreground shadow-sm shadow-shadow/40 transition-all duration-300 placeholder:text-secondary-foreground/70 focus:bg-surface ${compact ? "py-2" : "py-2.5"}`} />
          </div>
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
