export type CatalogParams = Record<string, string | string[] | undefined>;
export type CatalogState = { collection?: string; sizes: string[]; tags: string[]; availability: string; min?: number; max?: number; sort: string };
export type StoreFilter = { id: string; label: string; type: string; values: { id: string; label: string; count: number; input: string | Record<string, unknown> }[] };
export type SizeOption = { value: string; label: string; name: string; count: number };
export type TagOption = { value: string; label: string; count: number };
export function getTagOptions(filters: StoreFilter[]): TagOption[] {
  const options: TagOption[] = [];
  for (const filter of filters) for (const entry of filter.values) {
    try {
      const input = typeof entry.input === "string" ? JSON.parse(entry.input) : entry.input;
      const tag = input?.tag;
      if (typeof tag === "string" && tag.length > 0 && !options.some(option => option.value === tag)) {
        options.push({ value: tag, label: entry.label, count: entry.count });
      }
    } catch { /* Ignore malformed or unrelated filter metadata. */ }
  }
  return options;
}
export function getPriceMaximum(filters: StoreFilter[]): number | null {
  let maximum: number | null = null;
  for (const filter of filters.filter(item => item.type === "PRICE_RANGE")) {
    for (const entry of filter.values) {
      try {
        const input = typeof entry.input === "string" ? JSON.parse(entry.input) : entry.input;
        const value = input?.price?.max;
        if (typeof value === "number" && Number.isFinite(value) && value >= 0) maximum = Math.max(maximum ?? 0, value);
      } catch { /* Ignore malformed price metadata. */ }
    }
  }
  return maximum;
}
export const SORT_OPTIONS = [
  { value: "default", label: "Default order" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];
export function parseCatalogParams(params: CatalogParams): CatalogState {
  const single = (key: string) => typeof params[key] === "string" ? params[key] as string : undefined;
  const money = (key: string) => {
    const value = single(key);
    if (!value || !/^\d+(\.\d{1,2})?$/.test(value)) return undefined;
    const amount = Number(value);
    return Number.isFinite(amount) && amount <= 1e12 ? amount : undefined;
  };
  let min = money("min"); let max = money("max");
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];
  const rawSizes = Array.isArray(params.size) ? params.size : typeof params.size === "string" ? [params.size] : [];
  const rawTags = Array.isArray(params.tag) ? params.tag : typeof params.tag === "string" ? [params.tag] : [];
  return { collection: single("collection"), sizes: [...new Set(rawSizes.filter(value => value.length > 0 && value.length <= 100))].slice(0, 50),
    tags: [...new Set(rawTags.filter(value => value.length > 0 && value.length <= 255))].slice(0, 50),
    availability: ["in-stock", "sold-out"].includes(single("availability") ?? "") ? single("availability")! : "all",
    min, max, sort: SORT_OPTIONS.some(option => option.value === single("sort")) ? single("sort")! : "default" };
}
export function catalogQuery(state: CatalogState): URLSearchParams {
  const query = new URLSearchParams();
  if (state.collection) query.set("collection", state.collection);
  state.sizes.forEach(size => query.append("size", size));
  state.tags.forEach(tag => query.append("tag", tag));
  if (state.availability !== "all") query.set("availability", state.availability);
  if (state.min !== undefined) query.set("min", String(state.min));
  if (state.max !== undefined) query.set("max", String(state.max));
  if (state.sort !== "default") query.set("sort", state.sort);
  return query;
}
export function getSizeOptions(filters: StoreFilter[], optionName = "Size"): SizeOption[] {
  const options: SizeOption[] = [];
  for (const filter of filters) for (const entry of filter.values) {
    try {
      const input = typeof entry.input === "string" ? JSON.parse(entry.input) : entry.input;
      const variant = input?.variantOption;
      if (typeof variant?.name === "string" && variant.name.toLowerCase() === optionName.toLowerCase() && typeof variant.value === "string") {
        if (!options.some(option => option.value === variant.value)) options.push({ value: variant.value, label: entry.label, name: variant.name, count: entry.count });
      }
    } catch { /* Ignore malformed or unrelated filter metadata. */ }
  }
  return options;
}
export function productFilters(state: CatalogState, sizes: SizeOption[], tags: TagOption[] = []): Record<string, unknown>[] {
  const filters: Record<string, unknown>[] = [];
  if (state.availability !== "all") filters.push({ available: state.availability === "in-stock" });
  if (state.min !== undefined || state.max !== undefined) filters.push({ price: { ...(state.min !== undefined ? { min: state.min } : {}), ...(state.max !== undefined ? { max: state.max } : {}) } });
  for (const value of state.sizes) {
    const option = sizes.find(size => size.value === value);
    if (option) filters.push({ variantOption: { name: option.name, value: option.value } });
  }
  for (const tag of state.tags) {
    if (tags.some(option => option.value === tag)) filters.push({ tag });
  }
  return filters;
}
export function catalogSort(state: CatalogState, collection: boolean) {
  return { sortKey: state.sort === "default" ? (collection ? "COLLECTION_DEFAULT" : "RELEVANCE") : "PRICE", reverse: state.sort === "price-desc" };
}
