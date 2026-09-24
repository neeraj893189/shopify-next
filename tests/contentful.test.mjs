import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
const source = ts.transpileModule(readFileSync(new URL("../src/lib/contentful.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const api = {};
new Function("exports", "require", source)(api, () => ({ cache: fn => fn }));
const link = id => ({ sys: { id } });
const entry = (id, fields) => ({ sys: { id }, fields });

test("Contentful resolves ordered published sections and image assets; skips missing or disabled sections", () => {
  const home = api.parseHomeContent({
    items: [entry("home", { seoTitle: "My shop", sections: [link("b"), link("missing"), link("off"), link("a")] })],
    includes: { Entry: [
      entry("a", { kind: "text", heading: "Our story", buttonUrl: "javascript:alert(1)" }),
      entry("b", { kind: "hero", heading: "Welcome", image: link("photo"), buttonUrl: "/products" }),
      entry("off", { kind: "banner", heading: "Hidden", enabled: false }),
    ], Asset: [entry("photo", { description: "Linen shirt", file: { url: "//images.ctfassets.net/space/photo.jpg", contentType: "image/jpeg" } })] },
  });
  assert.equal(home.title, "My shop");
  assert.deepEqual(home.sections.map(section => section.id), ["b", "a"]);
  assert.equal(home.sections[0].image.url, "https://images.ctfassets.net/space/photo.jpg");
  assert.equal(home.sections[0].image.alt, "Linen shirt");
  assert.equal(home.sections[1].buttonUrl, undefined);
});
test("Contentful rejects unsafe buttons and falls back for empty or unknown content", () => {
  for (const url of ["javascript:alert(1)", "//evil.test", "/\\evil.test", "data:text/html,test"]) assert.equal(api.safeContentLink(url), undefined);
  assert.equal(api.safeContentLink("/products?collection=summer"), "/products?collection=summer");
  assert.equal(api.parseHomeContent({ items: [] }), null);
  assert.equal(api.parseHomeContent({ items: [entry("home", { sections: [link("unknown")] })], includes: { Entry: [entry("unknown", { kind: "unknown", heading: "Unknown" })] } }), null);
});
test("unconfigured Contentful returns the default homepage without a request", async () => {
  const original = process.env.CONTENTFUL_SPACE_ID;
  delete process.env.CONTENTFUL_SPACE_ID;
  try { assert.deepEqual(await api.getHomeContent(), api.FALLBACK_HOME); }
  finally { if (original !== undefined) process.env.CONTENTFUL_SPACE_ID = original; }
});
