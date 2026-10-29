# Компактная форма заявки

Задача: объединить заголовок, пояснение и форму в широкую панель; компактно распределить поля на desktop/tablet/mobile. Сохраняются тексты, поля, labels, consent, pending/error/success, API и no-JS отправка.

Файлы: `features/request-access/ui/request-access.tsx` — общая панель, сетка полей и нижняя строка; `app/styles/site.css` и `landing.css` — три/две/одна колонка, адаптивный header/footer, минимум48px controls; `docs/DESIGN_SYSTEM.md` — итоговое правило.

Проверки: `npm run check`, существующие сценарии заявки и no-JS, axe/overflow, реальные снимки формы desktop/tablet/mobile в обеих темах. Review структуры и DOM-порядка полей; без новых зависимостей и изменения backend.

Выполнено: общая панель, сетка3/2/1 колонки, textarea96px с resize, согласие/CTA в нижней строке. DOM-порядок и серверный контракт сохранены. `npm run check` завершился с кодом0:30unit tests,96Playwright tests, typecheck, lint, build, formatter и22skills. Просмотрены реальные screenshots desktop1440px, tablet768px, mobile390px в обеих темах. В suite прошли отправка, ошибки/повтор, no-JS, обе локали, axe и320px reflow. Финальные правки документации отдельно прошли `npm run format:check`. Remote CI и deployment не запускались.
