import type { Route } from './+types/home-ru';
import { ComingSoon } from '../features/coming-soon/coming-soon';
import { pageMetadata } from '../features/coming-soon/metadata';

export const meta: Route.MetaFunction = () => pageMetadata('ru');

export default function HomeRussian() {
  return <ComingSoon locale="ru" />;
}
