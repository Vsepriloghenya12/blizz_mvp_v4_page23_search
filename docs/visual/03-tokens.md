# Трек 3 — Палитра, типографика, токены

> Research-документ. Не менять код по нему. Используется как основа для последующих визуальных проходов.
> Текущее состояние: `mobile/src/shared/ui/theme.ts` содержит 8 raw-цветов, нет dark theme, нет semantic tokens, нет состояний.

---

## 1. Аудит текущей палитры

Источник: `mobile/src/shared/ui/theme.ts`

```ts
{
  primary:     '#0B3D99',  // спокойный деловой синий
  darkNavy:    '#071B3A',
  background:  '#FAFAF7',  // тёплый off-white
  surface:     '#FFFFFF',
  softBlue:    '#EAF1FF',
  textPrimary:   '#101828',
  textSecondary: '#667085',
  border:      '#D9E3F2',
  danger:      '#D92D20'
}
```

### Что хорошо

- **Primary #0B3D99** — узнаваемый, спокойный, не «кричит». Хорошо читается в крупных активных элементах (плюс, активный таб).
- **Background #FAFAF7** — тёплый off-white, не синий, не белый. Мягче, чем чистый #FFFFFF, глаза не устают. Связка с **#FFFFFF surface** даёт ощущение «слоистости».
- **Контраст textPrimary на background:** 16.4:1 (AAA), отлично.
- **Контраст primary на white:** 8.6:1 (AAA для крупного текста, AA для мелкого). Это сильная сторона.

### Что плохо

- **Нет dark theme.** Сейчас при системной тёмной теме приложение останется белым → слепит ночью, расходует батарею на OLED. Это критично для РФ-аудитории, которая часто сидит в приложении вечером.
- **Нет семантических токенов.** Все цвета идут как raw. Это значит, что если в коде написать `colors.primary` в кнопке, семантика — «это primary-action». А если в outline — это уже не primary, это `accentStroke`. Сейчас нет разделения.
- **Нет состояний.** `primary` без `primaryHover` / `primaryPressed` / `primarySoft` / `onPrimary`. Каждый компонент вынужден изобретать состояния, что приводит к разнобою.
- **Нет статусов.** `danger` есть, а `success` / `warning` / `info` — нет. По коду видно, что используются ad-hoc строки (`#D92D20` для danger, никаких цветов для success).
- **Нет content-токенов.** Лайк, комментарий, шеринг, save, location, story, offer — все используют raw primary. Нет отдельного цвета для лайка (обычно красный), для story (обычно оранжевый/жёлтый), для offer (жёлтый/зелёный).
- **Нет overlay/scrim.** В модалках и bottom sheet для затемнения подложки что используется? Скорее всего, ad-hoc `rgba(0,0,0,0.4)`.
- **softBlue слишком бледный для disabled-состояний.** Нет разницы между `disabled` (нельзя взаимодействовать) и `subtle` (фоновый элемент).

### WCAG-проверка ключевых пар

| Пара | Контраст | Статус |
|------|----------|--------|
| textPrimary #101828 on background #FAFAF7 | 16.4:1 | AAA ✅ |
| textSecondary #667085 on background #FAFAF7 | 5.3:1 | AA ✅ |
| textSecondary #667085 on surface #FFFFFF | 4.8:1 | AA (borderline) ⚠️ |
| primary #0B3D99 on white #FFFFFF | 8.6:1 | AAA ✅ |
| primary #0B3D99 on background #FAFAF7 | 8.5:1 | AAA ✅ |
| softBlue #EAF1FF on white #FFFFFF | 1.13:1 | ❌ (только фон) |
| danger #D92D20 on white | 4.6:1 | AA ✅ (для UI-элементов) |
| danger #D92D20 on background #FAFAF7 | 4.5:1 | AA ✅ |

**Главный риск:** textSecondary на surface чуть ниже AA для мелкого текста. Если использовать #667085 для caption (≤12px) на белом — будет на грани. Решение: в dark theme использовать светлее, в light — заменить на #545E72 для caption.

---

## 2. Палитра — СВЕТЛАЯ тема (полный набор)

### 2.1 Brand

| Токен | HEX | HSL | Назначение |
|-------|-----|-----|------------|
| `brand.primary` | `#0B3D99` | (217, 85%, 32%) | Брендовый синий, основной CTA, активный таб |
| `brand.primaryHover` | `#0F4FBF` | (217, 87%, 40%) | Hover на primary-кнопке |
| `brand.primaryPressed` | `#0A3587` | (217, 86%, 27%) | Pressed на primary-кнопке |
| `brand.primarySoft` | `#EAF1FF` | (217, 100%, 95%) | Подложка для soft-варианта primary (то же, что текущий softBlue) |
| `brand.primarySoftHover` | `#D5E2FB` | (217, 90%, 91%) | Hover на soft-кнопке |
| `brand.primaryOn` | `#FFFFFF` | (0, 0%, 100%) | Текст/иконка НА primary-фоне |
| `brand.accent` | `#1B5BD9` | (217, 75%, 48%) | Акцент для ссылок, не-CTA выделений |

### 2.2 Surface

| Токен | HEX | Назначение |
|-------|-----|------------|
| `surface.bg` | `#FAFAF7` | Базовый фон экрана (тёплый off-white) |
| `surface.surface` | `#FFFFFF` | Карточки, sheet, модалки |
| `surface.surfaceElevated` | `#FFFFFF` + shadow md | Поднятые карточки, top-bar |
| `surface.surfaceMuted` | `#F4F6F9` | Muted-фон, отличимый от основного на 1 шаг |
| `surface.overlay` | `rgba(16, 24, 40, 0.5)` | Затемнение под модалкой |

### 2.3 Text

| Токен | HEX | Назначение |
|-------|-----|------------|
| `text.primary` | `#101828` | Заголовки, основной текст |
| `text.secondary` | `#667085` | Подписи, captions, мета-информация |
| `text.muted` | `#98A2B3` | Отключённые, плейсхолдеры |
| `text.inverse` | `#FFFFFF` | Текст на тёмном/primary фоне |
| `text.onAccent` | `#FFFFFF` | Текст на accent-фоне |
| `text.onPrimary` | `#FFFFFF` | Текст на primary-фоне (алиас) |
| `text.link` | `#1B5BD9` | Ссылки |

### 2.4 Border

| Токен | HEX | Назначение |
|-------|-----|------------|
| `border.default` | `#D9E3F2` | Базовая граница |
| `border.strong` | `#B8C7DD` | Выделенная граница |
| `border.subtle` | `#EEF2F8` | Почти-невидимая разделительная |
| `border.focus` | `#0B3D99` | Focus ring |

### 2.5 Status

| Токен | HEX | Назначение |
|-------|-----|------------|
| `status.success` | `#12B76A` | Успех, подтверждение |
| `status.successSoft` | `#D1FADF` | Подложка success |
| `status.successText` | `#027A48` | Текст success |
| `status.warning` | `#F79009` | Предупреждение |
| `status.warningSoft` | `#FEF0C7` | Подложка warning |
| `status.warningText` | `#B54708` | Текст warning |
| `status.danger` | `#D92D20` | Ошибка, destructive |
| `status.dangerSoft` | `#FEE4E2` | Подложка danger |
| `status.dangerText` | `#B42318` | Текст danger |
| `status.info` | `#0B3D99` | (= brand.primary, не вводим новый) |
| `status.infoSoft` | `#EAF1FF` | (= brand.primarySoft) |

### 2.6 Content (для иконок/индикаторов)

| Токен | HEX | Назначение |
|-------|-----|------------|
| `content.like` | `#E11D48` | Лайк (active) — опасный красный, не алярм |
| `content.comment` | `#475467` | Комментарий (нейтральный) |
| `content.share` | `#475467` | Шеринг (нейтральный) |
| `content.save` | `#0B3D99` | Save (active) — primary |
| `content.location` | `#0B3D99` | Геометка — primary |
| `content.story` | `#E48A3F` | Сторис (Близз) — оранжевый, тёплый |
| `content.offer` | `#12B76A` | Офер — зелёный, «польза» |
| `content.business` | `#0B3D99` | Бизнес — primary |
| `content.unread` | `#D92D20` | Непрочитанное — danger |

### 2.7 Контроль

| Токен | HEX | Назначение |
|-------|-----|------------|
| `control.bg` | `#FFFFFF` | Фон кнопки по умолчанию |
| `control.bgHover` | `#F4F6F9` | Hover на ghost-кнопке |
| `control.bgPressed` | `#EEF2F8` | Pressed на ghost-кнопке |
| `control.bgDisabled` | `#F4F6F9` | Disabled фон |
| `control.textDisabled` | `#B8C7DD` | Disabled текст |

---

## 3. Палитра — ТЁМНАЯ тема

Принцип: **brand остаётся узнаваемым**, surfaces инвертируются, text инвертируется с приподнятой яркостью.

### 3.1 Brand

| Токен | HEX | HSL | Комментарий |
|-------|-----|-----|-------------|
| `brand.primary` | `#3D6CFF` | (225, 100%, 62%) | Светлее, для контраста на тёмном |
| `brand.primaryHover` | `#5A85FF` | (225, 100%, 68%) | |
| `brand.primaryPressed` | `#2D58E0` | (225, 73%, 53%) | |
| `brand.primarySoft` | `#1A2342` | (224, 43%, 18%) | Тёмная подложка вместо светлой |
| `brand.primarySoftHover` | `#22305A` | (224, 41%, 24%) | |
| `brand.primaryOn` | `#FFFFFF` | | |
| `brand.accent` | `#7DA4FF` | | |

### 3.2 Surface

| Токен | HEX | Назначение |
|-------|-----|------------|
| `surface.bg` | `#0B0F1A` | Тёмный фон, не чёрный, а navy-black |
| `surface.surface` | `#15192C` | Карточки, sheet |
| `surface.surfaceElevated` | `#1F2540` | Поднятые карточки |
| `surface.surfaceMuted` | `#0E1220` | Muted-фон |
| `surface.overlay` | `rgba(0, 0, 0, 0.7)` | Затемнение |

### 3.3 Text

| Токен | HEX | Назначение |
|-------|-----|------------|
| `text.primary` | `#F5F7FF` | Основной текст (не чисто белый) |
| `text.secondary` | `#A4B0D6` | Подписи |
| `text.muted` | `#6F7A99` | Отключённые |
| `text.inverse` | `#101828` | Текст на светлом/primary |
| `text.onPrimary` | `#FFFFFF` | |
| `text.link` | `#7DA4FF` | |

### 3.4 Border

| Токен | HEX |
|-------|-----|
| `border.default` | `#1F2540` |
| `border.strong` | `#2D3556` |
| `border.subtle` | `#15192C` |
| `border.focus` | `#5A85FF` |

### 3.5 Status

| Токен | HEX |
|-------|-----|
| `status.success` | `#32D583` |
| `status.successSoft` | `#0B2E1F` |
| `status.successText` | `#6CE9A6` |
| `status.warning` | `#FDB022` |
| `status.warningSoft` | `#3A2A0A` |
| `status.warningText` | `#FEDF89` |
| `status.danger` | `#F97066` |
| `status.dangerSoft` | `#3A1815` |
| `status.dangerText` | `#FDA29B` |
| `status.infoSoft` | `#1A2342` |

### 3.6 Content

| Токен | HEX |
|-------|-----|
| `content.like` | `#FB7185` |
| `content.comment` | `#A4B0D6` |
| `content.share` | `#A4B0D6` |
| `content.save` | `#7DA4FF` |
| `content.location` | `#7DA4FF` |
| `content.story` | `#FFA968` |
| `content.offer` | `#32D583` |
| `content.business` | `#7DA4FF` |
| `content.unread` | `#F97066` |

---

## 4. Семантические токены vs raw-токены

### 4.1 Концепция

- **Raw-токены** — это HEX-значения в `tokens.color.blue.500`. Не используются в коде компонентов.
- **Семантические токены** — это роли: `color.background.surface.card`, `color.text.action.danger`, `color.border.input.focus`. Используются в коде компонентов.

### 4.2 Пример для светлой темы

```
# raw (определяются один раз)
blue.500:  #0B3D99
blue.700:  #0A3587
blue.50:   #EAF1FF

# semantic
brand.primary:        { light: blue.500,  dark: blue.300 }  // зависят от темы
surface.card:         { light: white,     dark: gray.800 }
text.action.primary:  { light: blue.500,  dark: blue.300 }
```

### 4.3 Как ложится на RN + TS

```ts
// shared/ui/tokens/colors.ts
export const semantic = {
  brand: {
    primary:    { light: '#0B3D99', dark: '#3D6CFF' },
    primarySoft:{ light: '#EAF1FF', dark: '#1A2342' },
    primaryOn:  { light: '#FFFFFF', dark: '#FFFFFF' },
  },
  text: {
    primary:    { light: '#101828', dark: '#F5F7FF' },
    secondary:  { light: '#667085', dark: '#A4B0D6' },
  },
  // ...
} as const;
```

В компонентах — через ThemeProvider:
```tsx
<ThemeProvider scheme={colorScheme}>
  <Button label="Создать" variant="primary" />
</ThemeProvider>
```

`Button` берёт `colors.brand.primary[scheme]` и применяет.

### 4.4 Соглашения

- В коде компонентов **никогда** не использовать `theme.brand.primary` напрямую — только `colors.bg`, `colors.text`, `colors.border` и т.д.
- Тема определяется **на корне** (в `AppRoot.tsx`), переключается через `Appearance.getColorScheme()` + `useColorScheme()` хук.
- При смене темы — re-render всего дерева. Чтобы не было флика, лучше кешировать выбор в `useState` + слушать `Appearance.addChangeListener`.

---

## 5. Типографика

### 5.1 Семейство

**Рекомендация: Inter** (open-source, MIT, поддержка кириллицы, отличный hinting на маленьких размерах).

- **iOS:** подключить через `@expo-google-fonts/inter` (Expo уже умеет).
- **Android:** Inter поставляется в RN-бандле.
- **Web (react-native-web):** Inter подгружается с Google Fonts при первом рендере.
- **Fallback:** `-apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif`.

Альтернативы:
- **SF Pro** (нативно iOS) + **Roboto** (нативно Android) — без подключения, но разный вид на платформах.
- **Manrope** — кириллица хуже, чем у Inter.

### 5.2 Шкала

| Уровень | size / line-height | weight | letter-spacing | Назначение |
|---------|--------------------|--------|----------------|------------|
| `display` | 34/40 | 800 | -0.8 | Hero на лендинге, top-bar hero |
| `h1` | 28/34 | 800 | -0.4 | Заголовок экрана (например, "Карта") |
| `h2` | 24/30 | 800 | -0.3 | Заголовок секции |
| `h3` | 20/26 | 800 | -0.2 | Заголовок карточки |
| `h4` | 18/24 | 700 | -0.1 | Подзаголовок |
| `body` | 16/22 | 500 | 0 | Основной текст |
| `bodySmall` | 14/20 | 500 | 0 | Подписи, мета |
| `caption` | 12/16 | 600 | 0.1 | Captions, время, лайки |
| `overline` | 11/14 | 800 | 0.8 | Section labels ("НЕДАВНИЕ ПОИСКИ", "БИЗНЕС") |
| `mono` | 14/20 | 500 | 0 | Code, ID (опционально) |

### 5.3 Референсы

- **Apple HIG (iOS 17):** Large Title 34/41, Title 1 28/34, Title 2 22/28, Title 3 20/25, Headline 17/22 semibold, Body 17/22, Callout 16/21, Subhead 15/20, Footnote 13/18, Caption 1 12/16, Caption 2 11/13.
- **Material 3 (Android 14):** Display Large 57/64, Headline Large 32/40, Title Large 22/28, Body Large 16/24, Label Large 14/20.
- **Telegram:** Regular 16, Medium 16, Semibold 16, Bold 16, Light 16, Medium 18, Semibold 18, Bold 20. Шкала плавная.
- **VK:** 13/15, 15/20, 17/22, 20/26, 24/30, 28/36.

**Решение:** шкала из 9 уровней (display + h1-h4 + body + bodySmall + caption + overline) — это **золотая середина** между iOS-HIG (10 уровней) и Material 3 (12 уровней). Покрывает все наши сценарии без избыточности.

---

## 6. Spacing & layout

### 6.1 Базовая шкала (множитель 4)

| Токен | px | Назначение |
|-------|-----|------------|
| `space.0` | 0 | |
| `space.1` | 4 | Внутренний gap в одной строке (между иконкой и текстом) |
| `space.2` | 8 | Gap между label и value в одной строке |
| `space.3` | 12 | Gap между элементами в строке |
| `space.4` | 16 | **Стандартный screen padding** |
| `space.5` | 20 | Большой padding для секции |
| `space.6` | 24 | Block padding (между секциями) |
| `space.8` | 32 | Большой разрыв между крупными блоками |
| `space.10` | 40 | Hero-разрыв |
| `space.14` | 56 | Огромный разрыв (top-bar bottom safe area) |

### 6.2 Container

- **Web max-width:** 480px (мобильный превью) или 720px (планшет). Карточки в web-режиме центрируются.
- **Mobile padding:** `screenX = 16` (текущий `spacing.screenX` в `theme.ts`).

### 6.3 Safe area

- Top: `useSafeAreaInsets().top` (iOS notch / Android status bar)
- Bottom: `useSafeAreaInsets().bottom` (home indicator)
- Минимальный touch target: 44×44 pt (Apple HIG) / 48×48 dp (Material).

---

## 7. Радиусы

| Токен | px | Назначение |
|-------|-----|------------|
| `radius.none` | 0 | Edge-to-edge, full-width bars |
| `radius.xs` | 6 | Tag, badge, small chip |
| `radius.sm` | 12 | Input, small card |
| `radius.md` | 16 | Card (default) |
| `radius.lg` | 20 | Большая карточка, sheet handle |
| `radius.xl` | 24 | Post card в feed, story ring (inner) |
| `radius.2xl` | 28 | Bottom sheet (top corners) |
| `radius.3xl` | 32 | Big sheets, modals |
| `radius.pill` | 9999 | Tab pill, button (full) |

### Текущее использование (проверка)

- `searchBox: borderRadius 18` → должен быть `radius.lg` (20) или `radius.xl` (24).
- `tabButton: borderRadius 18` → `radius.lg` (20).
- `tabButtonActive: borderRadius 20` → `radius.xl` (24).
- `commentAvatar: borderRadius 18` → `radius.lg` (20).
- `resultImage: borderRadius 22` → `radius.xl` (24).
- `offerCard: borderRadius 24` → `radius.xl` (24). ✅

Сейчас радиусы в коде разнобой: 6, 14, 15, 18, 20, 22, 24, 30. Это нужно **привести к шкале**, иначе визуально экраны смотрятся «с разных продуктов».

---

## 8. Тени

| Уровень | Применение | Стиль |
|---------|------------|-------|
| `shadow.none` | Default | `none` |
| `shadow.sm` | Карточка на белом фоне | `0 1px 2px rgba(11, 61, 153, 0.06), 0 1px 3px rgba(11, 61, 153, 0.04)` |
| `shadow.md` | Поднятая карточка, top-bar | `0 4px 8px rgba(11, 61, 153, 0.08), 0 2px 4px rgba(11, 61, 153, 0.04)` |
| `shadow.lg` | Bottom sheet, modal | `0 24px 48px rgba(11, 61, 153, 0.16), 0 8px 16px rgba(11, 61, 153, 0.08)` |
| `shadow.xl` | Drag handle на полный sheet | `0 32px 64px rgba(11, 61, 153, 0.20)` |

**Важно:** цвет тени — **брендовый синий с малой альфой**, а не чисто чёрный. Это даёт «родной» оттенок тени, который лучше вписывается в общий вид. Material 3 рекомендует именно tinted shadows.

В dark theme тени почти невидимы (на чёрном фоне чёрная тень). Там вместо тени — **тонкая обводка** (`border.subtle`) + `surface.surfaceElevated` чуть светлее базового.

---

## 9. Motion

### 9.1 Длительности

| Токен | ms | Назначение |
|-------|-----|------------|
| `motion.instant` | 100 | Hover, icon swap, opacity |
| `motion.fast` | 180 | Button press, ripple, tab switch |
| `motion.normal` | 240 | Sheet open, modal slide, page transition |
| `motion.slow` | 360 | Stagger animations, hero, splash |
| `motion.slower` | 500 | Page intro с большой композицией |

### 9.2 Кривые (cubic-bezier)

| Токен | Timing | Назначение |
|-------|--------|------------|
| `motion.standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default для UI transitions |
| `motion.decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Элемент входит (open, expand) |
| `motion.accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | Элемент уходит (close, collapse) |
| `motion.sharp` | `cubic-bezier(0.4, 0, 0.6, 1)` | Резкие переходы (loading) |

### 9.3 Reduced motion

При `prefers-reduced-motion: reduce`:
- Длительности: instant (0ms).
- Только opacity transitions.
- Без scale, rotate, parallax.
- Skeleton остаётся (не анимация, а индикатор).

Проверка: `import { AccessibilityInfo } from 'react-native'; AccessibilityInfo.isReduceMotionEnabled()` (не работает на web, нужен fallback `window.matchMedia`).

---

## 10. Accessibility

### 10.1 Контраст

- **WCAG AA** для всего текста ≥14px.
- **WCAG AAA** для body text (≥16px), где возможно.
- **AAA для primary text на background** — уже есть (16.4:1).
- **НЕ использовать** softBlue как фон для текста без проверки контраста.

### 10.2 Touch target

- **Минимум 44×44 pt** (iOS) / **48×48 dp** (Material).
- В коде это значит: padding ≥ 12 + text/content ≥ 20 = 44.
- Кнопки-иконки без текста (например, `+` в нижней навигации) — оборачивать в `Pressable` с padding 14 со всех сторон.

### 10.3 Focus

- **Focus ring:** 2px solid `border.focus` + offset 2px.
- В RN — реализуется через `accessible={true}` + `accessibilityState={{ focused: true }}`. Web-вариант — `:focus-visible` CSS.

### 10.4 Screen reader

- У всех `Pressable` есть `accessibilityLabel` (обязательно, если содержимое неочевидно).
- У иконок без текста — `accessibilityLabel` обязательно.
- Семантика для nav-табов: `accessibilityRole="tab"`, `accessibilityState={{ selected: true }}`.

---

## 11. Acceptance-чеклист

- [ ] Светлая тема покрывает все семантические роли: brand, surface, text, border, status, content, control
- [ ] Тёмная тема полная, с конкретными HEX
- [ ] Семантические токены не утекают в код компонентов — только через `colors.X[scheme]`
- [ ] Типографическая шкала из 9 уровней реализована
- [ ] Spacing на 4-pt сетке
- [ ] Radius приведён к шкале 0/6/12/16/20/24/28/32/9999
- [ ] 4 уровня теней (sm/md/lg/xl), tinted shadows с брендовым цветом
- [ ] Motion: 5 длительностей, 4 кривые, reduced motion уважается
- [ ] WCAG AA: все ключевые пары прошли
- [ ] Touch target ≥44pt везде
- [ ] Focus ring реализован на web
- [ ] Accessibility labels на всех иконках-кнопках
- [ ] `theme.ts` переписан на новую структуру, обратная совместимость НЕ требуется (это рефактор, а не патч)

---

## 12. Открытые вопросы (для пользователя)

1. **Dark theme сразу или во второй итерации?** Рекомендую сразу, это 1.5x времени, но даёт серьёзный + к retention. Альтернатива — отложить.
2. **Подключаем Inter или остаёмся на нативных (SF Pro / Roboto)?** Inter даёт консистентность между iOS/Android/Web, но +200KB к бандлу. Нативные — без затрат, но визуально разные платформы.
3. **Mono-шрифт нужен? (для code-snippet, ID аккаунтов, deep-link.)** Если да — какой? JetBrains Mono / IBM Plex Mono / system mono.
4. **Какая плотность spacing нужна на iPad/планшете?** Сейчас 16, можно увеличить до 24 для широких экранов.
5. **Tinted shadows — согласны или оставляем чёрные?** Tinted (с брендовым оттенком) выглядит более «родным», но требует поддержки в RN.
6. **Принимаем 4-pt сетку для всех spacing?** Альтернатива — 8-pt (более «воздушный» UI).
