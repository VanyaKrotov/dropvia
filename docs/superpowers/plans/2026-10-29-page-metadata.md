# Заголовки, описания и social images

Исторический отчёт первого этапа. Последующее уточнение владельца заменило18 обложек одной `/images/og/dropvia.png` с логотипом и названием Dropvia. Все прежние метакартинки удалены; актуальный контракт — `docs/DESIGN_SYSTEM.md` и `docs/social-image-manifest.json`.

Требования: смысл страницы в начале title, единый суффикс ` | Dropvia`, отдельные понятные EN/RU descriptions и тёмные изображения с существующим знаком и названием по центру. DESIGN.md не менять. noindex и отсутствие discovery links у технических страниц сохраняются.

1. Централизовать title suffix и social tags в shared/seo; семь основных страниц, technical node pages и root errors используют один контракт. Canonical/hreflang остаются только на обычных страницах.
2. Обновить EN/RU metadata copy, не менять видимые H1 без необходимости. Добавить absolute OG/Twitter image URLs, alt, MIME, реальные размеры и summary_large_image.
3. Built-in imagegen создаёт18 PNG:9 назначений ×2 языка. Main pages индивидуальны; generic file-server cover используется D01/D02, error cover —404/500. После визуальной проверки скопировать все ассеты в public/images/og, сохранить фактические размеры и prompts/provenance. Не подменять генерацию SVG/Canvas макетами.
4. Red/green metadata tests; SSR HTML на EN/RU проверяет единственный title с суффиксом, description, OG/Twitter и доступность PNG с правильными размерами. Технические страницы и ошибки не получают canonical/hreflang.
5. Проверить все картинки, текст/логотип/безопасные поля; выполнить npm run check, обновить docs/DESIGN_SYSTEM.md и docs/ARCHITECTURE.md.

Техническая основа: React Router8.5.1 installed docs route meta; Open Graph https://ogp.me/ (og:image, type, dimensions, alt). Генерация встроенным image_gen с редактированием существующего logo/reference, без API keys/CLI fallback. Формат PNG, тёмная палитра из DESIGN.md.

## Результат и проверка

Реализованы единый suffix, локализованные descriptions и OG/Twitter covers для всех HTML-страниц, включая D01/D02 и ошибки.18 PNG сгенерированы и визуально просмотрены; декодирование PNG, размеры и hashes сохранены в manifest. Видимые H1 и продуктовые функции не менялись.

Metadata tests сначала дали ожидаемые2 ошибки на старом формате title; после реализации проходят. Полный `npm run check` прошёл skills, format, lint, typecheck,50 unit tests и build. На браузерном этапе146/147 прошли; один тест остановился до проверок при page.goto с Chromium net::ERR_NO_BUFFER_SPACE. Весь набор повторно выполнен командой `npm run test:e2e -- --workers=4`:147/147, exit0. Конфигурация проекта ради локального ограничения не менялась. Sandbox typegen изначально остановился на загрузке lodash/require; обычный локальный запуск прошёл этот этап и проверил типы.

Read-only code review: Standards —0 actionable findings; Spec —0 actionable findings. Проверялись только изменения metadata/images текущей задачи; предшествующая правка кнопки статуса сохранена. CI/deployment не запускались.
