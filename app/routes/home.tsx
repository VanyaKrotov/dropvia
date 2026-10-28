import type { Route } from './+types/home';
import { ComingSoon } from '../features/coming-soon/coming-soon';
import { pageMetadata } from '../features/coming-soon/metadata';

export const meta: Route.MetaFunction = () => pageMetadata('en');

export default function Home() {
  return <ComingSoon locale="en" />;
}
