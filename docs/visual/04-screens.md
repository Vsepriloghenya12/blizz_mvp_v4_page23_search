# Трек 4 — Компоненты и референсные экраны

> Research-документ. Не менять код по нему. Используется как основа для последующих визуальных проходов.
> Текущее состояние: в `mobile/src/screens/*` компоненты собраны ad-hoc в каждом screen-файле, нет общего UI-слоя. Каждая карточка, кнопка, инпут определены inline. Это research для будущего рефакторинга в `shared/ui/components`.

---

## 1. Каталог компонентов

### 1.1 Button

**Варианты:** `primary` / `secondary` / `ghost` / `danger` / `soft`.
**Размеры:** `sm` (h=36), `md` (h=44), `lg` (h=52).
**Состояния:** `default`, `hover`, `pressed`, `disabled`, `loading`.
**Props:**
- `label: string`
- `onPress: () => void`
- `variant?: ButtonVariant`
- `size?: ButtonSize`
- `iconLeft?: ReactNode` (24×24)
- `iconRight?: ReactNode` (24×24)
- `loading?: boolean` (показывает spinner вместо iconLeft)
- `fullWidth?: boolean`
- `disabled?: boolean`

**Визуал:**
- primary: bg `brand.primary`, text `brand.primaryOn`, radius `pill`.
- secondary: bg `surface.surface`, border `border.strong`, text `text.primary`.
- ghost: bg transparent, text `text.primary`, hover bg `control.bgHover`.
- danger: bg `status.danger`, text `#FFFFFF`.
- soft: bg `brand.primarySoft`, text `brand.primary`.

**Текущее состояние в коде:** нет Button-компонента. Каждый экран использует `<Pressable><Text>...</Text></Pressable>`. Это разнобой: в `AuthScreen.tsx` — один стиль, в `CreatePostScreen.tsx` — другой.

### 1.2 Input

**Варианты:** `text` / `multiline` / `password` / `search`.
**Состояния:** `default`, `focused`, `error`, `disabled`, `withValue`.
**Props:**
- `value: string`
- `onChangeText: (v: string) => void`
- `placeholder?: string`
- `label?: string`
- `error?: string`
- `helperText?: string`
- `iconLeft?: ReactNode`
- `iconRight?: ReactNode`
- `maxLength?: number`
- `multiline?: boolean`
- `secureTextEntry?: boolean`

**Визуал:**
- Высота: 48 (md), 56 (lg, для формы регистрации).
- Border: 1px `border.default`, focus → 2px `border.focus` (с offset 1px).
- Error: border `status.danger`, helperText `status.dangerText` под полем.
- Radius: `radius.md` (12).
- Padding: 12 horizontal, icon 16 offset.

**Текущее состояние:** `<TextInput>` используется напрямую. В `SearchScreen.tsx:197-204` — без border, без focus-индикатора, что не соответствует нашей системе.

### 1.3 Card

**Варианты:** `base` / `media` / `action` / `elevated` / `outlined`.
**Props:**
- `onPress?: () => void` (если есть — становится Pressable)
- `padding?: 12 | 16 | 20`
- `children: ReactNode`

**Визуал:**
- base: bg `surface.surface`, radius `radius.xl` (24), padding 16.
- media: image на всю ширину сверху (border-top-radius), content снизу.
- elevated: + shadow `shadow.sm`.
- outlined: вместо фона — `border.default` 1px.

**Все текущие карточки в коде** (`FeedPostCard`, `OfferCard`, `MapObjectRow`, `SearchResultRow`, `SettingsActionRow`) — это «ad-hoc» Card, каждая со своими размерами и padding. Их нужно привести к одному компоненту.

### 1.4 Avatar

**Размеры:** 24, 32, 40, 56, 80, 120.
**Варианты:** `image` (есть URL), `initials` (есть name, первая буква), `icon` (placeholder).
**Модификаторы:** `withRing` (для сторис, 3-px градиентное кольцо), `withOnline` (зелёная точка 8×8 в правом нижнем углу).
**Props:**
- `uri?: string | null`
- `name: string` (для initials)
- `size?: 24 | 32 | 40 | 56 | 80 | 120`
- `withRing?: boolean`
- `withOnline?: boolean`
- `storyRingType?: 'default' | 'unseen' | 'closeFriends'`

**Текущее состояние:** в `HomeScreen.tsx:88-94` — два варианта (image vs circle с буквой) inline. В `StoryViewer.tsx:462-464` — круг с буквой. В `MessagesScreen.tsx` — аналогично. Все ad-hoc.

### 1.5 Tabs

**Варианты:** `pill` (Главная/Видео — bottom nav), `segment` (Лента/Витрина), `underlined` (вторичные).
**Props:**
- `tabs: Array<{ key: string; label: string; badge?: number }>`
- `activeKey: string`
- `onChange: (key: string) => void`
- `variant?: 'pill' | 'segment' | 'underlined'`

**Визуал:**
- segment (Лента/Витрина): два блока в одном rounded container, активный залит `brand.primary`. См. `HomeScreen.tsx:1239-1266`. ✅
- pill: горизонтальный scroll, каждая таблетка с border, активная — bg `brand.primary` text `brand.primaryOn`. См. `SearchScreen.tsx:212-218` и `MapScreen.tsx:134-145`. ✅
- underlined: текст с нижним border, активный — `brand.primary` underline.

### 1.6 Chip / Tag

**Варианты:** `default`, `selected`, `removable`, `dotted`.
**Props:**
- `label: string`
- `onPress?: () => void`
- `onRemove?: () => void`
- `selected?: boolean`
- `iconLeft?: ReactNode`

**Визуал:**
- bg `surface.surfaceMuted`, text `text.secondary`, radius `pill`, padding 6 vertical, 12 horizontal.
- selected: bg `brand.primary`, text `brand.primaryOn`.
- removable: + иконка × справа.

### 1.7 Bottom Sheet

**Анатомия:** handle (4×42, вверху по центру), header (title + close), body (scroll), footer (опционально).
**Размеры:** `sm` (40% экрана), `md` (60%), `lg` (85%), `full` (100% с safe area).
**Состояния:** `closed`, `opening`, `open`, `closing`.
**Props:**
- `visible: boolean`
- `onClose: () => void`
- `title?: string`
- `size?: 'sm' | 'md' | 'lg' | 'full'`
- `children: ReactNode`
- `footer?: ReactNode`
- `dismissable?: boolean` (тап вне закрывает)

**Текущее состояние:** Bottom sheet реализован вручную через `<Modal animationType="slide">`:
- `HomeScreen.tsx:239-317` (Comments)
- `HomeScreen.tsx:333-416` (Share)
- `HomeScreen.tsx:418-519` (Story viewer — но это уже full screen)
- `MapScreen.tsx:258-315` (Object details)

Все эти реализации разные. Нужно сделать **один** `<BottomSheet>` с контентом и props.

### 1.8 Modal

**Анатомия:** backdrop (полупрозрачный), центрированная карточка, header (title + close), body, footer (actions).
**Размеры:** `sm` (320), `md` (480), `lg` (640).
**Props:**
- `visible: boolean`
- `onClose: () => void`
- `title?: string`
- `size?: 'sm' | 'md' | 'lg'`
- `dismissable?: boolean`
- `children: ReactNode`
- `footer?: ReactNode`

### 1.9 Toast / Snackbar

**Анатомия:** rounded карточка внизу экрана, icon + label + (опционально) action.
**Варианты:** `info`, `success`, `warning`, `error`.
**Длительность:** 4s default, можно override.
**API:** `useToast()` hook + `<ToastHost>` в AppRoot.

**Текущее состояние:** нет. В коде ошибки и нотисы показываются inline (например, `setInfo('Не удалось...')` в `HomeScreen.tsx`). Это заменимо на toast.

### 1.10 ListItem

**Анатомия:** leading (icon/avatar), title, subtitle (опционально), trailing (value/chevron/action), divider (опционально).
**Props:**
- `leading?: ReactNode`
- `title: string`
- `subtitle?: string`
- `trailing?: ReactNode` (string, ReactNode или chevron)
- `onPress?: () => void`
- `divider?: boolean`

**Визуал:** padding 14 vertical, 16 horizontal, leading 40×40, gap 12, title `body`, subtitle `bodySmall text.secondary`.

**Текущее состояние:** в `SettingsActionsScreen.tsx` — реализован ad-hoc. В `ProfileMenuScreen.tsx` — аналогично. В `MessagesScreen.tsx` (список чатов) — собственный формат.

### 1.11 Divider

**Варианты:** `default` (1px `border.subtle`), `strong` (1px `border.default`), `withText` (с лейблом по центру).
**Props:**
- `variant?: 'default' | 'strong'`
- `label?: string`

### 1.12 Empty State

**Анатомия:** иллюстрация 160×160 в центре, title (h3), description (body text.secondary), CTA-кнопка.
**Props:**
- `illustration: ReactNode`
- `title: string`
- `description?: string`
- `actionLabel?: string`
- `onAction?: () => void`

**Текущее состояние:** В `HomeScreen.tsx:1037-1046`, `SearchScreen.tsx:240`, `MapScreen.tsx:183-187`, `MessagesScreen.tsx` (есть «Пока нет диалогов» inline). Все разные.

### 1.13 Loading Skeleton

**Анатомия:** placeholder-блоки, повторяющие форму контента. Цвет: `surface.surfaceMuted` → `surface.surface` (анимация shimmer).
**Props:**
- `width?: number | string`
- `height?: number | string`
- `radius?: keyof typeof radius`

**Текущее состояние:** не используется. Везде `<ActivityIndicator>`. По правилам `scaffold.md` на уровне экрана — skeleton. Это первый кандидат на рефактор.

### 1.14 Skeleton для feed

**Анатомия:** несколько Skeleton-блоков в форме карточки поста (avatar circle, text-line, media block, action row).

### 1.15 Story Ring

**Анатомия:** внешний круг (3px, цвет зависит от типа: gradient для unseen, solid `text.muted` для seen, dashed для closeFriends), внутренний — аватар 56×56.
**Варианты:** `default`, `unseen`, `seen`, `closeFriends`, `self` (с "+" внутри).

**Текущее состояние:** в `HomeScreen.tsx:1001-1014` — `storyRing` + `storyRingUnseen` styles. В `SearchScreen.tsx` — нет сторисов. В `StoryViewer.tsx:454-456` — progress bar (линейный, не кольцо).

---

## 2. Карточки контента

### 2.1 PostCard

**Анатомия:**
```
┌──────────────────────────────────────┐
│ [Avatar] Имя              ⌖ Локация ⋯│  ← header (h: ~60)
├──────────────────────────────────────┤
│                                       │
│           [Media Block]               │  ← media (1:1 / 4:5 / 16:9)
│                                       │
├──────────────────────────────────────┤
│ Текст поста (maxLines=3)              │  ← text (h: variable)
├──────────────────────────────────────┤
│ ♥ 24  ◌ 3  ⌁ Поделиться          ▢   │  ← actions (h: 44)
└──────────────────────────────────────┘
```

**Спецификация:**
- Header: avatar 40×40, name `body` weight 700, location `caption` text.secondary, more button (3 dots) 32×32 trailing.
- Media: aspect ratio из `post.media[0].aspectRatio`, fallback 4:5. Radius 0 (edge-to-edge внутри карточки).
- Text: `body`, maxLines 3, ellipsize. Раскрывается на `PostDetailScreen`.
- Actions: 4 иконки (like, comment, share, save) в ряд, count рядом с like/comment. Save выровнен вправо.
- Carousel dots: при media.length > 1 — точки внизу медиа.

**Текущее состояние:** в `HomeScreen.tsx:79-157` — `FeedPostCard` определён inline, в `ShowcaseFeedItem` — переиспользуется. Логика правильная, визуал — нужно подтянуть к системе.

### 2.2 StoryCard (для горизонтальной строки в Home)

**Анатомия:**
```
   ╭───╮
   │ Б │     ← 60×60 ring
   ╰───╯
   Аня      ← caption 2 строки max
```

**Спецификация:**
- Ring outer 60×60, 2.5-3px. Inner avatar 54×54.
- Caption: `caption` 10.5px, max 2 строки, ellipsize.
- Tap → открывает story viewer.

**Текущее состояние:** `HomeScreen.tsx:998-1013` — реализован. Нужно: вынести в `StoryCard` компонент.

### 2.3 VideoCard

**Анатомия (для grid):**
```
┌────────────┐
│            │
│  [video]   │  ← 1:1 или 9:16
│  ▶ 1:23    │  ← duration в углу
│            │
└────────────┘
  Имя автора
```

**Спецификация:**
- Cover image, поверх — play icon если mediaType=video, duration в bottom-left.
- Caption под карточкой: 1 строка, author name.

**Анатомия (для feed):** как PostCard, но media=video player, без sound indicator.

### 2.4 OfferCard (витрина)

**Анатомия:**
```
┌──────────────────────────────────────┐
│  [Cover Image 190h]            [Save] │  ← media (190h, full width)
├──────────────────────────────────────┤
│ [АКЦИЯ]                                │  ← type label (overline)
│ Скидка 20% на первый визит            │  ← title (h3)
│ Кафе "Утро" · @utro_cafe              │  ← business
│ ⌖ Москва, ул. Тверская 12            │  ← location
│ До 31.12.2024                         │  ← expiry
├──────────────────────────────────────┤
│ Маршрут          Поделиться           │  ← actions
└──────────────────────────────────────┘
```

**Спецификация:**
- Cover 190h, radius top 24.
- Save button — top-right, накладывается на cover с margin.
- Body padding 16, gap 8.
- Type label (АКЦИЯ / ТОВАР / УСЛУГА / СОБЫТИЕ) — overline, primary.
- Title — h3.
- Business name — body small, text.secondary.
- Location, price, expiry — body small, text.secondary.
- Actions — bottom border-top, two text actions.

**Текущее состояние:** `HomeScreen.tsx:180-208` — `OfferCard`. Визуал хороший, нужно вынести в компонент.

### 2.5 ChatBubble

**Анатомия:**
```
  ┌─────────────────────┐
  │ Текст сообщения      │
  │ 12:34 ✓✓             │
  └─────────────────────┘
```

**Спецификация:**
- Исходящее: bg `brand.primary`, text `brand.primaryOn`, align right, radius 18 (top-right 4, чтобы прилипало к краю), max-width 75%.
- Входящее: bg `surface.surfaceMuted`, text `text.primary`, align left, radius 18 (top-left 4).
- System message: centered, no bubble, caption text.
- Time: caption 11px, text.secondary или 70% white.
- Status: ✓ (sent) / ✓✓ (read) / ничего для incoming.
- Media: image, video preview, file, etc.
- For game: спец-форма с типом, прогрессом.

**Текущее состояние:** `MessagesScreen.tsx` (chat screen) — реализован ad-hoc. Нужно вынести.

### 2.6 MapPin

**Анатомия:**
```
   ╭─╮
   │P│  ← 32×32 round white circle с цветной обводкой + иконкой типа
   ╰─╯
   ╲│╱
   ▼     ← капля
```

**Спецификация:**
- Outer 32×32 circle, bg `surface.surface`, border 2px `brand.primary` (или цвет типа).
- Inner 16×16 иконка типа контента.
- Tail: 12×8 капля вниз.
- Active state: bg `brand.primary`, иконка внутри `#FFFFFF`.

**Текущее состояние:** `MapScreen.tsx:158-170` — пин-клеймо: P / V / B / Б / ₽ в круге. Минимально, но не соответствует shape language из Трека 2.

### 2.7 SearchResultRow

**Анатомия:**
```
┌────────────────────────────────────────┐
│ ┌──┐  [PEOPLE]                          │
│ │А │  @anya_coffee                      │
│ └──┘  Люди · @anya_coffee               │
└────────────────────────────────────────┘
```

**Спецификация:**
- Leading: avatar 44×44 или icon 28×28 (если нет аватара).
- Type label: overline 11px, primary, uppercase.
- Title: `body` weight 700.
- Subtitle: `bodySmall` text.secondary.
- Chevron: `>` справа.
- Padding 12, bg `surface.surface`, border `border.default`, radius `radius.lg` (20).

**Текущее состояние:** `SearchScreen.tsx:270-284` — `SearchResultRow`. Визуал хороший.

---

## 3. Навигация

### 3.1 Нижние табы

**Анатомия:**
```
┌──────┬──────┬──────┬──────┬──────┐
│  ⌂   │  ▶   │  +   │  ⌖   │  ○   │
│Главная│Видео│      │Карта│Профиль│
└──────┴──────┴──────┴──────┴──────┘
```

**Спецификация:**
- Height: 76 (с safe area bottom).
- 5 табов, равная ширина.
- Active: иконка filled + soft-blue подложка 34×34 radius 17, label `brand.primary`.
- Inactive: иконка outlined, label `text.secondary`.
- Центральный `+`: всегда filled `brand.primary`, белый плюс 30×30, размер 56×56 (на 8px больше), elevated shadow.

**Текущее состояние:** `MainTabs.tsx:1027-1085`. Визуал хороший, нужно выровнять с новой иконографией.

### 3.2 Top-bar экрана

**Анатомия:**
```
┌────────────────────────────────────────┐
│ ←     Заголовок            ⌕ ♢ ✉        │
└────────────────────────────────────────┘
```

**Спецификация:**
- Height: 56 + safe area top.
- Background: `surface.surface` (или transparent при scroll).
- Back button: 40×40, иконка chevron-left 24×24.
- Title: `h3` (18px weight 700) centered или left-aligned при наличии back.
- Actions: иконки 24×24 в круге 36×36.
- Border bottom: 1px `border.subtle` при scroll или elevated.

**Текущее состояние:** в каждом screen — `<View style={styles.header}>` ad-hoc. В `SearchScreen.tsx:185-193` — хороший пример.

### 3.3 Sticky bottom action bar

**Анатомия:**
```
┌────────────────────────────────────────┐
│  [Кнопка действия]    [Кнопка cancel]  │
└────────────────────────────────────────┘
```

**Спецификация:**
- Position: sticky bottom или absolute.
- Background: `surface.surface` + shadow `shadow.lg` сверху.
- Padding: 16 horizontal, 12 vertical, safe area bottom.
- Buttons: full-width или split 50/50.

### 3.4 Навигация внутри модалок

Для bottom sheet — внутренний scroll, header sticky, footer sticky.
Для full screen modal — свой back-кнопка, свой top-bar.

---

## 4. Состояния экранов

По правилам `scaffold.md`: каждый экран должен иметь loading / empty / error / noAccess / sessionExpired.

### 4.1 Главная

| Состояние   | Содержимое |
|-------------|------------|
| loading     | 3 skeleton-карточки постов + skeleton строки сторисов |
| empty feed  | Иллюстрация «нет постов», title «Пока нет публикаций», CTA «Создать пост» |
| empty showcase | Иллюстрация «нет витрины», title «Пока нет публикаций бизнеса» |
| error       | Иллюстрация ошибки, title «Не удалось загрузить ленту», text «Проверьте подключение», CTA «Повторить» |
| noAccess    | Не применимо (главная доступна всегда) |
| sessionExpired | Modal «Сессия истекла», CTA «Войти снова» |

### 4.2 Поиск

| Состояние   | Содержимое |
|-------------|------------|
| loading (initial) | Skeleton-строки недавних поисков |
| empty (нет недавних) | Text «Пока нет недавних поисков» |
| empty (нет результатов) | Иллюстрация «лупа», title «Ничего не найдено», text «Попробуйте другие ключевые слова» |
| error | Text «Не удалось выполнить поиск» + retry |
| sessionExpired | Modal |

### 4.3 Карта

| Состояние   | Содержимое |
|-------------|------------|
| loading | Spinner + «Загружаем объекты» |
| empty | Иллюстрация «карта пуста» + text «Пока нет объектов на карте» |
| error | Text «Не удалось загрузить карту» + retry |
| noAccess (location denied) | Иллюстрация «нет геолокации», text «Разрешите доступ к геопозиции» |
| sessionExpired | Modal |

### 4.4 Сообщения

| Состояние   | Содержимое |
|-------------|------------|
| loading | Skeleton-список чатов |
| empty | Иллюстрация «нет чатов», title «Пока нет диалогов», CTA «Написать» |
| error | Text + retry |
| noAccess | Не применимо |
| sessionExpired | Modal |

### 4.5 Профиль

| Состояние   | Содержимое |
|-------------|------------|
| loading | Skeleton-header + skeleton-tabs |
| empty (нет постов) | Text «Пока нет публикаций» |
| error | Text + retry |
| noAccess (private) | Баннер «Аккаунт закрыт» + кнопка «Подписаться» |
| sessionExpired | Modal |

---

## 5. Референсные макеты

> Здесь — ASCII-схемы ключевых экранов с указанием, какие компоненты использовать. Реальные мокапы — в `docs/visual/mocks/`.

### 5.1 Главная (светлая тема)

```
┌─────────────────────────────────────┐
│ Близз              ⌕  ♢  ✉         │  ← TopBar
├─────────────────────────────────────┤
│  ╭──╮ ╭──╮ ╭──╮ ╭──╮ ╭──╮          │  ← StoryRow
│  │+ │ │А │ │К │ │Д │ │. │          │
│  ╰──╯ ╰──╯ ╰──╯ ╰──╯ ╰──╯          │
│  Ваш  Аня  Кир  Din                 │
├─────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  │  ← HomeTabs (segment)
│  │    Лента    │  │   Витрина   │  │
│  └─────────────┘  └─────────────┘  │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ [Аватар] Аня  ⌖ Парк   ⋯      │  │  ← PostCard
│  │                                │  │
│  │  [Image 4:5]                  │  │
│  │                                │  │
│  │ Текст поста maxLines 3        │  │
│  │ ─────────────────────────     │  │
│  │ ♥ 24  ◌ 3  ⌁ Поделиться   ▢   │  │
│  └───────────────────────────────┘  │
│  ...                                 │
├─────────────────────────────────────┤
│  ⌂  ▶  +  ⌖  ○                     │  ← BottomTabs
└─────────────────────────────────────┘
```

Компоненты: TopBar, StoryRow, HomeTabs, PostCard, BottomTabs.

### 5.2 Поиск

```
┌─────────────────────────────────────┐
│ ← Поиск                             │  ← TopBar (с back)
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ ⌕  Найти людей, места...      │  │  ← SearchBox
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  [Все] [Люди] [Бизнес] [Места]...  │  ← SearchTabs (pill, horizontal scroll)
├─────────────────────────────────────┤
│  НЕДАВНИЕ ПОИСКИ            Очистить│  ← SectionHeader
│  ┌───────────────────────────────┐  │
│  │ ⌕ @anya_coffee           ×    │  │  ← RecentRow
│  │   Люди                          │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ ⌕ Кофейни Арбат          ×    │  │
│  │   Места                         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

Компоненты: TopBar, SearchBox, SearchTabs, SectionHeader, RecentRow.

### 5.3 Карта

```
┌─────────────────────────────────────┐
│ Карта                  ⌕            │  ← TopBar
│ Что интересного рядом?              │
├─────────────────────────────────────┤
│  [Все] [Посты] [Видео] [Бизнес]...  │  ← FilterTabs
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │  Рабочий слой карты           │  │
│  │  Найдено объектов: 12         │  │
│  │  ╭─╮  ╭─╮  ╭─╮               │  │  ← MapArea (вместо настоящей карты)
│  │  │B│  │P│  │V│               │  │     (финальный Android будет Yandex MapKit)
│  │  ╰─╯  ╰─╯  ╰─╯               │  │
│  └───────────────────────────────┘  │
│  ОБЪЕКТЫ                             │
│  ┌───────────────────────────────┐  │
│  │ [B] Близз · Аня              │  │  ← MapObjectRow
│  │     Парк Горького              │  │
│  └───────────────────────────────┘  │
│  ...                                 │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐│  ← ObjectSheet (bottom sheet)
│ │ ━                                ││
│ │ БЛИЗЗ           Кофейня @anya   ││
│ │ Утренний кофе                   ││
│ │ ⌖ Парк Горького                 ││
│ │ [Открыть] [Маршрут] [Сохранить]││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

Компоненты: TopBar, FilterTabs, MapArea, MapObjectRow, ObjectSheet.

### 5.4 Сообщения

```
┌─────────────────────────────────────┐
│ Сообщения              ⌕            │  ← TopBar
├─────────────────────────────────────┤
│  [Все] [Личные] [Бизнес] [Группы]  │  ← ChatTabs
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ [А] Аня              12:34  ✓✓ │  │  ← ChatRow
│  │     Последнее сообщение...      │  │
│  │                        2 нп.   │  │  ← unread badge
│  └───────────────────────────────┘  │
│  ...                                 │
└─────────────────────────────────────┘
```

При тапе на чат — full screen ChatScreen.

### 5.5 Профиль

```
┌─────────────────────────────────────┐
│ @anya_coffee              ⋯          │  ← TopBar
├─────────────────────────────────────┤
│      ╭───╮                           │
│      │А │                            │  ← Avatar 80×80
│      ╰───╯                           │
│      Аня                             │  ← h2
│      @anya_coffee                   │  ← text.secondary
│      Москва                          │  ← text.secondary
│      156 подписчиков · 42 подписки  │  ← meta
│  [Редактировать профиль]            │  ← Button secondary fullWidth
├─────────────────────────────────────┤
│  [Посты] [Видео] [Сохранённое]      │  ← ProfileTabs
├─────────────────────────────────────┤
│  ┌───┐ ┌───┐ ┌───┐                  │  ← PostGrid (3 col)
│  │   │ │   │ │   │                  │
│  │   │ │   │ │   │                  │
│  └───┘ └───┘ └───┘                  │
│  ...                                 │
├─────────────────────────────────────┤
│  ⌂  ▶  +  ⌖  ○                     │  ← BottomTabs
└─────────────────────────────────────┘
```

---

## 6. Особые паттерны

### 6.1 Story ring + hasUnseen

**Реализация:** внешний круг рисуется как `border` (3px) или через `View`-обёртку с padding и bg.
- Unseen: `linear-gradient(135deg, primary, accent)`.
- Seen: `border.default`.
- Close friends: dashed `border.warning`.

**Касание:** весь блок — `<Pressable>`, tap → `onStoryPress()` → `StoryViewer`.

### 6.2 Post menu (3 dots)

**Реализация:** `<Pressable>` 32×32, иконка `IconDotsHorizontal`. Tap → `BottomSheet` с действиями:
- Пожаловаться
- Скопировать ссылку
- Поделиться вне приложения
- Не показывать от этого автора (если есть follow)
- Заблокировать (если есть в меню профиля)

### 6.3 Bottom sheet с action list

**Структура:** handle → title → list of `<ListItem>` (leading icon, title, optional value) → divider → CTA-кнопки.

### 6.4 Image carousel dots

**Реализация:** 4 маленьких круга 6×6, active = `brand.primary`, inactive = `border.strong`. Gap 4. Position: bottom-center, margin-bottom 12.

### 6.5 Chat input с + для игр/attachments

**Структура:**
```
┌──────────────────────────────────────────┐
│ [+] [TextInput........] [Send]          │
└──────────────────────────────────────────┘
```

При тапе на `+` → `GamePickerSheet` (Угадай карту, Напёрстки; без Футбола и других игр) + прикрепление фото/видео/файла (опционально).

### 6.6 Map sheet с маршрутом

**Структура:** см. 5.3. Кнопка «Маршрут» открывает `Linking.openURL('https://yandex.ru/maps/?text=...')`. Уже реализовано в `MapScreen.tsx:79-87`.

---

## 7. Acceptance-чеклист

- [ ] Все 15 базовых компонентов реализованы: Button, Input, Card, Avatar, Tabs, Chip, Sheet, Modal, Toast, ListItem, Divider, Empty, Skeleton, StoryRing, Loading
- [ ] Все 7 карточек контента вынесены: PostCard, StoryCard, VideoCard, OfferCard, ChatBubble, MapPin, SearchResultRow
- [ ] Loading состояние через skeleton, не spinner (для экранов)
- [ ] Empty state — иллюстрация + title + CTA
- [ ] Error state — текст + retry
- [ ] Bottom sheet — единый компонент, переиспользуется
- [ ] Top-bar — единый компонент с back/title/actions
- [ ] Все 5 референсных экранов описаны ASCII-схемами
- [ ] Story ring поддерживает 4 типа: default, unseen, seen, closeFriends
- [ ] Bottom tab bar 76pt высотой, центральный + 56×56 elevated
- [ ] Touch target ≥44pt везде
- [ ] Состояния loading/empty/error/noAccess/sessionExpired покрыты для 5 ключевых экранов

---

## 8. Открытые вопросы (для пользователя)

1. **Skeleton states нужны сразу или потом?** Без них — спиннер на loading (текущее поведение). С ними — выглядит профессиональнее, но +2-3 дня работы.
2. **Bottom sheet vs full screen modal — где граница?** Sheet для быстрых действий, full screen для форм. Подтвердить правило.
3. **Toast нужен?** Сейчас ошибки показываются inline. Toast — стандарт для «кратковременных» сообщений, но inline — для «связанных с экраном». Возможно, оба.
4. **Post grid 3-колонки как у Instagram или 2-колонки с большими квадратами?** 3 — экономит место, 2 — крупнее визуал.
5. **Карусель для медиа — горизонтальный swipe или плитка с переключением?** Сейчас статическая картинка + точки. Нужен ли полноценный carousel?
6. **Что делать с заблокированным контентом?** В `HomeScreen.tsx:1037-1046` сейчас это «Пока нет публикаций». Возможно, нужен explicit state «Пользователь заблокирован».
