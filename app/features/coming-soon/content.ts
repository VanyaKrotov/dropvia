import type { Locale } from '../../lib/i18n';

type PageContent = {
  title: string;
  description: string;
  purpose: string;
  status: string;
  launchLink: string;
  launchHeading: string;
  unavailable: string;
  next: string;
  question: string;
  answer: string;
  homeLabel: string;
  languageLabel: string;
};

export const content: Record<Locale, PageContent> = {
  en: {
    title: 'Dropvia — file storage and sharing',
    description:
      'Dropvia is a file storage service for uploading, sharing and downloading files. The service is in development.',
    purpose: 'Upload, share and download files.',
    status: 'Service in development',
    launchLink: 'About the launch',
    launchHeading: 'Preparing the first version',
    unavailable: 'File uploads and sharing are not available yet.',
    next: 'The first version of Dropvia will appear here.',
    question: 'When can I start using it?',
    answer: 'A launch date has not been announced. Updates will appear on this page.',
    homeLabel: 'Dropvia — home',
    languageLabel: 'Language',
  },
  ru: {
    title: 'Dropvia — хранение и передача файлов',
    description:
      'Dropvia — файловое хранилище для загрузки, передачи и скачивания файлов. Сервис в разработке.',
    purpose: 'Загрузка, передача и скачивание файлов.',
    status: 'Сервис в разработке',
    launchLink: 'О запуске',
    launchHeading: 'Готовим первую версию',
    unavailable: 'Загрузка и передача файлов пока недоступны.',
    next: 'Здесь появится первая версия Dropvia.',
    question: 'Когда можно будет пользоваться?',
    answer: 'Дата запуска пока не объявлена. Подробности появятся на этой странице.',
    homeLabel: 'Dropvia — главная',
    languageLabel: 'Язык',
  },
};
