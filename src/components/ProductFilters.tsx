"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { catalogQuery, SORT_OPTIONS, type CatalogState, type SizeOption, type TagOption } from "@/lib/catalog";

function formQuery(form: HTMLFormElement) {
  const query = new URLSearchParams();
  new FormData(form).forEach((value, key) => {
    if (typeof value === "string" && value && !(key === "availability" && value === "all") && !(key === "sort" && value === "default")) query.append(key, value);
  });
  return query;
}
export function ProductFilters({ state, sizes, tags, currency, priceMaximum }: { state: CatalogState; sizes: SizeOption[]; tags: TagOption[]; currency: string; priceMaximum: number | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const ceiling = Math.max(Math.ceil(priceMaximum ?? 0), state.min ?? 0, state.max ?? 0);
  const [priceMin, setPriceMin] = useState(state.min ?? 0);
  const [priceMax, setPriceMax] = useState(state.max ?? ceiling);
  const [priceEdited, setPriceEdited] = useState(false);
  const formatPrice = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  const minPercent = ceiling > 0 ? priceMin / ceiling * 100 : 0;
  const maxPercent = ceiling > 0 ? priceMax / ceiling * 100 : 100;
  const id = useId();
  const clear = catalogQuery({ ...state, sizes: [], tags: [], availability: "all", min: undefined, max: undefined });
  const active = state.tags.length + state.sizes.length + (state.availability !== "all" ? 1 : 0) + (state.min !== undefined || state.max !== undefined ? 1 : 0);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = formQuery(event.currentTarget);
    const min = query.get("min"); const max = query.get("max");
    if (min !== null && max !== null && Number(min) > Number(max)) { setError("Minimum price must not exceed maximum price."); return; }
    setError("");
    startTransition(() => router.push(`/products?${query}`, { scroll: false }));
  }
  return <aside aria-label="Product filters" className="self-start rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-6">
    <div className="flex items-center justify-between gap-3">
      <h2 className="hidden font-semibold lg:block">Filters{active ? ` (${active})` : ""}</h2>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)} className="theme-link font-semibold lg:hidden">Filters{active ? ` (${active})` : ""} <span aria-hidden="true">{open ? "−" : "+"}</span></button>
      <Link href={`/products?${clear}`} onClick={() => { form.current?.reset(); setPriceMin(0); setPriceMax(ceiling); setPriceEdited(true); setError(""); }} className="theme-link text-xs underline underline-offset-4">Clear all</Link>
    </div>
    <form ref={form} action="/products" method="get" onSubmit={submit} id={id} className={`${open ? "block" : "hidden"} mt-6 lg:block`} aria-busy={pending}>
      {state.collection ? <input type="hidden" name="collection" value={state.collection} /> : null}
      <input type="hidden" name="sort" value={state.sort} />
      <fieldset disabled={pending} className="space-y-6 disabled:opacity-60">
        <legend className="sr-only">Filter products</legend>
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">Availability</legend>
          <div className="space-y-3">{[{ value: "all", label: "All products" }, { value: "in-stock", label: "In stock" }, { value: "sold-out", label: "Sold out" }].map(option =>
            <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="availability" value={option.value} defaultChecked={state.availability === option.value} className="size-4 accent-primary" />{option.label}
            </label>)}</div>
        </fieldset>
        <fieldset className="border-t border-border pt-5">
          <legend className="text-sm font-semibold">Price range <span className="font-normal text-muted-foreground">({currency})</span></legend>
          <input type="hidden" name="min" value={priceEdited ? (priceMin > 0 ? priceMin : "") : state.min ?? ""} />
          <input type="hidden" name="max" value={priceEdited ? (priceMax < ceiling ? priceMax : "") : state.max ?? ""} />
          <div className="mt-2 flex justify-between gap-2 text-sm font-medium tabular-nums">
            <output htmlFor={`${id}-min`}>{formatPrice(priceMin)}</output>
            <span aria-hidden="true" className="text-muted-foreground">?</span>
            <output htmlFor={`${id}-max`}>{formatPrice(priceMax)}</output>
          </div>
          <div className="relative mx-2 my-3 h-10">
            <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-secondary" />
            <div aria-hidden="true" className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary" style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }} />
            <input id={`${id}-min`} type="range" min="0" max={ceiling || 1} step="0.01" value={priceMin}
              disabled={ceiling === 0} aria-label="Minimum price" aria-valuetext={formatPrice(priceMin)} aria-valuemax={priceMax}
              onChange={event => { setPriceMin(Math.min(Number(event.target.value), priceMax)); setPriceEdited(true); }}
              className="price-range-slider" style={{ zIndex: priceMin > ceiling / 2 ? 3 : 1 }} />
            <input id={`${id}-max`} type="range" min="0" max={ceiling || 1} step="0.01" value={priceMax}
              disabled={ceiling === 0} aria-label="Maximum price" aria-valuetext={formatPrice(priceMax)} aria-valuemin={priceMin}
              onChange={event => { setPriceMax(Math.max(Number(event.target.value), priceMin)); setPriceEdited(true); }}
              className="price-range-slider" style={{ zIndex: 2 }} />
          </div>
          <p className="text-xs text-muted-foreground">{ceiling > 0 ? "Drag the handles to set your budget." : priceMaximum === 0 ? "All products are free." : "Price range unavailable."}</p>
        </fieldset>
        <fieldset className="border-t border-border pt-5">
          <legend className="text-sm font-semibold">Size</legend>
          {sizes.length ? <div className="max-h-64 space-y-3 overflow-y-auto pr-1">{sizes.map(size => <label key={size.value} className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" name="size" value={size.value} defaultChecked={state.sizes.includes(size.value)} className="size-4 accent-primary" />
            <span className="min-w-0 flex-1 break-words">{size.label}</span>
          </label>)}</div> : <p className="text-sm text-muted-foreground">No size filters available for these products.</p>}
        </fieldset>
        <fieldset className="border-t border-border pt-5">
          <legend className="mb-3 text-sm font-semibold">Tags</legend>
          {tags.length ? <div className="max-h-64 space-y-3 overflow-y-auto pr-1">{tags.map(tag => <label key={tag.value} className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" name="tag" value={tag.value} defaultChecked={state.tags.includes(tag.value)} className="size-4 accent-primary" />
            <span className="min-w-0 flex-1 break-words">{tag.label}</span>
          </label>)}</div> : <p className="text-sm text-muted-foreground">No tag filters available for these products.</p>}
        </fieldset>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <button type="submit" className="button-primary w-full rounded-xl px-4 py-3 text-sm font-medium">{pending ? "Applying..." : "Apply filters"}</button>
      </fieldset>
    </form>
  </aside>;
}

export function ProductSort({ state }: { state: CatalogState }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const query = catalogQuery(state);
  query.delete("sort");
  return <form action="/products" method="get" className="flex flex-wrap items-center gap-2" aria-busy={pending} onSubmit={event => {
    event.preventDefault(); const next = formQuery(event.currentTarget);
    startTransition(() => router.push(`/products?${next}`, { scroll: false }));
  }}>
    {Array.from(query.entries()).map(([name, value], index) => <input key={`${name}-${index}`} type="hidden" name={name} value={value} />)}
    <label className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Sort by</span>
      <select name="sort" disabled={pending} defaultValue={state.sort} onChange={event => event.currentTarget.form?.requestSubmit()} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground">
        {SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
    <button type="submit" disabled={pending} className="button-secondary rounded-xl px-3 py-2 text-sm">{pending ? "Sorting..." : "Sort"}</button>
  </form>;
}
