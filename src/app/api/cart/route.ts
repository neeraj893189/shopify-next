import { NextRequest, NextResponse } from "next/server";
import { shopifyFetch } from "@/lib/shopify/client";
import type { CartSummary } from "@/lib/shopify/cart";

type Money = { amount: string; currencyCode: string };
type ShopifyCart = {
  id: string; checkoutUrl: string; totalQuantity: number;
  cost: { subtotalAmount: Money };
  lines: { nodes: Array<{
    id: string; quantity: number; cost: { totalAmount: Money };
    merchandise: { id: string; title: string; image?: { url: string } | null; product: { title: string; handle: string } };
  }>; pageInfo: { hasNextPage: boolean; endCursor: string | null } };
};
type Payload = { cart: ShopifyCart | null; userErrors: Array<{ message: string }> };
const fields = `
  id checkoutUrl totalQuantity cost { subtotalAmount { amount currencyCode } }
  lines(first: 250) {
    pageInfo { hasNextPage endCursor }
    nodes { id quantity cost { totalAmount { amount currencyCode } }
      merchandise { ... on ProductVariant { id title image { url } product { title handle } } }
    }
  }`;
const query = `query Cart($id: ID!) { cart(id: $id) { ${fields} } }`;
async function getCart(id: string) {
  return (await shopifyFetch<{ cart: ShopifyCart | null }>(query, { id }, false)).cart;
}
async function summary(cart: ShopifyCart | null): Promise<CartSummary | null> {
  if (!cart) return null;
  let page = cart.lines;
  const lines = [...page.nodes];
  while (page.pageInfo.hasNextPage && page.pageInfo.endCursor) {
    const data = await shopifyFetch<{ cart: ShopifyCart | null }>(
      `query CartPage($id: ID!, $after: String!) { cart(id: $id) { ${fields.replace("lines(first: 250)", "lines(first: 250, after: $after)")} } }`,
      { id: cart.id, after: page.pageInfo.endCursor }, false,
    );
    if (!data.cart) throw new Error("Cart is no longer available. Please try again.");
    page = data.cart.lines;
    lines.push(...page.nodes);
  }
  return {
    id: cart.id, checkoutUrl: cart.checkoutUrl, totalQuantity: cart.totalQuantity,
    totalAmount: cart.cost.subtotalAmount.amount, currency: cart.cost.subtotalAmount.currencyCode,
    lines: lines.map(line => ({ id: line.id, merchandiseId: line.merchandise.id,
      title: line.merchandise.product.title, variantTitle: line.merchandise.title,
      quantity: line.quantity, totalAmount: line.cost.totalAmount.amount,
      image: line.merchandise.image?.url, handle: line.merchandise.product.handle })),
  };
}
class InputError extends Error {}
function requiredString(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new InputError("Missing or invalid cart data.");
  return value;
}
async function mutate(request: NextRequest, method: "POST" | "PATCH" | "DELETE") {
  try {
    let body: Record<string, unknown>;
    try {
      const value: unknown = await request.json();
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
      body = value as Record<string, unknown>;
    } catch { throw new InputError("Expected a JSON object."); }
    let cartId = body.cartId == null ? null : requiredString(body.cartId);
    const quantity = body.quantity ?? (method === "POST" ? 1 : undefined);
    if (method !== "DELETE" && (typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1)) {
      throw new InputError("Quantity must be a positive integer.");
    }
    let name: string;
    let declaration: string;
    let args: string;
    let variables: Record<string, unknown>;
    if (method === "POST") {
      const merchandiseId = requiredString(body.merchandiseId);
      if (cartId && !(await getCart(cartId))) cartId = null;
      name = cartId ? "cartLinesAdd" : "cartCreate";
      declaration = cartId ? "$cartId: ID!, $lines: [CartLineInput!]!" : "$input: CartInput!";
      args = cartId ? "cartId: $cartId, lines: $lines" : "input: $input";
      const lines = [{ merchandiseId, quantity }];
      variables = cartId ? { cartId, lines } : { input: { lines } };
    } else {
      cartId = requiredString(cartId);
      const lineId = requiredString(body.lineId);
      name = method === "PATCH" ? "cartLinesUpdate" : "cartLinesRemove";
      declaration = method === "PATCH" ? "$cartId: ID!, $lines: [CartLineUpdateInput!]!" : "$cartId: ID!, $lineIds: [ID!]!";
      args = method === "PATCH" ? "cartId: $cartId, lines: $lines" : "cartId: $cartId, lineIds: $lineIds";
      variables = method === "PATCH" ? { cartId, lines: [{ id: lineId, quantity }] } : { cartId, lineIds: [lineId] };
    }
    const data = await shopifyFetch<Record<string, Payload>>(
      `mutation CartMutation(${declaration}) { ${name}(${args}) { cart { ${fields} } userErrors { message } } }`, variables, false,
    );
    const payload = data[name];
    if (payload.userErrors.length) throw new InputError(payload.userErrors.map(error => error.message).join(" "));
    if (!payload.cart) throw new InputError("Cart is no longer available. Please try again.");
    const cart = await summary(payload.cart);
    return NextResponse.json({ cart, cartId: cart?.id });
  } catch (error) {
    if (error instanceof InputError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Shopify cart request failed", error);
    return NextResponse.json({ error: "Unable to update your cart. Please try again." }, { status: 502 });
  }
}
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("cartId");
  if (!id) return NextResponse.json({ cart: null });
  try { return NextResponse.json({ cart: await summary(await getCart(id)) }); }
  catch (error) {
    console.error("Shopify cart request failed", error);
    return NextResponse.json({ error: "Unable to load your cart. Please try again." }, { status: 502 });
  }
}
export const POST = (request: NextRequest) => mutate(request, "POST");
export const PATCH = (request: NextRequest) => mutate(request, "PATCH");
export const DELETE = (request: NextRequest) => mutate(request, "DELETE");
