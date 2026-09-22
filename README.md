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

## Checks

- `npm run lint`
- `npx tsc --noEmit`
- `npm test` (cart regression tests with mocked Shopify and browser boundaries)
- `npm run build`
- `npm start` (serve the production build)

## Behavior

Catalog data revalidates every 60 seconds. Product pages load all variant pages. Product lists use Shopify cursors and Previous/Next navigation, fetching eight products at a time. Collections link to filtered product lists.

Cart and search requests bypass the catalog cache. Cart writes are serialized within each browser tab, and successful responses update the drawer directly. Missing saved carts are replaced on the next add. Shopify validation errors and network errors are shown to the customer. The cart displays Shopify's line totals and subtotal, with final checkout calculations handled by Shopify.

Automated tests do not place orders. Verify variant prices, sold-out items, cart changes, and checkout against your store before deployment.
