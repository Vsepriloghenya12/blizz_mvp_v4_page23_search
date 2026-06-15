# Исправление пустой web-страницы

В этой версии исправлено:

- entrypoint Expo: `main` теперь указывает на `index.js`;
- `index.js` регистрирует приложение через `registerRootComponent`;
- убраны `expo-secure-store` и `expo-status-bar` из первой web-проверочной версии, чтобы не ловить несовместимые версии SDK-пакетов;
- добавлен ErrorBoundary: если приложение падает при рендере, вместо пустого экрана будет видна ошибка.

Для web-проверки:

```bat
cd D:\blizz_mvp_v4_page01_auth\server
npm install
npm run dev
```

Во втором терминале:

```bat
cd D:\blizz_mvp_v4_page01_auth\mobile
rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
npm install
npm run web
```
