import { FALLBACK_NAVIGATION, type NavigationItem } from "../navigation";
import { shopifyFetch } from "./client";

export type ShopifyMenuItem = {
  id: string;
  title: string;
  type: string;
  url: string | null;
  tags?: string[];
  resource?: { handle?: string } | null;
  items?: ShopifyMenuItem[];
};

const itemFields = "id title type url tags resource { ... on Collection { handle } ... on Product { handle } }";
const MENU_QUERY = `query Navigation($handle: String!) {
  shop { primaryDomain { url } }
  menu(handle: $handle) {
    items { ${itemFields} items { ${itemFields} items { ${itemFields} } } }
  }
}`;
const COLLECTIONS_QUERY = `query NavigationCollections {
  collections(first: 24) { nodes { id handle title } }
}`;

function safeUrl(value: string | null, base: string): URL | null {
  if (!value || value.trim() === "#") return null;
  try {
    const url = new URL(value, base);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

/** Translate only routes this storefront implements. Other pages stay on Shopify. */
export function normalizeMenuItems(items: ShopifyMenuItem[], storeUrl: string, primaryUrl = storeUrl): NavigationItem[] {
  const base = new URL(primaryUrl);
  const store = new URL(storeUrl);
  const localHosts = new Set([base.host, store.host]);

  function destination(item: ShopifyMenuItem): string | undefined {
    const url = safeUrl(item.url, base.href);
    if (!url) return undefined;
    if (!localHosts.has(url.host) || !["http:", "https:"].includes(url.protocol)) return url.href;
    // This app does not implement Shopify tag filters or arbitrary URL filters.
    if (item.tags?.length || url.search) return url.href;

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return `/${url.hash}`;
    if (parts[0] === "collections") {
      if (parts.length === 1) return `/collections${url.hash}`;
      if (parts.length === 4 && parts[2] === "products") {
        return `/products/${parts[3]}?collection=${encodeURIComponent(decodeURIComponent(parts[1]))}${url.hash}`;
      }
      if (parts.length === 2) {
        const handle = item.resource?.handle ?? decodeURIComponent(parts[1]);
        return handle === "all" ? `/products${url.hash}` : `/products?collection=${encodeURIComponent(handle)}${url.hash}`;
      }
    }
    if (parts[0] === "products" && parts.length <= 2) return `${url.pathname}${url.hash}`;
    return url.href;
  }

  return items.flatMap(item => {
    let href: string | undefined;
    try { href = destination(item); } catch { /* Invalid URL encoding: keep valid children only. */ }
    const children = normalizeMenuItems(item.items ?? [], storeUrl, primaryUrl);
    if (!href && children.length === 0) return [];
    return [{ id: item.id, label: item.title, ...(href ? { href } : {}), ...(children.length ? { children } : {}) }];
  });
}

type Collection = { id: string; handle: string; title: string };

export function buildFallbackNavigation(collections: Collection[] = []): NavigationItem[] {
  return FALLBACK_NAVIGATION.map(item => ({
    ...item,
    children: item.children?.map(group => ({
      ...group,
      children: group.id === "browse-collections"
        ? [
            ...collections.map(collection => ({
              id: collection.id,
              label: collection.title,
              href: `/products?collection=${encodeURIComponent(collection.handle)}`,
            })),
            ...(group.children ?? []),
          ]
        : group.children,
    })),
  }));
}

export async function getNavigation(): Promise<NavigationItem[]> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_PUBLIC_ACCESS_TOKEN ?? process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) return buildFallbackNavigation();

  const [menuResult, collectionsResult] = await Promise.allSettled([
    shopifyFetch<{ shop: { primaryDomain: { url: string } }; menu: { items: ShopifyMenuItem[] } | null }>(
      MENU_QUERY, { handle: process.env.SHOPIFY_MENU_HANDLE || "main-menu" },
    ),
    shopifyFetch<{ collections: { nodes: Collection[] } }>(COLLECTIONS_QUERY),
  ]);
  const collections = collectionsResult.status === "fulfilled" ? collectionsResult.value.collections.nodes : [];
  const fallback = buildFallbackNavigation(collections);
  if (menuResult.status === "rejected") {
    const reason = menuResult.reason instanceof Error ? menuResult.reason.message : "Request failed";
    console.warn(`Shopify navigation unavailable; using the fallback menu. ${reason}`);
    return fallback;
  }
  const data = menuResult.value;
  const items = normalizeMenuItems(data.menu?.items ?? [], `https://${domain}`, data.shop.primaryDomain.url);
  if (!items.length) return fallback;
  if (items.some(item => item.children?.length)) return items;

  // Flat default Shopify menus still get a useful mega menu immediately.
  const catalogIndex = items.findIndex(item => item.href === "/products");
  if (catalogIndex >= 0) {
    return items.map((item, index) => index === catalogIndex ? { ...item, children: fallback[0].children } : item);
  }
  return [fallback[0], ...items];
}
