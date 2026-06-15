# Близз — Визуальная система (v1.0)

> Главный гайд. Синтез треков 01-04. Не менять код по нему без отдельного согласованного визуального прохода.
> Этот документ — single source of truth для визуала Близза. Содержит финальный выбор направления, токены, каталог компонентов, рекомендации по иконкам и app icon, ссылки на мокапы.

---

## Executive summary

1. **Направление визуала:** «Editorial Blue» — спокойный глубокий синий + soft blue + warm off-white. Это продолжение текущей палитры (`#0B3D99`), но с доведённой до системы типографикой, тёмной темой, состояниями и компонентным слоем.
2. **Иконография:** переход на **Phosphor** через `react-native-svg`, единая сетка 24×24, stroke 1.75pt, fill для active. ASCII-глифы выводятся из кода.
3. **Палитра:** две темы (light + dark), 7 семантических групп (brand, surface, text, border, status, content, control), все на raw-токенах.
4. **Типографика:** шкала из 9 уровней на Inter, 4pt grid spacing, шкала radius 0-32 + pill, 4 уровня tinted shadows, 5 motion-токенов.
5. **App icon:** монограмма «Б» в незакрытом кольце (знак Близза = сторис = кольцо), primary синий на белом, толстая обводка.
6. **Компонентный слой:** 15 базовых компонентов + 7 карточек контента, единый BottomSheet, единый TopBar, единый TabBar, skeleton loading вместо spinner.
7. **Мокапы:** 4 самодостаточных HTML в `docs/visual/mocks/` (Главная, Поиск, Карта, Сообщения) — открыть в браузере, встроенные стили.

---

## Coverage matrix

| Раздел гайда | Источник |
|---------------|----------|
| Executive summary | Синтез всех треков |
| Направление визуала | Трек 1 (раздел «Направления визуала») |
| Палитра (raw + semantic) | Трек 3 (раздел «Палитра») |
| Типографика | Трек 3 (раздел «Типографика») |
| Spacing, Radius, Shadow, Motion | Трек 3 (разделы 6-9) |
| Тёмная тема | Трек 3 (раздел «Палитра — Тёмная тема») |
| Accessibility | Трек 3 (раздел «Accessibility») |
| App icon | Трек 1 (раздел «App icon») |
| Wordmark | Трек 1 (раздел «Wordmark») |
| Графический язык | Трек 1 (раздел «Графический язык») |
| Иконки (принципы) | Трек 2 (раздел «Принципы») |
| Иконки (навигация) | Трек 2 (раздел «Навигационные иконки») |
| Иконки (действия) | Трек 2 (раздел «Действия») |
| Иконки (контент) | Трек 2 (раздел «Контент») |
| Иконки (чаты, игры) | Трек 2 (раздел «Чаты и игры») |
| Иконки (состояния) | Трек 2 (раздел «Состояния») |
| Компоненты (каталог) | Трек 4 (раздел «Каталог компонентов») |
| Карточки контента | Трек 4 (раздел «Карточки контента») |
| Состояния экранов | Трек 4 (раздел «Состояния») |
| Референсные макеты | Трек 4 (раздел «Референсные макеты») + mocks/ |
| Acceptance чеклист | Трек 3 (Acceptance) + Трек 4 (Acceptance) + этот гайд |

---

## 1. Направление визуала

### 1.1 Выбор: «Editorial Blue»

Три направления, рассмотренных в `01-identity.md`:

| Направление | Суть | Плюсы | Минусы |
|-------------|------|-------|--------|
| **Editorial Blue** ✅ | Спокойный глубокий синий + soft blue + warm off-white, мягкие тени, 1.5-2px обводки, большие поля | Преемственно к 32.x, работает в светлой и тёмной теме, универсально для РФ-аудитории, консистентно с архитектурой | Не «кричит», может казаться «деловым» для молодёжи |
| Bold Night | Тёмный фон, неон, конические сторис-кольца | TikTok-стиль, вечерний режим, цепляет внимание | Тяжело для текстовых экранов, требует отдельной светлой темы, перегрузка |
| Soft Russian | Бежево-охровый, мягкие тени | Casual, дружелюбный, выделяется | Требует полной переписки палитры, риск несовпадения с «синим брендом» в 32.x |

**Аргументы за Editorial Blue:**

1. **Преемственность.** Текущая палитра (`#0B3D99`, soft-blue `#EAF1FF`, bg `#FAFAF7`) уже в коде и в визуальных проходах 32.1-32.2. Менять её радикально — это пересобирать всё.
2. **Универсальность.** Синяя гамма одинаково подходит для: бизнес-инструментов (Owner Dashboard), личных историй (Близзы), карт, поиска.
3. **Двух-темность.** Синяя палитра естественно ложится в обе темы — primary остаётся узнаваемым, surface инвертируется.
4. **РФ-контекст.** Аудитория устала от «ярких клонов TikTok». Спокойный синий читается как «свой, не глобальный».
5. **Архитектурная совместимость.** В `theme.ts` уже есть primary. Перевод на семантические токены — прямолинейный, без переписывания 50 файлов.

**Когда имеет смысл пересмотреть:** если бренд-стратегия сдвинется к молодёжной аудитории 16-22, и метрики покажут, что retention падает из-за «скучного» визуала. Тогда переход в Bold Night (или гибрид Editorial Blue + неоновые акценты).

---

## 2. Палитра

### 2.1 Светлая тема (light)

#### Brand

| Токен | HEX | HSL | Назначение |
|-------|-----|-----|------------|
| `brand.primary` | `#0B3D99` | (217, 85%, 32%) | Брендовый синий, основной CTA, активный таб |
| `brand.primaryHover` | `#0F4FBF` | (217, 87%, 40%) | Hover primary |
| `brand.primaryPressed` | `#0A3587` | (217, 86%, 27%) | Pressed primary |
| `brand.primarySoft` | `#EAF1FF` | (217, 100%, 95%) | Подложка soft primary |
| `brand.primarySoftHover` | `#D5E2FB` | (217, 90%, 91%) | Hover soft |
| `brand.primaryOn` | `#FFFFFF` | | Текст/иконка НА primary |
| `brand.accent` | `#1B5BD9` | (217, 75%, 48%) | Ссылки, не-CTA акценты |

#### Surface

| Токен | HEX | Назначение |
|-------|-----|------------|
| `surface.bg` | `#FAFAF7` | Базовый фон экрана |
| `surface.surface` | `#FFFFFF` | Карточки, sheet, modal |
| `surface.surfaceElevated` | `#FFFFFF` + shadow md | Поднятые карточки, top-bar |
| `surface.surfaceMuted` | `#F4F6F9` | Muted-фон (1 шаг от base) |
| `surface.overlay` | `rgba(16, 24, 40, 0.5)` | Затемнение под modal |

#### Text

| Токен | HEX | Назначение |
|-------|-----|------------|
| `text.primary` | `#101828` | Заголовки, основной текст |
| `text.secondary` | `#667085` | Подписи, captions, мета |
| `text.muted` | `#98A2B3` | Отключённые, плейсхолдеры |
| `text.inverse` | `#FFFFFF` | Текст на тёмном/primary |
| `text.onPrimary` | `#FFFFFF` | (алиас) |
| `text.link` | `#1B5BD9` | Ссылки |

#### Border

| Токен | HEX | Назначение |
|-------|-----|------------|
| `border.default` | `#D9E3F2` | Базовая граница |
| `border.strong` | `#B8C7DD` | Выделенная |
| `border.subtle` | `#EEF2F8` | Почти-невидимая |
| `border.focus` | `#0B3D99` | Focus ring |

#### Status

| Токен | HEX | Soft вариант | Text вариант |
|-------|-----|--------------|--------------|
| `status.success` | `#12B76A` | `#D1FADF` | `#027A48` |
| `status.warning` | `#F79009` | `#FEF0C7` | `#B54708` |
| `status.danger` | `#D92D20` | `#FEE4E2` | `#B42318` |
| `status.info` | `#0B3D99` (= brand.primary) | `#EAF1FF` | `#0B3D99` |

#### Content (иконки и индикаторы)

| Токен | HEX | Назначение |
|-------|-----|------------|
| `content.like` | `#E11D48` | Лайк (active) |
| `content.comment` | `#475467` | Комментарий |
| `content.share` | `#475467` | Шеринг |
| `content.save` | `#0B3D99` | Save (active) |
| `content.location` | `#0B3D99` | Геометка |
| `content.story` | `#E48A3F` | Сторис (Близз) |
| `content.offer` | `#12B76A` | Офер |
| `content.business` | `#0B3D99` | Бизнес |
| `content.unread` | `#D92D20` | Непрочитанное |

#### Control (состояния кнопок)

| Токен | HEX |
|-------|-----|
| `control.bg` | `#FFFFFF` |
| `control.bgHover` | `#F4F6F9` |
| `control.bgPressed` | `#EEF2F8` |
| `control.bgDisabled` | `#F4F6F9` |
| `control.textDisabled` | `#B8C7DD` |

### 2.2 Тёмная тема (dark)

#### Brand

| Токен | HEX |
|-------|-----|
| `brand.primary` | `#3D6CFF` |
| `brand.primaryHover` | `#5A85FF` |
| `brand.primaryPressed` | `#2D58E0` |
| `brand.primarySoft` | `#1A2342` |
| `brand.primarySoftHover` | `#22305A` |
| `brand.primaryOn` | `#FFFFFF` |
| `brand.accent` | `#7DA4FF` |

#### Surface

| Токен | HEX |
|-------|-----|
| `surface.bg` | `#0B0F1A` |
| `surface.surface` | `#15192C` |
| `surface.surfaceElevated` | `#1F2540` |
| `surface.surfaceMuted` | `#0E1220` |
| `surface.overlay` | `rgba(0, 0, 0, 0.7)` |

#### Text

| Токен | HEX |
|-------|-----|
| `text.primary` | `#F5F7FF` |
| `text.secondary` | `#A4B0D6` |
| `text.muted` | `#6F7A99` |
| `text.inverse` | `#101828` |
| `text.link` | `#7DA4FF` |

#### Border

| Токен | HEX |
|-------|-----|
| `border.default` | `#1F2540` |
| `border.strong` | `#2D3556` |
| `border.subtle` | `#15192C` |
| `border.focus` | `#5A85FF` |

#### Status (dark)

| | solid | soft | text |
|---|---|---|---|
| success | `#32D583` | `#0B2E1F` | `#6CE9A6` |
| warning | `#FDB022` | `#3A2A0A` | `#FEDF89` |
| danger | `#F97066` | `#3A1815` | `#FDA29B` |

#### Content (dark)

| | HEX |
|---|---|
| `content.like` | `#FB7185` |
| `content.comment` | `#A4B0D6` |
| `content.share` | `#A4B0D6` |
| `content.save` | `#7DA4FF` |
| `content.location` | `#7DA4FF` |
| `content.story` | `#FFA968` |
| `content.offer` | `#32D583` |
| `content.business` | `#7DA4FF` |
| `content.unread` | `#F97066` |

### 2.3 WCAG-аудит

| Пара | Контраст | Статус |
|------|----------|--------|
| `text.primary` на `surface.bg` (light) | 16.4:1 | AAA |
| `text.secondary` на `surface.bg` (light) | 5.3:1 | AA |
| `brand.primary` на `surface.surface` (light) | 8.6:1 | AAA |
| `status.danger` на `surface.surface` (light) | 4.6:1 | AA |
| `text.primary` на `surface.bg` (dark) | 16.8:1 | AAA |
| `text.secondary` на `surface.bg` (dark) | 7.2:1 | AAA |
| `brand.primary` на `surface.bg` (dark) | 5.9:1 | AA |

**Минимальный риск:** `text.secondary` на `surface.surface` в light — 4.8:1 (пограничный AA). Решение: использовать только для `≥14px` и `weight ≥500`.

---

## 3. Типографика

**Шрифт:** Inter (open-source, MIT, кириллица).
**Fallback:** `-apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif`.

| Уровень | size / line-height | weight | letter-spacing | Использование |
|---------|--------------------|--------|----------------|---------------|
| `display` | 34/40 | 800 | -0.8 | Hero на лендинге, splash |
| `h1` | 28/34 | 800 | -0.4 | Заголовок экрана |
| `h2` | 24/30 | 800 | -0.3 | Заголовок секции |
| `h3` | 20/26 | 800 | -0.2 | Заголовок карточки |
| `h4` | 18/24 | 700 | -0.1 | Подзаголовок |
| `body` | 16/22 | 500 | 0 | Основной текст |
| `bodySmall` | 14/20 | 500 | 0 | Подписи, мета |
| `caption` | 12/16 | 600 | 0.1 | Captions, время, лайки |
| `overline` | 11/14 | 800 | 0.8 | Section labels |

---

## 4. Spacing & Layout

| Токен | px | Назначение |
|-------|-----|------------|
| `space.1` | 4 | Gap в одной строке (icon+text) |
| `space.2` | 8 | Gap label-value |
| `space.3` | 12 | Gap между элементами строки |
| `space.4` | 16 | **Стандартный screen padding** |
| `space.5` | 20 | Padding секции |
| `space.6` | 24 | Block padding |
| `space.8` | 32 | Разрыв между крупными блоками |
| `space.10` | 40 | Hero-разрыв |
| `space.14` | 56 | Огромный разрыв |

---

## 5. Радиусы

| Токен | px | Назначение |
|-------|-----|------------|
| `radius.none` | 0 | Edge-to-edge bars |
| `radius.xs` | 6 | Tag, badge |
| `radius.sm` | 12 | Input, small card |
| `radius.md` | 16 | Card (default) |
| `radius.lg` | 20 | Большая карточка, sheet handle |
| `radius.xl` | 24 | Post card, story ring (inner) |
| `radius.2xl` | 28 | Bottom sheet top |
| `radius.3xl` | 32 | Big sheets |
| `radius.pill` | 9999 | Tab pill, button (full) |

---

## 6. Тени (tinted, брендовый синий)

| Уровень | Тень |
|---------|------|
| `shadow.none` | `none` |
| `shadow.sm` | `0 1px 2px rgba(11, 61, 153, 0.06), 0 1px 3px rgba(11, 61, 153, 0.04)` |
| `shadow.md` | `0 4px 8px rgba(11, 61, 153, 0.08), 0 2px 4px rgba(11, 61, 153, 0.04)` |
| `shadow.lg` | `0 24px 48px rgba(11, 61, 153, 0.16), 0 8px 16px rgba(11, 61, 153, 0.08)` |
| `shadow.xl` | `0 32px 64px rgba(11, 61, 153, 0.20)` |

В dark theme тени заменяются на тонкую `border.subtle` обводку.

---

## 7. Motion

| Токен | ms | Назначение |
|-------|-----|------------|
| `motion.instant` | 100 | Hover, icon swap |
| `motion.fast` | 180 | Button press, tab switch |
| `motion.normal` | 240 | Sheet open, modal, page transition |
| `motion.slow` | 360 | Stagger, hero |
| `motion.slower` | 500 | Page intro |

Кривые: `standard` (0.4, 0, 0.2, 1), `decelerate` (0, 0, 0.2, 1), `accelerate` (0.4, 0, 1, 1), `sharp` (0.4, 0, 0.6, 1).

**Reduced motion:** `motionReduced = instant` (0ms), только opacity transitions, без scale/rotate.

---

## 8. App icon

### 8.1 Концепция: «Близз-кольцо»

**Главная идея:** Близз = сторис = кольцо. Логотип-символ = незакрытое кольцо с монограммой «Б» в центре.

**Структура:**
- Внешний круг: радиус 100 (от 1024), stroke 28, цвет `brand.primary`.
- Внутренний «Б» (capital, sans-serif, weight 800): 60% высоты icon, цвет `brand.primary`.
- Фон: `surface.surface` (белый).

**Размеры:**

| Платформа | Размер | Специфика |
|-----------|--------|-----------|
| iOS App Store | 1024×1024 master | Без alpha, без скруглений (Apple сама маскирует) |
| iOS spotlight | 120×120 | Те же правила |
| iOS notification | 60×60 | В的白ом круге |
| Android adaptive — foreground | 432×432 | Внутри safe zone 66dp |
| Android adaptive — background | 432×432 | Цветной фон |
| Android legacy | 192×192 | Полная иконка |
| PWA | 192×192, 512×512 | Скруглённые углы вручную |
| Maskable PWA | 410×410 | Safe zone 80% центра |

**Рекомендация по фону Android:** фон = `brand.primary` (синий), foreground — кольцо + «Б» в `surface.surface` (белый). Это даёт заметный синий квадрат в Pixel launcher.

### 8.2 Словесный знак (wordmark)

**Основной:** «Близз», italic, weight 800, sans-serif (Inter), tracking -0.02em.
**В шапке приложения:** `display: 27/27, italic, brand.primary`.
**В профиле/документах:** `h2: 24/30, italic, text.primary`.

**Альтернатива для компактных мест:** «Б» в круге (для пушей, favicon 16px).

### 8.3 Acceptance для app icon

- [ ] Узнаваемость при 60×60 px
- [ ] Работает в monochrome (для будущих тем)
- [ ] Не сливается с конкурентами (VK, OK, Telegram, Yappy)
- [ ] Кольцо видно и при 16×16
- [ ] Нет тонких линий, которые теряются в рендере
- [ ] Safe zone для Android adaptive (66dp)
- [ ] Light + dark версии (если будет dark icon)
- [ ] Нет alpha на iOS master
- [ ] Учтены требования App Store / Google Play

---

## 9. Иконки

**Библиотека:** **Phosphor** (MIT, 9000+ иконок, 6 начертаний).
**Формат:** SVG-компонент через `react-native-svg`.
**Сетка:** 24×24, stroke 1.75pt, round-cap/join.
**Active state:** fill (Phosphor `fill` weight) + soft-blue подложка 34×34.

**Семейства иконок (всего 35+ штук):**

1. **Навигация (5):** Home, Video, Plus (центральный), Map, Profile.
2. **Действия (15):** Heart, HeartFill, CommentBubble, ShareArrowUp, BookmarkSimple, BookmarkSimpleFill, MapPin, DotsHorizontal, PersonAdd, MessageCircle, Bell, BellFill, MagnifyingGlass, PaperPlaneTilt, X, CaretLeft, Plus.
3. **Контент на карте (5):** ImageStack (пост), PlayCircle (видео), RingOpen (сторис), Briefcase (бизнес), Tag (предложение).
4. **Чат/игры (5):** ImageStack, RingOpen, Cards, Shell, TrophyOutline.
5. **Состояния (5):** Spinner, InboxEmpty, AlertTriangle, CheckCircle, InfoCircle, WifiSlash.

---

## 10. Каталог компонентов

### 10.1 Базовые (15)

`Button`, `Input`, `Card`, `Avatar`, `Tabs`, `Chip`, `BottomSheet`, `Modal`, `Toast`, `ListItem`, `Divider`, `EmptyState`, `Skeleton`, `StoryRing`, `Loading`.

### 10.2 Карточки контента (7)

`PostCard`, `StoryCard`, `VideoCard`, `OfferCard`, `ChatBubble`, `MapPin`, `SearchResultRow`.

### 10.3 Навигация (3)

`BottomTabs` (5 кнопок + центральный +), `TopBar` (back + title + actions), `StickyBottomAction`.

Полные спецификации — в `04-screens.md`.

---

## 11. Референсные макеты

ASCII-схемы 5 экранов (Главная, Поиск, Карта, Сообщения, Профиль) — в `04-screens.md` §5.

**Живые HTML-мокапы в браузере:**
- `docs/visual/mocks/01-home.html` — Главная (светлая тема, Editorial Blue)
- `docs/visual/mocks/02-search.html` — Поиск (светлая тема, Editorial Blue)
- `docs/visual/mocks/03-map.html` — Карта (светлая тема, Editorial Blue)
- `docs/visual/mocks/04-messages.html` — Сообщения (светлая тема, Editorial Blue)
- `docs/visual/mocks/05-dark.html` — Главная (тёмная тема, Editorial Blue)

Каждый файл самодостаточен, встроенные стили, открыть двойным кликом.

---

## 12. Acceptance-чеклист для разработчика (15 пунктов)

- [ ] **1. Палитра:** все 7 семантических групп (brand, surface, text, border, status, content, control) реализованы в `tokens/colors.ts`. Raw-токены определены, semantic проксируют.
- [ ] **2. Темы:** ThemeProvider в `AppRoot.tsx`, переключение через `useColorScheme()`, persistence в `AsyncStorage` (опционально).
- [ ] **3. Типографика:** шкала из 9 уровней в `tokens/typography.ts`, Inter подключён через `@expo-google-fonts/inter`.
- [ ] **4. Spacing/Radius/Shadow/Motion:** все шкалы в `tokens/`, не в коде компонентов.
- [ ] **5. Иконки:** Phosphor подключён, `react-native-svg` подключён, баррель-экспорт в `shared/ui/icons/`. Все ASCII-глифы и emoji заменены на компоненты.
- [ ] **6. Компоненты:** 15 базовых в `shared/ui/components/`, 7 карточек контента в `shared/ui/cards/`. Никаких inline StyleSheet в screen-файлах для этих компонентов.
- [ ] **7. Навигация:** BottomTabs (5 + центральный +) реализован как `<BottomTabs>` компонент, TopBar — `<TopBar>`. Старые ad-hoc в screen-файлах заменены.
- [ ] **8. Состояния экранов:** для 5 ключевых экранов (Главная, Поиск, Карта, Сообщения, Профиль) реализованы loading/empty/error/noAccess/sessionExpired.
- [ ] **9. Skeleton:** Skeleton компонент реализован, используется на уровне экранов вместо `<ActivityIndicator>`. Spinner остался только на уровне кнопок.
- [ ] **10. Bottom sheet:** единый `<BottomSheet>` компонент, переиспользуется для Comments, Share, Object details, Game picker, New group.
- [ ] **11. Toast:** `useToast()` hook + `<ToastHost>` в AppRoot, заменяет `setInfo('...')` паттерн.
- [ ] **12. WCAG AA:** автоматический чек в CI (axe-core или jest-axe) для всех экранов.
- [ ] **13. Touch target:** `useTouchTarget()` хук или Storybook-обёртка проверяет ≥44pt на всех pressable.
- [ ] **14. App icon:** сгенерированы мастеры для iOS (1024×1024) и Android (432×432 adaptive). Light + dark варианты.
- [ ] **15. Документация:** этот файл и треки обновлены после реализации, `theme.ts` заменён на новую структуру.

---

## 13. Открытые вопросы (для пользователя)

1. **Inter подключаем или оставляем нативные (SF Pro / Roboto)?** Inter — консистентность, +200KB. Нативные — без затрат, но разные платформы.
2. **Dark theme сразу или во второй итерации?** Сейчас 1.5x времени. Рекомендую сразу — это серьёзный + к retention.
3. **Skeleton states нужны сразу?** Без них — спиннер на loading. С ними — выглядит профессиональнее, +2-3 дня.
4. **Phosphor подключаем или рисуем свои SVG?** Phosphor — быстро и качественно. Custom — дороже, но полный контроль.
5. **Toast нужен?** Сейчас ошибки inline. Toast — стандарт для «кратковременных» сообщений.
6. **Post grid 3-колонки (как у Instagram) или 2-колонки (крупнее визуал)?** 3 экономит место, 2 крупнее.
7. **Карусель для media — горизонтальный swipe или плитка с переключением?** Сейчас статическая + точки. Нужен ли полноценный carousel?
8. **Принимаем 4-pt сетку для spacing?** Альтернатива — 8-pt.
9. **Tinted shadows (с брендовым оттенком) — оставляем или чёрные?** Tinted выглядит «родным», но требует поддержки в RN.
10. **Maskable PWA нужен?** Если планируется PWA-установка — да. Иначе — iOS + Android мастеров достаточно.

---

## 14. Source index

| Файл | Размер | Назначение |
|------|--------|------------|
| `docs/visual/00-visual-system.md` (этот) | ~28 KB | Главный гайд, single source of truth |
| `docs/visual/01-identity.md` | 46 KB | Трек 1: идентичность бренда и app icon |
| `docs/visual/02-iconography.md` | 14 KB | Трек 2: иконография (навигация, действия, контент) |
| `docs/visual/03-tokens.md` | 16 KB | Трек 3: палитра, типографика, токены |
| `docs/visual/04-screens.md` | 20 KB | Трек 4: компоненты и референсные экраны |
| `docs/visual/mocks/01-home.html` | ~12 KB | HTML-мокап Главной (light) |
| `docs/visual/mocks/02-search.html` | ~10 KB | HTML-мокап Поиска (light) |
| `docs/visual/mocks/03-map.html` | ~12 KB | HTML-мокап Карты (light) |
| `docs/visual/mocks/04-messages.html` | ~10 KB | HTML-мокап Сообщений (light) |
| `docs/visual/mocks/05-dark.html` | ~12 KB | HTML-мокап Главной (dark theme) |
| `docs/page-33-visual-variants-proposal.html` | ~30 KB | Предыдущий proposal (3 направления) |

---

## 15. Следующие шаги

После твоего ОК это станет основой для согласованного визуального прохода. Рекомендую такой план:

1. **Согласовать направление и токены** (ты уже видишь мокапы, можешь сравнить с `page-33-visual-variants-proposal.html`).
2. **Подключить зависимости:** `react-native-svg`, `@expo-google-fonts/inter`, `@phosphor-icons/react-native` (или phosphor-rn).
3. **Заменить `theme.ts`** на новую токен-систему (backward-incompatible, но в проекте пока не было релизов с публичными токенами).
4. **Реализовать компонентный слой** (15 базовых + 7 карточек) в `shared/ui/`.
5. **Поэкранный перевод:** 5 ключевых экранов (Главная, Поиск, Карта, Сообщения, Профиль).
6. **App icon:** мастеры для iOS и Android, интеграция в `app.json`.
7. **Verification:** smoke-test, typecheck, web-export, светлый + тёмный режим, accessibility-чек.
8. **Документация:** обновить `README.md`, добавить `docs/page-33-visual-system.md` как отдельный visual pass.

Если по ходу всплывут новые вопросы — это нормально, допишу в `00-visual-system.md`.
