import type { Product } from "@/lib/shopify/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products, collectionHandle, withSidebar = false }: { products: Product[]; collectionHandle?: string; withSidebar?: boolean }) {
  if (!products.length) {
    return <p className="text-muted-foreground">No products found.</p>;
  }

  return (
    <div className={`grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:gap-6 ${withSidebar ? "xl:grid-cols-3" : "lg:grid-cols-4"}`}>
      {products.map((product) => <ProductCard key={product.id} product={product} collectionHandle={collectionHandle} />)}
    </div>
  );
}
