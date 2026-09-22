export const CART_STORAGE_KEY = "shopify-cart-id";
export type CartLineSummary = {
  id: string; merchandiseId: string; title: string; variantTitle: string;
  quantity: number; totalAmount: string; image?: string; handle?: string;
};
export type CartSummary = {
  id: string; checkoutUrl: string; totalQuantity: number;
  totalAmount: string; currency: string; lines: CartLineSummary[];
};
async function readResponse(response: Response): Promise<CartSummary | null> {
  const result = await response.json() as { cart?: CartSummary | null; error?: string };
  if (!response.ok) throw new Error(result.error ?? "Cart request failed. Please try again.");
  return result.cart ?? null;
}
export async function fetchCart(cartId: string) {
  return readResponse(await fetch(`/api/cart?cartId=${encodeURIComponent(cartId)}`, { cache: "no-store" }));
}
// Serialize writes so concurrent add buttons share the newly created cart ID.
let pending: Promise<unknown> = Promise.resolve();
function mutate(method: string, values: Record<string, unknown>): Promise<CartSummary> {
  const operation = pending.then(async () => {
    const cartId = window.localStorage.getItem(CART_STORAGE_KEY);
    if (method !== "POST" && !cartId) throw new Error("Your cart is no longer available.");
    const cart = await readResponse(await fetch("/api/cart", {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cartId, ...values }),
    }));
    if (!cart) throw new Error("Unable to update your cart. Please try again.");
    window.localStorage.setItem(CART_STORAGE_KEY, cart.id);
    window.dispatchEvent(new CustomEvent("cart:updated", { detail: cart }));
    return cart;
  });
  pending = operation.catch(() => undefined);
  return operation;
}
export const addProductToCart = (merchandiseId: string, quantity = 1) => mutate("POST", { merchandiseId, quantity });
export const updateCartLineQuantity = (lineId: string, quantity: number) => mutate("PATCH", { lineId, quantity });
export const removeCartLine = (lineId: string) => mutate("DELETE", { lineId });
