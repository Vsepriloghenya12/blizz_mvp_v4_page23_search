# Проверка версии 10 — Видео

Проверено:

- `server npm run check`;
- `server/page10-smoke-test.js`;
- `mobile npm install`;
- `mobile npm run typecheck`;
- `npx expo export --platform web`;
- grep-проверки на отсутствие запрещённых элементов;
- `unzip -t` после упаковки.

Smoke-test проверяет:

- запрет видео без обложки;
- создание видео личным аккаунтом;
- `GET /api/videos/my`;
- `GET /api/videos/feed`;
- автора видео в ленте;
- лайк видео;
- сохранение видео;
- обновление `profile.stats.videos`;
- создание видео бизнесом `owner`;
- запрет создания видео бизнес-ролью `messages`.
