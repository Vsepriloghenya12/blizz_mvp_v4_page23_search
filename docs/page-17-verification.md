# Page 17 verification

## Backend

- `npm --prefix server install` — passed.
- `npm --prefix server run check` — passed.
- `node server/page17-smoke-test.js` — passed.

Smoke-test checks:

- catalog contains only agreed game directions: `card_guess`, `football`, `cups`;
- catalog/source does not include `quiz`, `place_guess`, `quick_choice`;
- `card_guess` can be created in personal chat;
- `game_invite` appears in chat;
- answer reveals selected/winning card;
- duplicate answer from same account is idempotent;
- finish creates `game_result`;
- game result is visible to the other participant;
- `card_guess` can be created in group chat;
- games are rejected in business chat.

## Mobile

- `npm --prefix mobile install` — passed, with 10 moderate vulnerabilities from Expo/React Native dependency tree.
- `npm --prefix mobile run typecheck` — passed.
- `npx expo export --platform web` — passed.

## Grep

Checked source only:

- no `user.isBusiness`;
- no bottom tab `Сообщения`;
- no `Обновить` button;
- `Близз` not returned as create-action;
- no forbidden games in source: `Квиз`, `Угадай место`, `Быстрый выбор`, `quiz`, `place_guess`, `quick_choice`;
- games gated away from business chat.
