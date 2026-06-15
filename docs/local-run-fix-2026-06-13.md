# Local install fix — 2026-06-13

Исправлены версии Expo SDK-пакетов в `mobile/package.json`:

- `expo-secure-store`: `~56.0.4`
- `expo-status-bar`: `~56.0.4`

Причина: версии `~16.0.0` и `~4.0.0` не существуют для текущего SDK 56.

Запуск:

```bat
cd mobile
npm install
npm run web
```
