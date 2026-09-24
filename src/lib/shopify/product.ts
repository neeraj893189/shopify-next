import { cache } from "react";
import { shopifyFetch } from "./client";
import { PRODUCT_QUERY } from "./queries";
import type { Product } from "./types";

type ProductResponse = { product: Product | null };

export const getProduct = cache(async (handle: string): Promise<Product | null> => {
  const { product } = await shopifyFetch<ProductResponse>(PRODUCT_QUERY, { handle });
  if (!product) return null;
  let page = product.variants;
  const variants = [...(page?.nodes ?? [])];
  while (page?.pageInfo?.hasNextPage && page.pageInfo.endCursor) {
    const response = await shopifyFetch<ProductResponse>(PRODUCT_QUERY, { handle, after: page.pageInfo.endCursor });
    page = response.product?.variants;
    if (!page) throw new Error("Unable to load product options.");
    variants.push(...page.nodes);
  }
  return { ...product, variants: { nodes: variants } };
});
