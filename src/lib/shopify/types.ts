export type ShopifyImage = {
  url: string;
  altText: string | null;
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: {
    amount: string;
    currencyCode: string;
  };
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  featuredImage: ShopifyImage | null;
  images?: {
    nodes: ShopifyImage[];
  };
  variants?: {
    nodes: ProductVariant[];
    pageInfo?: { hasNextPage: boolean; endCursor: string | null };
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
};

export type ShopifyResponse<T> = {
  data: T;
  errors?: Array<{ message: string }>;
};