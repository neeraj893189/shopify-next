import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const source = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports = {};
  new Function("exports", "require", source)(exports, name => name in mocks ? mocks[name] : require(name));
  return exports;
}
const variant = (id, available = true) => ({ id, title: id, availableForSale: available, price: { amount: "30.00", currencyCode: "USD" } });
const product = {
  id: "p1", handle: "shirt", title: "Linen shirt", description: "Lightweight linen.", featuredImage: null,
  availableForSale: true, priceRange: { minVariantPrice: { amount: "20.00", currencyCode: "USD" } },
  variants: { nodes: [variant("v1")] },
};
const addButton = load("src/components/AddToCartButton.tsx", { "@/lib/shopify/cart": { addProductToCart: async () => ({}) } });
const purchase = load("src/components/ProductPurchase.tsx", { "@/components/AddToCartButton": addButton });
const { ProductCard } = load("src/components/ProductCard.tsx", { "./AddToCartButton": addButton, "./ProductPurchase": purchase });

test("single-option cards offer direct add; multi-option cards require selection", () => {
  const single = renderToStaticMarkup(React.createElement(ProductCard, { product, collectionHandle: "summer" }));
  assert.match(single, />Add to cart<\/button>/);
  assert.match(single, /\/products\/shirt\?collection=summer/);
  assert.match(single, /Quick view/);
  const multiple = renderToStaticMarkup(React.createElement(ProductCard, { product: { ...product, variants: { nodes: [variant("v1"), variant("v2")] } } }));
  assert.match(multiple, />Choose options<\/button>/);
  assert.doesNotMatch(multiple, />Add to cart<\/button>/);
});

test("sold-out cards keep quick view available but disable purchase", () => {
  const html = renderToStaticMarkup(React.createElement(ProductCard, { product: { ...product, availableForSale: false } }));
  assert.match(html, /<button[^>]*disabled=""[^>]*>Sold out<\/button>/);
  assert.match(html, /aria-label="Quick view Linen shirt"/);
});

test("quick-view selection starts on an available variant with its own price", () => {
  const html = renderToStaticMarkup(React.createElement(purchase.ProductPurchase, {
    compact: true, product: { ...product, variants: { nodes: [variant("sold", false), variant("available")] } },
  }));
  assert.match(html, /\$30\.00/);
  assert.match(html, /<option value="available" selected="">/);
  assert.match(html, /<option value="sold" disabled="">/);
});

test("shared product loader includes all variant pages for quick view", async () => {
  const calls = [];
  const { getProduct } = load("src/lib/shopify/product.ts", {
    "./queries": { PRODUCT_QUERY: "product-query" },
    "./client": { shopifyFetch: async (_query, variables) => {
      calls.push(variables);
      return { product: { ...product, variants: variables.after
        ? { nodes: [variant("v2")], pageInfo: { hasNextPage: false, endCursor: null } }
        : { nodes: [variant("v1")], pageInfo: { hasNextPage: true, endCursor: "next" } } } };
    } },
  });
  assert.deepEqual((await getProduct("shirt")).variants.nodes.map(item => item.id), ["v1", "v2"]);
  assert.deepEqual(calls, [{ handle: "shirt" }, { handle: "shirt", after: "next" }]);
});

test("quick-view endpoint returns product, missing-product and upstream-error responses", async () => {
  const args = { params: Promise.resolve({ handle: "shirt" }) };
  for (const [result, status] of [[product, 200], [null, 404], [new Error("Upstream unavailable"), 502]]) {
    const { GET } = load("src/app/api/products/[handle]/route.ts", {
      "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
      "@/lib/shopify/product": { getProduct: async () => { if (result instanceof Error) throw result; return result; } },
    });
    const response = await GET(new Request("http://localhost/api/products/shirt"), args);
    assert.equal(response.status, status);
    const body = await response.json();
    if (status === 200) assert.equal(body.product.id, product.id);
    else assert.equal(typeof body.error, "string");
  }
});
