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
  query CollectionProducts($handle: String!, $first: Int, $after: String, $last: Int, $before: String) {
    collection(handle: $handle) {
      title
      products(first: $first, after: $after, last: $last, before: $before) {
        pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
        nodes {
          id handle title description featuredImage { url altText }
          priceRange { minVariantPrice { amount currencyCode } }
        }
      }
    }
  }
`;
