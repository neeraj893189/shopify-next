export const PRODUCTS_QUERY = `
  query Products($first: Int, $after: String, $last: Int, $before: String) {
    products(first: $first, after: $after, last: $last, before: $before) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        id
        handle
        title
        description
        availableForSale
        productType
        variants(first: 2) { nodes { id title availableForSale price { amount currencyCode } } }
        featuredImage { url altText }
        priceRange { minVariantPrice { amount currencyCode } }
      }
    }
  }
`;

export const PRODUCT_QUERY = `
  query Product($handle: String!, $after: String) {
    product(handle: $handle) {
      id
      handle
      title
      description
      availableForSale
      productType
      featuredImage { url altText }
      images(first: 8) {
        nodes { url altText }
      }
      priceRange { minVariantPrice { amount currencyCode } }
      variants(first: 250, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          title
          availableForSale
          price { amount currencyCode }
        }
      }
    }
  }
`;

export const COLLECTIONS_QUERY = `
  query Collections($after: String) {
    collections(first: 24, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { id handle title description }
    }
  }
`;
export const COLLECTION_QUERY = `
  query Collection($handle: String!) {
    collection(handle: $handle) { handle title }
  }
`;

export const COLLECTION_PRODUCTS_QUERY = `
  query CollectionProducts($handle: String!, $first: Int, $after: String, $last: Int, $before: String, $filters: [ProductFilter!], $sortKey: ProductCollectionSortKeys, $reverse: Boolean) {
    collection(handle: $handle) {
      title
      products(first: $first, after: $after, last: $last, before: $before, filters: $filters, sortKey: $sortKey, reverse: $reverse) {
        pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
        nodes {
          id handle title description availableForSale productType featuredImage { url altText }
          variants(first: 2) { nodes { id title availableForSale price { amount currencyCode } } }
          priceRange { minVariantPrice { amount currencyCode } }
        }
      }
    }
  }
`;

export const CATALOG_QUERY = `
  query Catalog($first: Int, $after: String, $last: Int, $before: String, $filters: [ProductFilter!], $sortKey: SearchSortKeys, $reverse: Boolean) {
    search(query: "*", types: [PRODUCT], unavailableProducts: SHOW, first: $first, after: $after, last: $last, before: $before, productFilters: $filters, sortKey: $sortKey, reverse: $reverse) {
      totalCount
      pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
      nodes { ... on Product {
        id handle title description availableForSale productType featuredImage { url altText }
        variants(first: 2) { nodes { id title availableForSale price { amount currencyCode } } }
        priceRange { minVariantPrice { amount currencyCode } }
      } }
    }
  }
`;
export const CATALOG_FILTERS_QUERY = `
  query CatalogFilters {
    localization { country { currency { isoCode } } }
    search(query: "*", types: [PRODUCT], unavailableProducts: SHOW, first: 1) {
      productFilters { id label type values { id label count input } }
    }
  }
`;
export const COLLECTION_FILTERS_QUERY = `
  query CollectionFilters($handle: String!) {
    localization { country { currency { isoCode } } }
    collection(handle: $handle) {
      title
      products(first: 1) { filters { id label type values { id label count input } } }
    }
  }
`;
