# Близз — Claude Code Rules

## О проекте

**Близз** — социальная городская платформа (не клон Instagram/TikTok).
Четыре столпа: **Контент · Места · Общение · Бизнес**

## Стек

| Слой | Технологии |
|------|-----------|
| Mobile | Expo ~56, React Native 0.85.2, React 19, TypeScript |
| UI | StyleSheet (нет NativeWind), react-native-svg |
| Backend | Node.js + Express, JSON-база (server/data/db.json) |
| Навигация | Кастомный роутер в `MainTabs.tsx` (RouteState union type) |

## Структура

```
mobile/src/
  core/AppRoot.tsx              — session check, корень
  navigation/MainTabs.tsx       — главный роутер и таб-бар
  features/{feature}/api/       — API клиенты по домену
  screens/{domain}/[Screen].tsx — экраны
  shared/
    api/types.ts                — AuthResponse, Profile, PostItem...
    api/client.ts               — fetch wrapper
    ui/theme.ts                 — colors, spacing (дизайн-токены)
    ui/BlizzIcon.tsx            — иконки
    lib/sessionStorage.ts       — токен сессии

server/src/
  modules/{module}/             — маршруты и сервисы по домену
  shared/                       — middleware, утилиты
```

## Design Tokens (theme.ts)

```ts
colors.primary      = '#0B3D99'  // синий — CTA, активные элементы
colors.background   = '#FAFAF7'  // фон экрана
colors.surface      = '#FFFFFF'  // фон карточек
colors.softBlue     = '#EAF1FF'  // secondary кнопки, badge-фон
colors.textPrimary  = '#101828'
colors.textSecondary= '#667085'
colors.border       = '#D9E3F2'
colors.danger       = '#D92D20'

spacing.screenX = 16   // горизонтальные отступы экрана
spacing.block   = 24   // между секциями
spacing.row     = 12   // между строками
```

## Команды проверки

```bash
# TypeScript
cd mobile && npx tsc --noEmit

# Expo Web
cd mobile && npx expo start --web

# Backend
cd server && node src/server.js
```

---

## Процесс работы над экраном

**Порядок обязателен:**

### 1. Логика (сначала)
- Назначение экрана
- Кнопки и действия
- Переходы (откуда/куда)
- Роли и доступ
- Состояния: loading / empty / error / disabled
- Backend endpoints
- Связи с другими экранами

⏸️ **Ждать подтверждения логики перед шагом 2**

### 2. Визуал (после согласования логики)
- Структура (header / content / bottom)
- Отступы, типографика, карточки
- Состояния UI

⏸️ **Ждать подтверждения визуала перед шагом 3**

### 3. Код (после согласования визуала)
- Реализация в React Native / TypeScript
- Использование theme.ts
- Без комментариев к очевидному

### 4. Проверки (после кода)
```bash
cd mobile && npx tsc --noEmit
grep -r "isBusiness" mobile/src/
```
- Screenshot / preview если доступен
- Проверка старых сценариев

---

## Правило референса

**Если есть Figma / screenshot / mockup — он является источником визуальной правды.**
Claude не заменяет его "удобным упрощением" без явного согласования.

## Правило продолжения

**Каждый новый модуль продолжает рабочее приложение**, а не создаёт изолированную заглушку.
Сохранять навигацию, backend-связи, роли, activeAccountId, существующую архитектуру.

---

## Архитектурные правила

- Навигация через `RouteState` union type в `MainTabs.tsx`
- `SafeAreaView` только в `MainTabs`, не в экранах
- `auth.session.token` для всех API запросов
- `auth.activeAccount.id` для идентификации пользователя
- `auth.activeAccount.type === 'business'` для проверки роли
- `StyleSheet.create` для всех стилей (нет inline objects)
- `Platform.OS === 'web'` для web-специфичного кода

## Продуктовые правила

### Навигация
- Табы: Главная · Видео · + · Карта · Профиль
- Сообщения — НЕ таб, открывается из контекста

### Главная
- Вкладки: **Лента** (личные посты) и **Витрина** (бизнес)
- Лента и бизнес-контент не смешиваются

### Создание контента
- Пост / Видео / Оффер → через экран «+»
- **Близз → ТОЛЬКО через строку Близзов на Главной**
- На карте нельзя создавать контент

### Бизнес
- Не использовать `user.isBusiness` — только `auth.activeAccount.type`
- Бизнес-messages: только раздел сообщений
- Профиль бизнеса: действия «написать», «маршрут», «позвонить», «сайт», «сохранить»

---

## Запрещённые действия

```
❌ Добавлять вкладку «Сообщения» в таб-бар
❌ Создание Близза через «+ / Что создать?»
❌ Создание контента на карте
❌ Смешивать бизнес-контент с личной лентой
❌ Использовать user.isBusiness
❌ Отдельные CommentsScreen / ShareScreen (если есть bottom sheet)
❌ Кнопка «Обновить» на Главной
❌ «Предложения рядом» как случайный блок в ленте
❌ Фейковые данные, случайные градиенты, декоративные блоки
❌ Несогласованные функции
❌ Передавать userId с клиента на backend
❌ window.* без Platform.OS проверки
❌ SVG фильтры (feTurbulence, feGaussianBlur) — не поддерживаются
```

## Grep запрещённых паттернов

```bash
grep -r "isBusiness" mobile/src/
grep -r "CommentsScreen" mobile/src/navigation/
grep -r "Сообщения" mobile/src/navigation/MainTabs.tsx
grep -r "Обновить" mobile/src/screens/home/
```

---

## Agents

| Agent | Когда использовать |
|-------|-------------------|
| `ux-flow-architect` | Перед любым новым экраном |
| `mobile-ui-designer` | После согласования логики |
| `react-native-ui-implementer` | После согласования визуала |
| `design-system-guardian` | После написания кода |
| `visual-qa-reviewer` | После реализации |
| `accessibility-auditor` | После visual QA |
| `blizz-product-guardian` | При любых сомнениях в продукте |
| `expo-build-checker` | После любых изменений |

## Skills

| Skill | Команда |
|-------|---------|
| Логика нового экрана | `/blizz-screen-flow [экран]` |
| Редизайн экрана | `/blizz-mobile-redesign [экран]` |
| Перенос из Figma | `/figma-to-blizz-screen` |
| Expo polish | `/expo-ui-polish` |
| Визуальная регрессия | `/visual-regression-check` |
| Безопасное изменение | `/blizz-safe-code-change` |
| Финальная проверка | `/blizz-final-check` |
