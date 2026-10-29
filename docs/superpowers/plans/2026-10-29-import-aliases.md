# Алиасы импортов FSD

Задача владельца: читаемые импорты главных директорий через @ и tsconfig paths, с миграцией проекта.

1. Единственный каталог соответствий: compilerOptions.paths в tsconfig.json, без deprecated baseUrl и без дополнительных зависимостей. Алиасы @app/_, @pages/_, @widgets/_, @features/_, @entities/_, @shared/_ повторяют реальные имена слоёв.
2. Включить встроенный resolve.tsconfigPaths Vite8 и Vitest5; сохранить официальный React Router plugin/SSR.
3. AST-миграция реальных import/export/dynamic import specifiers в src/ и tests/, включая type-only и CSS ?url imports. Не менять тексты API-примеров, route registration strings, public URLs, CSS @import и Node new URL references. Generated ./+types/* сохраняется: Router использует virtual rootDirs.
4. Дополнить существующие ESLint FSD-ограничения новыми префиксами, проверить запрещённые и разрешённые импорты через ESLint API.
5. Проверить неизменность разрешённых целевых файлов до/после миграции, обновить архитектурные соглашения и README, запустить npm run check.

Результат:117 реальных import specifiers обновлены в50 файлах; TypeScript module resolution и файловая проверка CSS ?url подтвердили0 смен целевого файла. В src/tests не осталось относительных module imports, кроме generated ./+types. ESLint API проверил6 разрешённых/запрещённых случаев, включая старые относительные пути и новые aliases; результаты соответствуют FSD. npm run check завершился exit0:46 unit и138 Playwright scenarios, typecheck/lint/format/skills/build прошли. Дополнительные зависимости и baseUrl не добавлены; runtime-поведение и route registration не менялись.
