import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

// Exercise the actual TypeScript modules with isolated transport/browser boundaries.
function load(path, imports = {}, globals = {}) {
  const source = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  new Function("exports", "require", ...Object.keys(globals), source)(exports, name => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  }, ...Object.values(globals));
  return exports;
}
function route(shopifyFetch) {
  return load("src/app/api/cart/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/shopify/client": { shopifyFetch },
  });
}
const request = body => new Request("http://localhost/api/cart", { method: "POST", body: JSON.stringify(body) });
const cart = (id = "cart-1") => ({
  id, checkoutUrl: "https://example.com/checkout", totalQuantity: 2,
  cost: { subtotalAmount: { amount: "18.00", currencyCode: "USD" } },
  lines: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [{
    id: "line-1", quantity: 2, cost: { totalAmount: { amount: "18.00", currencyCode: "USD" } },
    merchandise: { id: "variant-1", title: "Large", product: { title: "Shirt", handle: "shirt" } },
  }] },
});

test("cart mutation errors produce a useful non-success response", async () => {
  const api = route(async query => {
    assert.match(query, /userErrors/);
    return { cartCreate: { cart: null, userErrors: [{ message: "This item is sold out." }] } };
  });
  const response = await api.POST(request({ merchandiseId: "variant-1" }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "This item is sold out.");
});

test("invalid bodies and quantities never reach Shopify", async () => {
  const api = route(async () => { assert.fail("Must validate before calling Shopify"); });
  for (const body of [null, [], {}, { merchandiseId: "v", quantity: -1 }, { merchandiseId: "v", quantity: 1.5 }, { merchandiseId: "v", quantity: "2" }]) {
    assert.equal((await api.POST(request(body))).status, 400);
  }
  assert.equal((await api.POST(new Request("http://localhost/api/cart", { method: "POST", body: "{" }))).status, 400);
});

test("a missing saved cart is replaced when adding a product", async () => {
  let calls = 0;
  const api = route(async (query, variables, cache) => {
    assert.equal(cache, false);
    if (++calls === 1) { assert.equal(variables.id, "expired"); return { cart: null }; }
    assert.match(query, /cartCreate/);
    assert.deepEqual(variables.input.lines, [{ merchandiseId: "variant-1", quantity: 1 }]);
    return { cartCreate: { cart: cart("replacement"), userErrors: [] } };
  });
  const response = await api.POST(request({ cartId: "expired", merchandiseId: "variant-1" }));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.cartId, "replacement");
  assert.equal(result.cart.totalAmount, "18.00");
  assert.equal(result.cart.lines[0].totalAmount, "18.00");
  assert.equal(result.cart.lines[0].variantTitle, "Large");
});

test("cart reads include lines beyond the first connection page", async () => {
  const first = cart();
  first.lines.pageInfo = { hasNextPage: true, endCursor: "cursor-1" };
  const second = cart();
  second.lines.nodes[0].id = "line-2";
  let calls = 0;
  const api = route(async (query, variables) => {
    if (++calls === 1) return { cart: first };
    assert.equal(variables.after, "cursor-1");
    return { cart: second };
  });
  const response = await api.GET({ nextUrl: new URL("http://localhost/api/cart?cartId=cart-1") });
  assert.deepEqual((await response.json()).cart.lines.map(line => line.id), ["line-1", "line-2"]);
});

test("update and removal forward validated line identifiers", async () => {
  const variablesSeen = [];
  const api = route(async (query, variables) => {
    variablesSeen.push(variables);
    return { [query.includes("cartLinesUpdate") ? "cartLinesUpdate" : "cartLinesRemove"]: { cart: cart(), userErrors: [] } };
  });
  assert.equal((await api.PATCH(request({ cartId: "cart-1", lineId: "line-1", quantity: 3 }))).status, 200);
  assert.equal((await api.DELETE(request({ cartId: "cart-1", lineId: "line-1" }))).status, 200);
  assert.deepEqual(variablesSeen, [{ cartId: "cart-1", lines: [{ id: "line-1", quantity: 3 }] }, { cartId: "cart-1", lineIds: ["line-1"] }]);
});

function browserClient(fetch) {
  const storage = new Map();
  const events = [];
  const window = { localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, dispatchEvent: event => events.push(event) };
  return { api: load("src/lib/shopify/cart.ts", {}, { window, fetch }), storage, events };
}

test("concurrent adds reuse the cart created by the first request", async () => {
  const bodies = [];
  const { api, events } = browserClient(async (_url, options) => {
    bodies.push(JSON.parse(options.body));
    await new Promise(resolve => setTimeout(resolve, 5));
    return Response.json({ cart: { id: "new-cart" } });
  });
  await Promise.all([api.addProductToCart("v1"), api.addProductToCart("v2")]);
  assert.equal(bodies[0].cartId, null);
  assert.equal(bodies[1].cartId, "new-cart");
  assert.equal(events.length, 2);
  assert.equal(events[1].detail.id, "new-cart");
});

test("failed cart writes reject, emit no success, and do not block retry", async () => {
  let calls = 0;
  const { api, events } = browserClient(async () => {
    if (++calls === 1) throw new Error("Network unavailable");
    return Response.json({ cart: { id: "retry-cart" } });
  });
  await assert.rejects(api.addProductToCart("v1"), /Network unavailable/);
  assert.equal(events.length, 0);
  assert.equal((await api.addProductToCart("v1")).id, "retry-cart");
});

test("cart reads surface upstream errors rather than returning an empty cart", async () => {
  const { api } = browserClient(async () => Response.json({ error: "Temporarily unavailable" }, { status: 502 }));
  await assert.rejects(api.fetchCart("cart-1"), /Temporarily unavailable/);
});
