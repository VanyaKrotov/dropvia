export function loader() {
  // Advertise a sitemap only once at least one public page can be indexed.
  return new Response('User-agent: *\nAllow: /\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
