# Independent code review — 28 октября 2026

Применён локальный `code-review` с независимыми Standards/Spec review-агентами. Исходный main не имел commits; baseline — только пользовательский `DESIGN.md`, поэтому вместо несуществующего merge-base проверен полный снимок 402 новых/исходных файлов. Reviewer scopes read-only, без установки зависимостей и изменений. SHA-256 оригинального DESIGN: `380300d93fa0080c01386696b3ff8547a73eafe8d588285c25ed32e923069189`.

## Standards

Два замечания P2:

1. **Пустой error title.** `<title>{title} — Dropvia</title>` передавал несколько children React 19. Production request handler вернул пустой title. Исправлено на один интерполированный string; HTTP regression проверяет содержимое error title.
2. **Русский 404 становился английским.** Unmatched routes обходят root loader, и loaderData не содержит locale. Исправлено: Layout и ErrorBoundary используют SSR router location и общий `localeFromPath`, root locale loader удалён как ненужный. HTTP regression проверяет `/ru/missing`, lang, title и русский home URL.

Других существенных нарушений в проверенной архитектуре, CI и integrity scripts reviewer не обнаружил. Полная security audit не проводилась.

## Spec

Два замечания P2:

1. **Та же потеря языка на `/ru/missing`.** Нарушала подтверждённую поддержку русского и правило URL locale; исправление и regression описаны выше.
2. **Невалидный пустой sitemap.** [Официальная XSD](https://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd), полученная reviewer, требует хотя бы один `url` (default minOccurs=1). До появления indexable URLs endpoint теперь возвращает 204 без XML, robots не рекламирует sitemap, документы прямо указывают отложенную публикацию. Контракт проверяется HTTP-тестом. При запуске добавить XML с обеими canonical страницами и robots directive.

Остальные проверенные части соответствуют задаче: локальные skills и задокументированные адаптации, Framework SSR, документы, команды, две локали. Необоснованной продуктовой функциональности reviewer не обнаружил.

## Проверка исправлений

Три новых HTTP regression tests сначала фактически упали на исходных дефектах, затем прошли после изменений. Полный набор после исправлений: 2 unit tests и 30 Playwright cases прошли. Свежий общий контроль и визуальные результаты находятся в `VERIFICATION.md`.

Оба reviewer выполнили отдельную узкую повторную проверку. Standards через production createRequestHandler подтвердил русскую и английскую 404 с заполненными title и отсутствие React title warnings. Spec воспроизвёл 204/empty-body sitemap handler, отсутствие robots directive и проверил согласованность документации. Открытых замечаний из первоначального review нет.

Итог исходного review: Standards — 2 P2, Spec — 2 P2 (одно пересечение между осями). Все три уникальных дефекта исправлены. Review не заменяет тесты и не является гарантией отсутствия будущих ошибок.
