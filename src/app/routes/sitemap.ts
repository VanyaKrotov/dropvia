export function loader() {
  // Both pages are noindex drafts. The sitemap XSD requires at least one URL.
  // At launch, return an XML urlset of verified canonical indexable URLs and
  // advertise it from robots.txt. Until then, do not publish an empty sitemap.
  return new Response(null, { status: 204 });
}
