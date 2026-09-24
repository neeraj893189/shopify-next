# Shopify Next.js storefront

A Next.js App Router storefront with Shopify product browsing, collections, variant selection, search, and a persistent cart. Checkout is hosted by Shopify.

## Setup

Install dependencies with `npm install` and create `.env.local`:

```dotenv
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_PUBLIC_ACCESS_TOKEN=your-storefront-public-access-token
SHOPIFY_STOREFRONT_API_VERSION=2026-07
```

`SHOPIFY_STOREFRONT_ACCESS_TOKEN` is accepted as a fallback for the public Storefront token. Use the store hostname without `https://`. Publish products and collections to the relevant Shopify storefront channel. Environment files are ignored by Git.

Run `npm run dev` and open http://localhost:3000.

## Store colors

Edit `src/app/theme.css` to brand the entire storefront. The default palette uses deep olive accents and buttons, muted sand secondary surfaces, and a warm ivory background. For example, to switch to a green store with blue action buttons:

```css
:root {
  --primary: #166534;
  --secondary: #f0fdf4;
  --button: #1d4ed8;
  --primary-foreground: #ffffff;
  --secondary-foreground: #14532d;
  --button-foreground: #ffffff;
}
```

Change the values in the existing `:root` block. `--primary` controls brand links, accents, focus outlines, and selected variants. `--secondary` controls supporting buttons, search fields, suggestion highlights, and image placeholders. `--button` controls Shop products, Add to cart, Checkout, and retry buttons. Leave `--button: var(--primary)` to make action buttons follow the primary color automatically.

Hover and disabled colors derive from these values. Page, panel, body text, border, overlay, shadow, and error colors are also centralized in the same file. Set `--primary-foreground`, `--secondary-foreground`, and `--button-foreground` to contrasting text colors when using light or dark fills; changing a fill does not automatically choose readable text. For example, a pale yellow button should use a dark `--button-foreground`. Choose a primary color that is also readable against the page background, since links use that color directly.

For new components, use semantic utilities such as `bg-surface`, `text-foreground`, `text-muted-foreground`, and `border-border`. Use `button-primary`, `button-secondary`, `button-quiet`, or `theme-link` for shared interactive colors and states. Add spacing, sizing, and shape with Tailwind classes. Avoid fixed palette classes like `bg-zinc-950` so new UI continues to follow the theme.

## Mega menu

The header uses Shopify's `main-menu` navigation. To select a different menu, set `SHOPIFY_MENU_HANDLE=your-menu-handle` in `.env.local` and restart the app. The Storefront token needs `unauthenticated_read_content` access to read Shopify menus.

Arrange parent, child, and grandchild items in your Shopify menu. Desktop shows top-level categories as expandable panels, with category columns and nested links. Mobile uses a Menu button and nested accordions. Click or use Enter/Space to expand, Tab to move through links, and Escape to close the current branch and return focus. Menus also close when navigating, clicking outside, or moving focus outside.

Product and collection links are translated to this storefront's routes. Shopify pages, blogs, filtered links, and external destinations keep their original URLs. If the menu is missing or unavailable, a Shop menu displays up to 24 collections plus a link to all collections. A flat menu gets a catalog mega panel automatically. Navigation data revalidates every 60 seconds; refreshed server renders pick up changes.

For code-defined menus, pass a `NavigationItem[]` to `MegaMenu`. Each item has a unique `id`, `label`, optional `href`, and optional recursive `children`. Edit `src/lib/navigation.ts` to customize the default fallback. The renderer supports deeper nesting; Shopify navigation supplies up to three levels.

```tsx
<MegaMenu items={[
  { id: "shop", label: "Shop", href: "/products", children: [
    { id: "clothing", label: "Clothing", children: [
      { id: "summer", label: "Summer", href: "/products?collection=summer" },
    ] },
  ] },
]} />
```

Place the desktop component inside a positioned container (for example, `className="relative"`); the wide panel aligns to that container. The existing header provides this positioning and keeps the cart at the far right.

## Breadcrumbs

Use `Breadcrumb` from `@/components/Breadcrumb` with an ordered `items` array. Add as many levels as needed; ancestor items link to their `href`, and the last item is the current page (rendered as text with `aria-current="page"`). Link destinations accept strings or Next.js URL objects.

```tsx
<Breadcrumb
  className="mb-6"
  items={[
    { label: "Home", href: "/" },
    { label: "Collections", href: "/collections" },
    { label: "Summer", href: { pathname: "/products", query: { collection: "summer" } } },
    { label: "Linen Shirt" },
  ]}
/>
```

The component follows the store theme and wraps long trails on small screens. `ariaLabel` can customize the navigation label. Product listings and collections include breadcrumbs; opening a product from a collection preserves that collection in its trail. Direct product links use Home / Products / Product.

## Catalog filters and sorting

The product listing has a desktop sidebar and collapsible mobile filters for tags, size, price range, and availability. Sorting supports default order and price in either direction. Apply filters to update results; changing the sort applies immediately. Active filter chips can be removed individually. URLs preserve filters, sorting, collection context, and pagination; changing criteria starts again at the first page.

Filtering and sorting run in Shopify before fetching a page of products. The full catalog uses product search; collection views use collection products. Size choices come from Shopify filter metadata, never from only the visible product cards. Tag choices also come from Shopify filter metadata for the catalog or selected collection. Enable the **Product tags** filter in Shopify Search & Discovery to expose tag checkboxes. Tags can be combined with the other filters, removed individually, and reset with Clear all. If Shopify exposes no tag filter, the sidebar displays an empty-state message. Enable the **Size** variant-option filter in Shopify Search & Discovery. For stores whose option has a different name, set `SHOPIFY_SIZE_OPTION_NAME` in `.env.local`. If Shopify exposes no size filter, the storefront shows that no size filters are available. The dual-handle price slider uses Shopify price-filter metadata for its upper limit and displays the current localization currency. Drag either handle or use the keyboard to adjust the range, then apply filters. Clear all restores the full range.

Shopify filter setup: [Filter products with the Storefront API](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections/filter-products).

## Product cards and quick view

Product cards include a quick-view dialog with an image gallery, variant selection, price, and Add to cart. Product details load on demand from `/api/products/[handle]`, using the same paginated variant loader as the product page. Single-variant products support direct Add to cart; multi-variant products show Choose options. Sold-out products cannot be added. Collection context is preserved when opening full product details.

Quick view uses a native modal dialog for focus containment and Escape handling, cancels pending requests when closed, and restores focus to its trigger. All card and dialog colors use the shared theme.

## Checks

- `npm run lint`
- `npx tsc --noEmit`
- `npm test` (cart, navigation, product-card, and quick-view regression tests)
- `npm run build`
- `npm start` (serve the production build)

## Behavior

Catalog data revalidates every 60 seconds. Product pages load all variant pages. Product lists use Shopify cursors and Previous/Next navigation, fetching twelve products at a time. Collections link to filtered product lists.

Cart and search requests bypass the catalog cache. Cart writes are serialized within each browser tab, and successful responses update the drawer directly. Missing saved carts are replaced on the next add. Shopify validation errors and network errors are shown to the customer. The cart displays Shopify's line totals and subtotal, with final checkout calculations handled by Shopify.

Automated tests do not place orders. Verify variant prices, sold-out items, cart changes, and checkout against your store before deployment.

## Contentful homepage

The homepage supports ordered hero, image/text, text, and promotional banner sections from Contentful, with editable SEO and a default homepage fallback. Follow [Contentful setup](docs/contentful.md) for environment variables, exact content model fields, and publishing steps.
