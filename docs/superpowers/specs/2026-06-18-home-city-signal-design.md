# Blizz Home: City Signal Design

## Status

Selected visual direction: **City Signal**.

Reference image:

`docs/visual/mocks/blizz-home-city-signal-reference.png`

This specification covers the visual redesign of the main feed, its bottom
navigation, and the icon family used by those surfaces. It does not change
backend behavior, routes, data contracts, permissions, or product scenarios.

## Product Intent

Blizz should feel like a live city signal rather than a generic social feed.
The interface stays simple and immediately understandable, while gaining a
distinctive rhythm through typography, photography, spacing, and a coherent
softly rounded icon family.

The result must be:

- modern and minimal;
- visually ownable without decorative noise;
- photo-led and socially alive;
- compact enough to show useful content in the first viewport;
- consistent on native-width mobile and centered PWA web.

## Existing Behavior To Preserve

- Header actions: search, notifications, messages.
- Stories/Blizz row, including the current user's first-position create item.
- Tabs: `Лента` and `Витрина`.
- Personal feed posts and business showcase content.
- Like, comments, share, save, post opening, account opening.
- Story viewer, comments sheet, and share sheet.
- Bottom navigation:
  `Главная / Видео / + / Карта / Профиль`.
- `Близз` remains outside the central create flow.
- Existing API requests, state handling, and navigation callbacks.

## Visual Direction

### Composition

- Use one consistent horizontal grid, normally 16 px.
- Keep the header compact and visually calm.
- Make the Blizz row spatially efficient; it must not create an empty band when
  only one story exists.
- Do not show a title above the Blizz row.
- Place the current user's Blizz first and attach a small add badge to the
  avatar instead of rendering a separate create tile or header action.
- Keep `Лента / Витрина` visually clear without large pills or uppercase
  letter-spaced labels.
- Remove unnecessary card shells from the personal feed.
- Let author, media, caption, and actions form one clean editorial sequence.
- Use dividers, spacing, and typography before borders or shadows.
- Keep the central create action prominent but restrained.

### Signature

The unique visual signature is a subtle city pulse:

- one confident deep-blue signal per viewport;
- occasional compact pulse/route details in active states or separators;
- fast but orderly vertical rhythm;
- directional icon terminals receive the shared `Blizz Lift` optical detail.

The pulse is not rendered as text, emoji, decorative waveform, or repeated
badge. It is a structural motif used sparingly.

### Color

- Base background: warm off-white.
- Primary content surface: white or the base surface without a card.
- Primary text: near-black/navy.
- Secondary text: muted neutral gray-blue.
- Brand blue: deep `#0B3D99`, used for active navigation and one strong signal.
- Danger: used only for active like or destructive states.
- No gradients, purple accents, glass effects, neon, or decorative color blobs.

### Typography

- Use a modern, highly readable grotesk with a controlled weight range.
- Body text: 14-16 px.
- Author names and important labels: medium/semibold, not universal 800-900.
- Avoid negative letter spacing.
- Avoid uppercase mechanical tabs.
- Create hierarchy through size, weight, line height, and spacing.
- Long names, locations, and captions must wrap or truncate predictably.

### Photography

- Prefer documentary city photography with movement, people, streets, and
  evening light.
- Use bold but intentional crops.
- Preserve media aspect ratio through stable responsive containers instead of a
  single arbitrary fixed height for every post.
- Do not introduce stock-looking atmospheric filler.

## Icon Family

### Geometry

- Master grid: 24 x 24.
- Drawing safe area: 20 x 20.
- Optical stroke: 1.8 units.
- Round caps and round joins.
- Outer corner radius: 1.75 units on the master grid.
- Minimum internal opening: 2 units.
- Standard sizes: 14 micro, 20 feed actions, 22 header, 24 navigation, 28 create.
- Touch targets: at least 44 x 44 for interactive actions.

### States

- Inactive: outline using secondary text color.
- Active navigation: true filled glyph using primary blue.
- Active like: true filled heart using danger color.
- Active bookmark: true filled bookmark using primary blue.
- Search, share, plus, close, chevrons, and more remain outline-only.
- Filled and outline versions must keep the same bounding box and optical center.
- Activity uses shape and color only; do not combine fill, background, scale,
  and stroke changes simultaneously.

### Blizz Lift

One directional terminal may rise by roughly 0.75 unit on applicable glyphs:

- search handle;
- share arrow;
- map pin point;
- message tail;
- video/play direction.

Apply it once per glyph and only when it reinforces direction. Static symbols
such as lock, eye, and close do not use it.

### First Glyph Set

- home
- video
- plus
- mapPin
- profile
- search
- notificationBell
- message
- heart
- comment
- share
- bookmark
- moreHorizontal
- chevronLeft
- close
- send

All Home and MainTabs icons must come from the shared icon registry. Local SVG
components and text symbols are not allowed.

## Screen Elements

### Header

- Compact Blizz wordmark.
- Search, notification, and message actions.
- 44 px press targets.
- Notification badge remains a separate element, not part of the bell path.

### Blizz Row

- Current user's Blizz is always the first item.
- The create affordance is a small circular plus badge attached to the current
  user's avatar.
- No `Близзы` section title and no separate `Ваш Близз` header action.
- Viewed and unseen states.
- Image and fallback states.
- Loading, error, disabled/no-access, and long-name behavior.
- No Instagram-style gradient rings.

### Feed Tabs

- `Лента` and `Витрина`.
- Clear active, inactive, pressed, and web focus-visible states.
- No oversized segmented-control capsule.

### Personal Post

- Avatar/fallback, author, location, time, and overflow.
- Media/fallback and multi-media indicator.
- Caption/no-caption.
- Do not render hashtags or tag rows beneath the post caption.
- Do not place a divider between the caption and the action row; use spacing
  alone.
- Like, comment, share, and bookmark states.
- Long names, long locations, multiline captions, and large counters.

### Showcase Offer

- Cover, save state, type, title, business, location, condition, and expiry.
- Existing actions only.
- Visually distinct from a personal post without becoming a heavy nested card.

### Sheets And Viewer

- Comments sheet.
- Share sheet.
- Story viewer.
- Their visual language must reuse the same spacing, typography, radius, icon,
  and state rules.

### Bottom Navigation

- Keep the five existing destinations and order.
- Show icons only; bottom-navigation text labels are not rendered.
- Use 24 px icons and a 28 px central plus.
- Active icons use filled primary glyphs.
- Profile avatar uses a neutral inactive ring and primary active ring.
- Respect safe area and prevent the create action from vertically displacing the
  other tabs.

## Responsive Behavior

### Mobile

Verify at 360, 390, and 430 px widths.

At 390 x 844, the first viewport should show:

- full compact header;
- Blizz row;
- feed tabs;
- substantial first-post content;
- stable bottom navigation.

### PWA/Web

- Center the mobile application rail.
- Target maximum content width around 430 px.
- Use a neutral outer page background.
- Keep header, sheets, content, and bottom navigation within the same rail.
- Do not stretch feed media into desktop banners.
- Provide hover and focus-visible states.
- Verify at 1280 x 800 and 1440 x 900.

## States And Accessibility

- Preserve loading, empty, error, disabled, no-access, and sending states.
- All interactive controls use semantic pressables/buttons and accessible names.
- Touch targets are at least 44 x 44.
- Text contrast remains readable against every surface.
- Focus-visible styles must be present on web.
- Dynamic content must not resize or shift stable controls.

## Forbidden Changes

- No backend, API, storage, role, or navigation changes.
- No new feed filters, city selectors, marketing copy, or product features.
- No full-screen screenshot pasted as UI.
- No emoji or text-symbol production icons.
- No locally improvised icon components outside the shared registry.
- No gradients, glassmorphism, purple theme, bokeh, or decorative blobs.
- No nested cards or every-section-as-card composition.
- No Instagram/TikTok clone treatment.

## Implementation Scope

Expected files:

- `mobile/src/screens/home/HomeScreen.tsx`
- `mobile/src/navigation/MainTabs.tsx`
- `mobile/src/shared/ui/BlizzIcon.tsx`
- `mobile/src/shared/ui/theme.ts`

Small focused shared UI files may be introduced only when they reduce actual
duplication and remain within the Home/icon-system scope.

## Verification

- `npm run check` in `server`.
- `npm run typecheck` in `mobile`.
- `npx expo export --platform web` in `mobile`.
- Browser checks at 390 x 844, 430 px, 1280 x 800, and 1440 x 900.
- Compare the selected reference and rendered implementation at matching mobile
  dimensions.
- Verify all existing Home interactions and sheets.
- Grep for forbidden text-symbol icons and navigation regressions.
- Record inspected files, changed elements, intentionally unchanged elements,
  responsive behavior, limitations, and reference-match result.
