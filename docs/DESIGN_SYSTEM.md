# Дизайн-система Dropvia

## Cookie notice

Компактная немодальная панель у нижнего левого края: существующие surface/panel tokens, радиус16px, короткий текст14px, ссылка на политику и одна pill-кнопка «Хорошо»/OK с touch target44px. Ширина не больше34rem и учитывает края экрана/safe areas; мобильные отступы16px и gap12px. Уведомление не захватывает фокус, клавиатурный focus остаётся видимым. Дополнительный scroll-padding снизу помогает показать сфокусированные controls над панелью.

Появление — CSS fade-in с подъёмом12px за280ms, поэтому текст доступен и без JavaScript. Выход — Framer Motion fade с опусканием8px за180ms. Reduced motion отключает входное перемещение; MotionConfig ограничивает выходное. При ожидании блокируется только кнопка, её текст не меняется. Сбой подтверждения оставляет страницу и уведомление с доступным сообщением и повтором действия.

Основа — неизменённый `DESIGN.md`: midnight canvas, холодный свет, Skywash, тонкие inset edges, воздушный ритм, панели16px, pill controls. AuthKit — источник визуальных принципов, не продуктовых функций. Явная новая задача расширяет систему светлой темой устройства.

## Изображения для ссылок

`public/images/og/dropvia.png` — единственная метакартинка для всех страниц, обеих локалей, файловых серверов и ошибок. По уточнению владельца29October2026 прежние18 обложек удалены. На midnight canvas `#05060f` по центру расположен знак-капля, под ним — название Dropvia в холодном `#d8ecf8`. Широкие безопасные поля, без названий разделов, дополнительных обещаний и декоративных эффектов. Обложка всегда тёмная независимо от темы устройства.

Фактические размеры PNG хранятся в `shared/seo/social-images.json`; OG width/height берутся из этого файла. Исходный знак — `public/brand/dropvia-mark-on-dark-512.png`. Prompt, источник генерации, размеры и SHA-256 — `docs/social-image-manifest.json`. Общий `shared/seo/metadata.ts` подключает один URL для OG/Twitter и локализованный alt. PNG не загружается как контент страницы и не влияет на её LCP.

## Семантические токены

Реализация `src/app/styles/site.css`: Tailwind4 `@theme` + CSS custom properties, без `@apply` и class-composition dependencies.

| Роль           | Dark                  | Light              |
| -------------- | --------------------- | ------------------ |
| canvas         | #05060f               | #f6f8fc            |
| surface        | #0d101c               | #ffffff            |
| ink            | #d8ecf8               | #19263c            |
| body           | #c7d3ea               | #3e4b60            |
| muted          | #9da7ba               | #56647a            |
| hairline       | rgba(186,215,247,.12) | rgba(36,61,98,.15) |
| input boundary | #606e84               | #79869a            |
| focus          | #b6d9fc               | #663af3            |
| success        | #a8d6c9               | #236658            |
| degraded       | #e4bf83               | #85531e            |
| error          | #ffa6ba               | #a42c45            |
| request submit | #663af3 / white       | #663af3 / white    |

Status colors express semantic state and always have a textual equivalent. Violet is reserved for form submission (request access and sign-in); navigation CTA is neutral. Text/background pairs are tested separately in both themes. Hero Skywash is only large display type. One static radial spotlight anchors the hero; no blur, decorative grids or continuous motion.

## Типографика и ритм

### Основной знак

Капелька из примера владельца — основной знак Dropvia. Ресурсы в `public/brand/`: адаптивный `dropvia-mark.svg`, фиксированные `dropvia-mark-on-dark.svg` (Ice Highlight) и `dropvia-mark-on-light.svg` (Ink), прозрачные PNG512px для экспорта. SVG имеет квадратный viewBox32×32, силуэт17×23.5 и встроенное свободное поле. Не растягивать непропорционально и не добавлять обводку, тень или градиент.

В header/footer знак32×32px, на телефоне28×28px, отступ до названия8px. Общий `BrandMark` использует один SVG-ресурс. Возле видимого имени Dropvia знак декоративный; доступное имя задаёт ссылка. Favicon SVG повторяет знак и меняет цвет по теме; ICO содержит16/32/48px варианты на midnight plate, отдельно Apple touch180px. Воспроизводимый экспорт: `node scripts/export-brand.mjs` (требуется установленный Chromium Playwright). Исходный `DESIGN.md` не изменяется.

System-ui uses the reference's licensed-font fallback; no proprietary font downloads. Display weight500, max5.75rem, responsive minimum2.7rem, tracking≥-.04em. Section headings2–2.75rem, body1rem/1.6, long legal text1.85 line-height with43rem measure. Mono only for code, data and reference-prescribed eyebrow labels.

Container75rem/1200px. Base4px spacing; section gap7.5rem desktop/5rem phone. Panels16px, inputs6px, buttons999px, circular status marks50%. Card padding24–32px. Elevation is the shared inset cool highlight plus soft offset shadow, not independent arbitrary shadows. Responsive transitions at48rem and64rem.

## Композиция

Landing Persuade follows the current AuthKit hierarchy: centered hero → file-category strip → three feature columns → API integration → vertical-tab file experience →2×2 platform grid → three use cases → quiet status/support section → plan navigation → FAQ → request form. The live reference was inspected in the browser; its pale palette and auth capabilities do not replace Dropvia tokens or facts. Continuous hairline rails and divided columns organize content without a row of isolated cards. Desktop/tablet/mobile layouts and both themes remain required. Full mapping: docs/LANDING_STRUCTURE.md.

Все многострочные примеры на лендинге и в API используют общий `CodeWindow`: macOS traffic lights, title bar высотой48px (3rem), доступная кнопка копирования, scrollable pre и безопасные React text spans для подсветки. Clipboard получает исходную строку, ошибки и успех объявляются через live region. Цвета синтаксиса берутся из существующих focus/success/warning/ink/muted, проверяются в обеих темах. Inline route names и идентификаторы остаются inline code. Новых зависимостей нет.

Копирование: круглая кнопка32×32px, только SVG-иконка18px; локализованные aria-label/title. После успешного Clipboard API иконка меняется на check на5000ms, затем возвращается copy. Повторное копирование перезапускает отсчёт; таймер очищается при замене feedback/unmount. При отказе clipboard галочка не показывается, остаётся доступное сообщение о ручном копировании.

Заявка расположена прямо в основной рамке `request-section`: заголовок, пояснение и форма без вложенной панели, отдельной заливки, скруглений и тени. Горизонтальные отступы секции48px на desktop,32px ниже1024px и20px ниже768px. От1024px имя, email и компания занимают три равные колонки; описание потребностей — всю следующую строку. Ниже1024px имя/email в двух колонках, компания и описание — во всю ширину. Ниже768px все поля и нижняя строка идут в одну колонку; кнопка занимает всю ширину. На desktop/tablet согласие слева, CTA справа. DOM-порядок соответствует визуальному порядку, без CSS order и дополнительных tab stops.

Форма использует6px inputs/textarea с явными labels и содержательными placeholders. Controls не меньше48px; textarea изначально96px и изменяет высоту вертикально. Name/email/needs обязательны, product/company необязательно для личных пользователей. Все текстовые поля имеют границы длины и серверную проверку. Placeholder — muted с достаточным контрастом, а не замена label. Submit: «Оставить заявку» / Request access, без иконок; пояснение о подписке из формы удалено. Изменение layout сохраняет валидацию, pending/error/success и серверную отправку без JS.

Заголовок и подзаголовок заявки показываются только вместе с формой. После подтверждения остаются центрированные галочка, заголовок «Заявка принята.» и пояснение. H2 активного состояния сохраняет `id=request-heading` для accessible name секции; одновременно выводится один такой заголовок. Знак: круг80px с лёгкой success-заливкой/границей и SVG-галочкой40px, stroke2.25. CSS однократно проявляет круг с scale0.8→1 за400ms и прорисовывает штрих за420ms с задержкой120ms. Default-разметка содержит готовый знак; CSS работает и без JS, а reduced motion сразу показывает итоговый вид. Без looping, glow и новых focus targets. Текст подтверждения в `role=status` с `aria-atomic=true`, SVG декоративный. Реальные снимки подтверждения в обеих темах сохраняет существующий сценарий `service.spec.ts` для desktop/tablet/mobile.

По запросу владельца desktop-экран оформлен окном Safari на macOS, мобильный — iPhone с открытым Safari. На desktop/tablet нижние границы устройств совпадают, iPhone перекрывает правый край окна на15% своей ширины; на mobile остаётся один iPhone. Browser chrome декоративный, использует цвета темы, адрес dropvia.fun и не добавляет tab stops. Appearance всей рамки: fade-in и подъём12px за900ms, без scale; reduced motion показывает неподвижный результат.

Карточка «Доступно с любого устройства.» использует общий `SafariToolbar` из hero: window controls, навигация, адресная строка, обновление, share/tabs. В миниатюре панель36px, в hero44px. Тот же desktop screenshot в ресурсе800px показывается целиком без обрезки, lazy-loaded с заданными размерами800×500; EN/RU и тема выбирают соответствующий файл. Компактная панель остаётся декоративной, а viewport reveal и reduced motion сохраняются.

Pricing: shared Plus/Standard/Advanced cards on landing and /prices, neutral panels, euro prices with account/user billing labels, aligned CTA and comparison links. Full semantic comparison table and FAQ on /prices. Team storage and recovery windows follow docs/PRICING.md. Cards stack on mobile; comparison scrolls within a labelled focusable region. Status Operate: current summary, manual refresh, four service rows, last-check UTC and help. API Read: endpoint navigation, format tabs, scrollable code and consistent responses. Legal Read: contents and narrow text column.

API reference: компактная баджа API v1 заменяет надзаголовок с брендом; H1 уменьшен на24% относительно общего page heading (`clamp(1.9rem,4.56vw,3.04rem)`). На desktop/tablet навигация закреплена под измеренной высотой шапки, на mobile становится горизонтальной прокручиваемой полосой. Порядок навигации: заголовок «Методы», семь операций, затем ссылки «Модели» и «Расшифровка ошибок». Якоря учитывают обе панели. GET — success/зелёный, POST — warning/янтарный, DELETE — error/красный; название метода всегда видно, цвет не является единственным различием. Для каждого метода native select выбирает HTTP-ответ с заголовками и телом в общем CodeWindow. Основное содержимое повторяет порядок навигации: методы, описание FileResource, расшифровка ошибок. API остаётся в футере и контекстных ссылках, из основной навигации шапки удалён.

## Движение и доступность

На узких экранах H1 правовых страниц использует clamp(1.75rem,7vw,2.5rem) и аварийный перенос длинного слова. Заголовок «Конфиденциальность» должен целиком помещаться внутри контейнера при320px и390px. Общий document scrollWidth не доказывает этого при overflow clipping; проверяются также реальные line boxes текста.

Sign-in использует одну центрированную панель шириной до26rem, радиус16px и отступы32px (24px на телефоне). Компактная шапка содержит знак/название и переключатель языка; ниже страницы — общий подвал. H1 размером2rem, короткое пояснение и явно подписанные email/password controls48px. Под кнопкой — текстовая ссылка на заявку. Native autocomplete=username/current-password сохраняет поддержку password managers; пароль не возвращается в SSR HTML. Pending блокирует повторную отправку. Собственная валидация показывает локализованное сообщение непосредственно под полем, выделяет его границу error-токеном и связывает сообщение через aria-invalid/describedby. Форма использует noValidate без браузерных всплывающих ошибок; минимум8 символов и остальные ограничения проверяет общий client/server validator. При submit фокус переходит на первое поле с ошибкой; исправление обновляет сообщение. Серверные fieldErrors показываются так же без JS. Общая ошибка авторизации остаётся отдельно под полями; сообщения объявляются role=alert. Те же семантические tokens, focus и системная тема; дополнительная декоративная анимация не требуется.

Страница статуса: header содержит только H1, уменьшенный ровно на20% относительно общего `clamp(2.5rem,6vw,4rem)` до `clamp(2rem,4.8vw,3.2rem)`. Надзаголовок и подзаголовок убраны. Help-блок располагает текст слева и mailto-кнопку справа; ниже768px кнопка занимает отдельную строку под текстом. Тема письма локализована, получатель support@dropvia.fun. Письмо открывается для написания, автоматически не отправляется.

По явной задаче владельца dots сервисов имеют функциональный pulse: неподвижная точка и расходящееся кольцо `currentColor`, цикл2.8s. Это узкое исключение из запрета декоративных loops. Pulse действует только при `prefers-reduced-motion: no-preference`; при reduced motion остаётся статичный индикатор. Цвет degraded наследуется от состояния; текстовые статусы, polling30s и ошибки не меняются. Никаких JS-таймеров для анимации.

Шапка `position: sticky; top: 0` сохраняет исходный вид наверху. После первых8px прокрутки IntersectionObserver включает82% canvas и backdrop blur12px с тонкой inset-границей. На самом верху фон/blur/граница отсутствуют. Внутренний контейнер сохраняет прежние размеры и перенос навигации. ResizeObserver учитывает фактическую высоту шапки в scroll-padding для якорей и фокуса, включая zoom и мобильный перенос строк. Подписки отключаются при unmount; scroll handlers и повторные render на каждом кадре не нужны. Reduced transparency/high contrast и отсутствие backdrop-filter получают сплошной canvas; без JS шапка остаётся липкой с читаемым сплошным фоном.

Framer Motion: image-load settling in the hero;260ms reversible scene changes in the interactive file story;650ms one-shot reveals of supporting visuals, with at most140ms sibling stagger. No decorative autoplay loops or scroll locking. The page-owned useLandingMotion hook cleans observers/controls, restores visibility and reacts to changed reduced motion. Default SSR/no-JS content is visible; only offscreen visuals are prepared by enhancement. `MotionConfig reducedMotion=user`, CSS reduced-motion removes movement/smooth scrolling. SSR and no-JS content remain visible. No count-up numbers, parallax, decorative loops or entrance animation on every section.

Три иллюстрации в Everyday реагируют на наведение на соответствующую колонку: передний лист поднимается на8px и поворачивается на2°, задний раскрывается до−13°, иконка поднимается на6px. CSS transition320ms с общим easing плавно возвращает исходное состояние. Hover включён только для fine pointer с hover и без reduced motion. Reveal остаётся на внешнем контейнере, hover — на дочерних слоях. Эти иллюстрации не являются кнопками: без pointer cursor, новых tab stops и touch-hover состояний.

Native anchors, details, forms and buttons; SVG icons are decorative next to text. Skip link,2px visible outline with5px offset, keyboard-operable code tabs, labelled fields, consent links, inline alerts/status acknowledgement. Main CTA48px, header controls44px; inline links and text nav have spacing. API examples and comparison table scroll inside their regions rather than causing page overflow. Light/dark and both languages require separate viewport/axe checks; axe is not a WCAG certificate.

FAQ на лендинге и тарифах использует общий `AccordionItem`: native details/summary сохраняет SSR/no-JS поведение. С JS высота и opacity раскрываются/закрываются за280ms; плюс состоит из двух штрихов, вертикальный плавно исчезает в минус. При повторном нажатии движение начинается с текущей высоты. Высота внутреннего контента измеряется с дробной точностью, native open снимается после закрытия; reduced motion меняет состояние сразу. Анимации useAnimate очищаются при unmount.

Секция статуса на лендинге по уточнению владельца: общий canvas без inverse-заливки, компактные отступы, заголовок «Статус и поддержка» и две реальные ссылки (status/support email). Не возвращать инфраструктурную сетку API/auth/download-серверов в этот блок; детали остаются на странице статуса.

Техническая страница файлового сервера — отдельная Read-поверхность с компактной шапкой и общим подвалом SiteFooter. В шапке рядом с кодом узла расположен общий LanguageSwitch; он сохраняет узел, query и hash. SiteFooter совпадает с основным сайтом и использует текущий язык. Контейнер896px, знак Dropvia и код узла, H1 до48px, краткое описание, плоская строка состояния/задержки и UTC-времени. Ниже — карточка «Узел» с семантическим dl, моноширинными значениями и тонкими пунктирными разделителями, рядом блок ссылок на основной сервис. Карточки16px, padding24px, без декоративной анимации. Ниже768px блоки складываются, отступы страницы20px, значения переносятся без общего overflow. Состояние обозначается текстом и SVG, обе темы используют существующие success/warning и surface tokens. HLS/DASH, signed URLs, TLS versions and replicas from the screenshot are not verified Dropvia capabilities and are not displayed.
