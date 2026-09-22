import { NextRequest, NextResponse } from "next/server";
import { shopifyFetch } from "@/lib/shopify/client";
import type { Product } from "@/lib/shopify/types";
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query) return NextResponse.json({ products: [] });
  if (query.length > 200) return NextResponse.json({ error: "Search is too long." }, { status: 400 });
  try {
    const data = await shopifyFetch<{ search: { nodes: Pick<Product, "id" | "handle" | "title" | "featuredImage">[] } }>(`
      query Search($query: String!) {
        search(query: $query, first: 6, types: PRODUCT) {
          nodes { ... on Product { id handle title featuredImage { url altText } } }
        }
      }`, { query }, false);
    return NextResponse.json({ products: data.search.nodes.map(product => ({
      id: product.id, title: product.title, handle: product.handle, image: product.featuredImage?.url,
    })) });
  } catch (error) {
    console.error("Shopify search failed", error);
    return NextResponse.json({ error: "Search is unavailable. Please try again." }, { status: 502 });
  }
}
