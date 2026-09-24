import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
const source = ts.transpileModule(readFileSync(new URL("../src/lib/catalog.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const api = {};
new Function("exports", source)(api);
const { parseCatalogParams, catalogQuery, catalogSort, getSizeOptions, productFilters } = api;
const sizes = [{ name: "Size", value: "S", label: "Small", count: 4 }, { name: "Size", value: "M", label: "Medium", count: 3 }];

test("tag metadata handles JSON and object inputs, deduplicates, and ignores unrelated values", () => {
  assert.deepEqual(api.getTagOptions([{ values: [
    { label: "Summer", count: 4, input: JSON.stringify({ tag: "summer" }) },
    { label: "Duplicate", count: 4, input: { tag: "summer" } },
    { label: "New arrivals", count: 2, input: { tag: "new & fresh" } },
    { input: "invalid" }, { input: null }, { input: { tag: 42 } }, { input: { tag: "" } },
    { input: { productType: "Shirt" } },
  ] }]), [{ value: "summer", label: "Summer", count: 4 }, { value: "new & fresh", label: "New arrivals", count: 2 }]);
});

test("multiple tags survive URL encoding and pagination and combine with existing filters", () => {
  const state = parseCatalogParams({ tag: ["summer", "new & fresh", "summer", "", "x".repeat(256)], size: "S", min: "10", availability: "in-stock", sort: "price-desc", collection: "clothes", after: "stale" });
  assert.deepEqual(state.tags, ["summer", "new & fresh"]);
  const query = catalogQuery(state);
  assert.equal(query.has("after"), false);
  query.set("after", "next");
  assert.deepEqual(new URLSearchParams(query.toString()).getAll("tag"), state.tags);
  assert.equal(query.get("sort"), "price-desc");
  assert.deepEqual(productFilters(state, sizes, [{ value: "summer" }, { value: "new & fresh" }]), [
    { available: true }, { price: { min: 10 } }, { variantOption: { name: "Size", value: "S" } },
    { tag: "summer" }, { tag: "new & fresh" },
  ]);
  query.delete("tag", "summer");
  assert.deepEqual(query.getAll("tag"), ["new & fresh"]);
  assert.deepEqual(productFilters(parseCatalogParams({ tag: "unknown" }), [], []), []);
  assert.deepEqual(parseCatalogParams({}).tags, []);
});

test("catalog URL round trip preserves multiple sizes, collection, zero price and sort", () => {
  const state = parseCatalogParams({ collection: "summer", size: ["S", "M", "S"], min: "0", max: "100.50", availability: "in-stock", sort: "price-desc", after: "old-cursor" });
  const query = catalogQuery(state);
  assert.deepEqual(query.getAll("size"), ["S", "M"]);
  assert.equal(query.get("collection"), "summer");
  assert.equal(query.get("min"), "0");
  assert.equal(query.get("sort"), "price-desc");
  assert.equal(query.has("after"), false);
  assert.equal(query.has("before"), false);
});

test("malformed filter values are rejected and reversed price bounds normalize", () => {
  const invalid = parseCatalogParams({ min: "-1", max: "Infinity", availability: "anything", sort: "DROP", size: ["", "S"] });
  assert.equal(invalid.min, undefined); assert.equal(invalid.max, undefined);
  assert.equal(invalid.availability, "all"); assert.equal(invalid.sort, "default");
  const reversed = parseCatalogParams({ min: "200", max: "10" });
  assert.equal(reversed.min, 10); assert.equal(reversed.max, 200);
});

test("Shopify filters combine sizes with availability and price; unknown sizes are omitted", () => {
  const state = parseCatalogParams({ size: ["S", "M", "unknown"], availability: "sold-out", min: "0", max: "50" });
  assert.deepEqual(productFilters(state, sizes), [
    { available: false }, { price: { min: 0, max: 50 } },
    { variantOption: { name: "Size", value: "S" } }, { variantOption: { name: "Size", value: "M" } },
  ]);
});

test("price range supports independent lower and upper bounds", () => {
  assert.deepEqual(productFilters(parseCatalogParams({ min: "10" }), []), [{ price: { min: 10 } }]);
  assert.deepEqual(productFilters(parseCatalogParams({ max: "50" }), []), [{ price: { max: 50 } }]);
  assert.deepEqual(productFilters(parseCatalogParams({}), []), []);
});

test("size facets come from Shopify inputs and honor custom option names", () => {
  const filters = [{ id: "options", label: "Options", type: "LIST", values: [
    { id: "s", label: "Small", count: 4, input: JSON.stringify({ variantOption: { name: "Size", value: "S" } }) },
    { id: "m", label: "Medium", count: 3, input: { variantOption: { name: "Size", value: "M" } } },
    { id: "color", label: "Red", count: 4, input: JSON.stringify({ variantOption: { name: "Color", value: "Red" } }) },
    { id: "bad", label: "Invalid", count: 0, input: "not JSON" },
  ] }];
  assert.deepEqual(getSizeOptions(filters), sizes);
  assert.deepEqual(getSizeOptions(filters, "color").map(option => option.value), ["Red"]);
});

test("sorting uses valid Shopify keys and preserves price direction for both sources", () => {
  assert.deepEqual(catalogSort(parseCatalogParams({}), false), { sortKey: "RELEVANCE", reverse: false });
  assert.deepEqual(catalogSort(parseCatalogParams({}), true), { sortKey: "COLLECTION_DEFAULT", reverse: false });
  for (const collection of [true, false]) {
    assert.deepEqual(catalogSort(parseCatalogParams({ sort: "price-asc" }), collection), { sortKey: "PRICE", reverse: false });
    assert.deepEqual(catalogSort(parseCatalogParams({ sort: "price-desc" }), collection), { sortKey: "PRICE", reverse: true });
  }
});

test("pagination can append a cursor without losing active filters", () => {
  const query = catalogQuery(parseCatalogParams({ size: ["S", "M"], collection: "summer", min: "25", availability: "in-stock", sort: "price-asc" }));
  query.set("after", "next-page");
  assert.deepEqual(query.getAll("size"), ["S", "M"]);
  assert.equal(query.get("min"), "25");
  assert.equal(query.get("availability"), "in-stock");
  assert.equal(query.get("sort"), "price-asc");
  assert.equal(query.get("collection"), "summer");
});

test("slider ceiling comes from unfiltered Shopify price metadata", () => {
  assert.equal(api.getPriceMaximum([{ id: "price", label: "Price", type: "PRICE_RANGE", values: [
    { id: "range", label: "Price", count: 0, input: JSON.stringify({ price: { min: 0, max: 349.95 } }) },
  ] }]), 349.95);
  assert.equal(api.getPriceMaximum([]), null);
  assert.equal(api.getPriceMaximum([{ type: "PRICE_RANGE", values: [{ input: { price: { max: 0 } } }] }]), 0);
  assert.equal(api.getPriceMaximum([{ type: "PRICE_RANGE", values: [{ input: "invalid" }] }]), null);
});
