# Contentful homepage setup

The homepage uses published content from the Content Delivery API. No SDK or management token is needed. Shopify continues to own products, prices, and checkout.

## Environment

Add to your existing .env.local (do not commit credentials):

```dotenv
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_DELIVERY_ACCESS_TOKEN=your_delivery_token
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_LOCALE=en-US
```

Use your space's locale code. The delivery token must have access to the configured environment. Restart the development server after setting these variables.

## Content models

Create these two content types with the exact API IDs below. Field IDs are case-sensitive.

### Homepage section ? API ID: homeSection

| Field ID | Type | Configuration |
| --- | --- | --- |
| heading | Short text | Required; entry display field |
| kind | Short text | Required; allowed values: hero, imageText, text, banner |
| enabled | Boolean | Default true; false hides the section |
| eyebrow | Short text | Optional small heading |
| body | Long text | Plain text, not Rich Text; line breaks preserved |
| image | Media | One image asset; used by hero and imageText |
| imageAlt | Short text | Optional accessible image description |
| imageRight | Boolean | Default true; false places image on left on desktop |
| buttonLabel | Short text | Optional |
| buttonUrl | Short text | Site path such as /products?collection=summer or full HTTPS URL |
 
### Homepage ? API ID: homePage

| Field ID | Type | Configuration |
| --- | --- | --- |
| title | Short text | Required; entry display field |
| slug | Short text | Required, unique; use home |
| seoTitle | Short text | Optional browser/search title |
| seoDescription | Long text | Optional plain text search description |
| sections | References | Many entries; restrict to homeSection |

## First homepage

1. Create a homeSection with kind hero, heading ?Simple goods, thoughtfully selected.?, buttonLabel ?Shop products?, and buttonUrl /products.
2. Optionally upload an image and publish the asset.
3. Create other sections: imageText for a brand story, banner for an offer, or text for an introduction.
4. Publish every section.
5. Create one homePage entry with slug home. Add the section references in display order and publish it.

Editors can reorder references, add or remove sections, and change content without code changes. All layouts follow the storefront theme colors. The first visible section gets an h1; later sections use h2.

Content is cached for 60 seconds and refreshed on subsequent requests. Unpublished or disabled sections are skipped. Missing credentials, API errors, or a homepage with no usable published sections show the default homepage. Server logs report configured-content failures without exposing tokens. This integration does not provide draft preview or webhook revalidation.

Only images hosted on images.ctfassets.net are accepted. Buttons accept site-relative paths and HTTP(S) URLs; unsafe schemes are ignored. Body content renders as plain text.

API reference: https://www.contentful.com/developers/docs/references/content-delivery-api/overview/
