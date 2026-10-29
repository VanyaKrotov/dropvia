import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  route('api/v1/upload/:uuid?', 'routes/api-upload.ts'),
  route('api/v1/download/:uuid?', 'routes/api-download.ts'),
  route('api/v1/files/:uuid', 'routes/api-files.ts'),
  route('api/v1/shares/:uuid', 'routes/api-shares.ts'),
  route('api/v1/status', 'routes/api-status.ts'),
  route('api/v1/access-requests', 'routes/api-access.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route(':lang?/_data/:uuid', 'routes/file-server.tsx'),
  route(':lang?/sign-in', 'routes/sign-in.tsx'),
  route(':lang?', 'routes/site.tsx', [
    index('routes/home.tsx'),
    route('prices', 'routes/prices.tsx'),
    route('terms', 'routes/terms.tsx'),
    route('privacy', 'routes/privacy.tsx'),
    route('status', 'routes/status.tsx'),
    route('api', 'routes/api.tsx'),
  ]),
] satisfies RouteConfig;
