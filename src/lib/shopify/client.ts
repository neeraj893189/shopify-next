import type { ShopifyResponse } from "./types";

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token =
  process.env.SHOPIFY_PUBLIC_ACCESS_TOKEN ??
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-07";

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  cache = true,
): Promise<T> {
  if (!domain || !token) {
    throw new Error("Shopify environment variables are not configured.");
  }

  const response = await fetch(
    `https://${domain}/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      ...(cache ? { next: { revalidate: 60 } } : { cache: "no-store" as const }),
    },
  );

  if (!response.ok) {
    throw new Error(`Shopify request failed with status ${response.status}.`);
  }

  const result = (await response.json()) as ShopifyResponse<T>;
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  if (!result.data) throw new Error("Shopify returned no data.");
  return result.data;
}
