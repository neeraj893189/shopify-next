export type NavigationItem = {
  id: string;
  label: string;
  href?: string;
  children?: NavigationItem[];
};

/** Useful navigation even when Shopify menus are not configured or available. */
export const FALLBACK_NAVIGATION: NavigationItem[] = [
  {
    id: "shop",
    label: "Shop",
    href: "/products",
    children: [
      {
        id: "browse-products",
        label: "Products",
        href: "/products",
        children: [{ id: "all-products", label: "Shop all products", href: "/products" }],
      },
      {
        id: "browse-collections",
        label: "Collections",
        href: "/collections",
        children: [{ id: "all-collections", label: "Explore all collections", href: "/collections" }],
      },
    ],
  },
  { id: "collections", label: "Collections", href: "/collections" },
];
