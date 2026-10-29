export function loader() {
  return new Response(
    'User-agent: *\nAllow: /\n\nSitemap: https://dropvia.fun/sitemap.xml\n',
    {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    },
  );
}
