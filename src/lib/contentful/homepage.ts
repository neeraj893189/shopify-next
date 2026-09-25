import { contentfulClient } from "./client";

export async function getHomepage() {
  const response = await contentfulClient.getEntries({
    content_type: "banner",
    limit: 1,
  });

  if (!response.items.length) {
    return null;
  }

  return response.items[0];
}