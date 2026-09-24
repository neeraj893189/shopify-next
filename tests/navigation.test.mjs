import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

function load(file, imports = {}, env = {}) {
  const source = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  new Function("exports", "require", "process", "console", source)(exports, name => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  }, { env }, { warn() {} });
  return exports;
}
const shared = load("src/lib/navigation.ts");
const store = "https://demo.myshopify.com";
const primary = "https://shop.example.com";
const item = (id, url, overrides = {}) => ({ id, title: id, url, type: "HTTP", ...overrides });
function navigation(fetch = async () => { throw new Error("Offline"); }, env = {}) {
  return load("src/lib/shopify/navigation.ts", { "../navigation": shared, "./client": { shopifyFetch: fetch } }, env);
}
const configured = { SHOPIFY_STORE_DOMAIN: "demo.myshopify.com", SHOPIFY_PUBLIC_ACCESS_TOKEN: "test-token" };

test("normalizes three levels while preserving collection context", () => {
  const { normalizeMenuItems } = navigation();
  const result = normalizeMenuItems([
    item("Shop", `${store}/collections/all`, { items: [
      item("Summer", `${primary}/collections/summer`, { items: [
        item("Shirt", `${primary}/collections/summer/products/shirt`),
      ] }),
    ] }),
  ], store, primary);
  assert.equal(result[0].href, "/products");
  assert.equal(result[0].children[0].href, "/products?collection=summer");
  assert.equal(result[0].children[0].children[0].href, "/products/shirt?collection=summer");
});

test("unsupported pages, external sites, and filtered Shopify links retain their destinations", () => {
  const { normalizeMenuItems } = navigation();
  const urls = [`${primary}/pages/contact`, "https://other.example/products/shirt", `${primary}/collections/summer/red`, `${primary}/products/shirt?variant=123`, "mailto:help@example.com"];
  assert.deepEqual(normalizeMenuItems(urls.map((url, i) => item(String(i), url)), store, primary).map(node => node.href), urls);
  assert.equal(normalizeMenuItems([item("Tagged", `${primary}/collections/summer`, { tags: ["red"] })], store, primary)[0].href, `${primary}/collections/summer`);
});

test("unsafe and empty leaf links are dropped without losing valid child links", () => {
  const { normalizeMenuItems } = navigation();
  const result = normalizeMenuItems([
    item("Bad", "javascript:alert(1)"), item("Data", "data:text/html,test"), item("Empty", "#"),
    item("Group", "#", { items: [item("Product", "/products/shirt")] }),
  ], store);
  assert.equal(result.length, 1);
  assert.equal(result[0].href, undefined);
  assert.equal(result[0].children[0].href, "/products/shirt");
});

test("fallback contains real collections and an all-collections link without mutating defaults", () => {
  const { buildFallbackNavigation } = navigation();
  const result = buildFallbackNavigation([{ id: "c1", handle: "summer", title: "Summer" }]);
  assert.equal(result[0].children[1].children[0].href, "/products?collection=summer");
  assert.equal(result[0].children[1].children.at(-1).href, "/collections");
  assert.equal(shared.FALLBACK_NAVIGATION[0].children[1].children.length, 1);
});

test("missing credentials return useful navigation without making a request", async () => {
  const api = navigation(async () => assert.fail("Unexpected network call"));
  assert.equal((await api.getNavigation())[0].label, "Shop");
});

test("custom handle is used and valid nested menus survive a failed collections request", async () => {
  const api = navigation(async (query, variables) => {
    if (query.includes("NavigationCollections")) throw new Error("Collections unavailable");
    assert.equal(variables.handle, "header-menu");
    return { shop: { primaryDomain: { url: primary } }, menu: { items: [item("Featured", "/products", { items: [item("Shirt", "/products/shirt")] })] } };
  }, { ...configured, SHOPIFY_MENU_HANDLE: "header-menu" });
  const result = await api.getNavigation();
  assert.equal(result.length, 1);
  assert.equal(result[0].children[0].href, "/products/shirt");
});

test("a failed menu request still builds a menu from available collections", async () => {
  const api = navigation(async query => {
    if (!query.includes("NavigationCollections")) throw new Error("Menu scope unavailable");
    return { collections: { nodes: [{ id: "c1", handle: "summer", title: "Summer" }] } };
  }, configured);
  assert.equal((await api.getNavigation())[0].children[1].children[0].label, "Summer");
});

test("flat catalog menus gain a mega panel without losing other links", async () => {
  const api = navigation(async query => query.includes("NavigationCollections")
    ? { collections: { nodes: [] } }
    : { shop: { primaryDomain: { url: primary } }, menu: { items: [item("Catalog", "/collections/all"), item("Contact", "/pages/contact")] } }, configured);
  const result = await api.getNavigation();
  assert.ok(result[0].children.length);
  assert.equal(result[1].href, `${primary}/pages/contact`);
});
