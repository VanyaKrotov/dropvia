# Страница статуса: компактный header и обращение в поддержку

Требования: убрать надзаголовок Dropvia и подзаголовок; H1 уменьшить на20%; кнопка Report a problem / Сообщить о проблеме справа от help text, на mobile ниже; mailto в поддержку; мягкий pulse у service dots с reduced-motion fallback.

Файлы: `pages/status/status-page.tsx`, `shared/i18n/{en,ru}.ts`, `app/styles/site.css`, `docs/DESIGN_SYSTEM.md`. Loader, polling, generated status distribution, refresh/error states не меняются.

Проверки: `npm run check`; существующие SSR/polling/failure сценарии; снимки статуса desktop/tablet/mobile в обеих темах, review CTA href и контраста/переносов. Не отправлять письмо и не запускать внешний почтовый клиент при QA.
