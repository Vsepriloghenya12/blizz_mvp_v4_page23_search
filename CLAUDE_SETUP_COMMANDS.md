# Claude Code — Команды настройки

Команды, которые нужно выполнить вручную для подключения MCP и плагинов к проекту Близз.

---

## Статус подключений

| Инструмент | Статус | Команда |
|-----------|--------|---------|
| v0 by Vercel | ✅ Уже добавлен в .claude.json | — |
| 21st.dev Magic | ✅ Уже добавлен в .claude.json | — |
| Context7 | ❌ Нужно добавить | см. ниже |
| Playwright MCP | ❌ Нужно добавить | см. ниже |
| Expo MCP | ❌ Нужно добавить | см. ниже |
| Figma MCP | ❌ Нужно добавить | см. ниже |
| Maestro MCP | ❌ Только если Maestro установлен | см. ниже |

---

## 1. Context7 — актуальная документация

Context7 даёт Claude актуальную документацию по Expo, React Native, React Navigation и другим библиотекам проекта.

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp@latest
```

**Или через .claude.json** (если команда выше не работает):
Добавить в секцию `mcpServers` в `C:\Users\Maibenben\.claude.json` для проекта `D:/blizz_mvp_v4_page23_search`:

```json
"context7": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@upstash/context7-mcp@latest"],
  "env": {}
}
```

После добавления использовать в запросах: `use context7`

---

## 2. Playwright MCP — проверка Expo Web

Playwright для тестирования PWA в браузере.

```bash
claude mcp add playwright -- npx @playwright/mcp@latest
```

**Требования:**
```bash
npx playwright install chromium
```

---

## 3. Expo MCP — правильные паттерны Expo

```bash
claude mcp add expo --transport http https://mcp.expo.dev/mcp
```

**Альтернатива — локальный Expo MCP** (запускать каждый раз вместе с `expo start`):
```bash
cd mobile
npx expo install expo-mcp --dev
EXPO_UNSTABLE_MCP_SERVER=1 npx expo start
```

⚠️ `expo-mcp` — unstable пакет. Проверить совместимость с Expo 56 перед установкой:
```bash
npx expo install expo-mcp --dev --dry-run
```

---

## 4. Figma MCP

Для работы с Figma нужен Personal Access Token.

```bash
claude mcp add figma -- npx figma-mcp --token YOUR_FIGMA_TOKEN
```

Или через официальный плагин (если доступен):
```bash
claude plugin install figma@claude-plugins-official
```

**Получить токен:**
Figma → Settings → Personal access tokens → Generate new token

---

## 5. Maestro MCP — мобильный visual QA

Только если Maestro установлен (нужен эмулятор iOS/Android).

**Установка Maestro:**
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Добавить в .claude.json:**
```json
"maestro": {
  "type": "stdio",
  "command": "maestro",
  "args": ["mcp"],
  "env": {}
}
```

---

## Как редактировать .claude.json вручную

Файл находится по пути: `C:\Users\Maibenben\.claude.json`

Найти секцию `"projects"` → `"D:/blizz_mvp_v4_page23_search"` → `"mcpServers"`.
Добавить нужные MCP серверы в этот объект.

---

## После добавления MCP

1. Закрыть текущую сессию Claude Code
2. Открыть новую сессию в папке `D:\blizz_mvp_v4_page23_search`
3. Проверить доступные инструменты

---

## Проверки проекта (уже работают)

```bash
# TypeScript check
cd mobile && npx tsc --noEmit

# Expo Web
cd mobile && npx expo start --web

# Backend
cd server && node src/server.js
```
