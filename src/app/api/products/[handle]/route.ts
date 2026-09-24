import { NextResponse } from "next/server";
import { getProduct } from "@/lib/shopify/product";

export async function GET(_request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!handle || handle.length > 255) {
    return NextResponse.json({ error: "Invalid product." }, { status: 400 });
  }
  try {
    const product = await getProduct(handle);
    if (!product) return NextResponse.json({ error: "This product is no longer available." }, { status: 404 });
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Unable to load this product. Please try again." }, { status: 502 });
  }
}
