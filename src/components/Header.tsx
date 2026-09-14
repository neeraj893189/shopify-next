import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-zinc-200 px-6 py-5">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Shopify Storefront
        </Link>
        <div className="flex gap-6 text-sm text-zinc-600">
          <Link href="/products" className="hover:text-zinc-950">Products</Link>
          <Link href="/collections" className="hover:text-zinc-950">Collections</Link>
        </div>
      </nav>
    </header>
  );
}