# Дизайн-система Dropvia

## Основание

`DESIGN.md` прочитан целиком и сохранён: это стилевой reference AuthKit, не описание возможностей Dropvia. Берём его midnight canvas, холодный светлый текст, ритм 4px, 1200px container, pill controls, панели 16px и мягкую inset edge. Auth forms, SSO/MFA, WorkOS logo и демонстрация кастомизации не являются требованиями продукта.

Подготовительный экран использует одно выразительное слово Dropvia и спокойный статус. Загрузка не имитируется. Без фото, чужих логотипов, looping motion и вымышленных file cards. Градиент Skywash имеет конкретное основание в `DESIGN.md` и используется только в display wordmark. Световая атмосфера ограничена статическим тоном поверхности; тяжёлого backdrop blur нет.

## Tokens

Реализация — `app/styles/app.css`, Tailwind 4 `@theme` плюс CSS custom properties.

| Роль                      | Token                              | Значение                                    |
| ------------------------- | ---------------------------------- | ------------------------------------------- |
| Canvas                    | `--color-canvas`                   | `#05060f`                                   |
| Raised                    | `--color-raised`                   | `#2f343e`                                   |
| Panel                     | `--color-panel`                    | `#bad6f708`                                 |
| Foreground                | `--color-ink`                      | `#d8ecf8`                                   |
| Body                      | `--color-body`                     | `#d1e4fa`                                   |
| Secondary                 | `--color-muted`                    | `#c7d3ea`                                   |
| Helper                    | `--color-subtle`                   | `#9da7ba`                                   |
| Edge                      | `--color-edge`                     | `rgba(186, 215, 247, .12)`                  |
| Focus                     | `--color-focus`                    | `#b6d9fc`                                   |
| Auth CTA, резерв          | `--color-auth-accent`              | `#663af3`, только подтверждённые auth flows |
| Display                   | `--gradient-display`               | `#d8ecf8 → #98c0ef`, один wordmark          |
| Panel elevation           | `--shadow-panel`                   | inset hairline + слабый inset свет          |
| Page container            | `--container-page`                 | `75rem` (1200px)                            |
| Reading measure           | `--container-copy`                 | `40rem`                                     |
| Section gap               | `--spacing-section`                | `7.5rem` desktop, `4rem` mobile             |
| Panel padding             | стандарт `p-6`                     | `1.5rem`                                    |
| Buttons / panels / inputs | `--radius-control/panel/field`     | `999px / 16px / 6px`                        |
| Motion                    | `--motion-fast`, `--motion-normal` | `120ms`, `180ms`                            |
| Easing                    | `--ease-responsive`                | `cubic-bezier(.2,.8,.2,1)`                  |
| Focus outline             | `--focus-width`, `--focus-offset`  | `2px`, `4px`                                |

Reference содержит опечатку `#2f343` в разделе Surfaces, но корректное `#2f343e` в таблице цветов и quick start. Реализация использует валидное значение. Violet CTA описан противоречиво (pill family и 6px для auth); до появления auth вопрос не возникает. Для текущих navigation links используется pill.

## Типографика

Проприетарные Untitled Sans/aeonikPro/dotDigital не поставлялись и не лицензировались. Пока используется явно объявленный `system-ui` fallback из референса, с кириллицей и без внешних font requests. Это инженерная стартовая версия: финальный выбор лицензированных шрифтов требует подтверждения. Базовый текст 16px/1.5, мелкий 14px/1.43, helper не меньше 14px, section heading 28–44px/1.16, display wordmark адаптивно 64–160px/1.05, weight 500. В референсе display wordmark отдельно допускает 140–180px; не распространять этот размер на обычные headings.

Body measure ≤65ch. `text-wrap: balance` на headings, `overflow-wrap: anywhere` для длинных пользовательских значений. Tracking у больших размеров -0.02em, у body близок к нулю. Не использовать жирность 600+ как замену иерархии.

English — основной язык, русский — дополнительный. Header содержит две именованные языковые ссылки с `lang`, `hreflang` и `aria-current`, без иконок флагов и меню. Layout выдерживает более длинные русские строки; иерархия, типографика и tokens одинаковы. Copy находится рядом с feature; locale передаётся явно, URL является источником языка.

## Layout и состояния

- Mobile-first, 20px outer padding, затем 32px. Контейнер центрирован, content max 1200px. Никакого фиксированного viewport height, обрезающего текст при zoom.
- Стандартные Tailwind breakpoints: sm 40rem, md 48rem, lg 64rem, xl 80rem, 2xl 96rem. Проверка как минимум 390, 768, 1440px и узкий reflow 320px.
- Link — реальный href, button — действие. Нативные details/summary для раскрываемого статуса. Hit target ≥44px, keyboard order соответствует DOM.
- Hover повышает читаемость, active даёт немедленный feedback. Focus outline видим на canvas и panel; не удалять outline.
- Errors сообщают проблему и дают путь восстановления. Pending — только для существующего async действия; upload progress не рисуется без операции.
- `prefers-reduced-motion: reduce` отключает motion; `prefers-contrast: more` усиливает edges; reduced-transparency делает panel непрозрачнее. Никакого `transition: all`.

## Применение навыков и конфликты

Frontend Design — композиция; UI/UX Pro Max — targeted accessibility/type guidance; Taste — критика шаблонных решений; Apple Design — response, typography и сдержанность; Impeccable и Vercel — проверка результата. Никакой skill не может заменить `DESIGN.md` своим запретом тёмного цвета, gradient text или требованием изображений и анимаций. Current Impeccable engine/hook не запускается; audit делается по vendored references и реальному браузеру.

Визуальная приёмка: screenshot и просмотр mobile/tablet/desktop, контраст, DOM headings, keyboard/focus, reduced motion, отсутствие overflow, консоль и hydration, axe. Итоги — `docs/VERIFICATION.md`. Тестовая компиляция сама по себе не означает законченный UI.
