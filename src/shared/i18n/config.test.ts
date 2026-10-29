import { describe, expect, it } from 'vitest';
import {
  createTranslations,
  localeFromPath,
  localizedPath,
  unlocalizedPath,
} from '@shared/i18n/config';

describe('URL translations', () => {
  it('isolates concurrent language instances', () => {
    const english = createTranslations('en');
    const russian = createTranslations('ru');

    expect(english.t('common.prices')).toBe('Plans');
    expect(russian.t('common.prices')).toBe('Тарифы');
    expect(english.t('common.prices')).toBe('Plans');
  });
  it('recognizes only a complete Russian segment and preserves nested pages', () => {
    expect(localeFromPath('/rubbish')).toBe('en');
    expect(localeFromPath('/ru/api/')).toBe('ru');
    expect(localizedPath(unlocalizedPath('/ru/api/'), 'en')).toBe('/api/');
    expect(localizedPath('/', 'ru')).toBe('/ru');
  });
});
