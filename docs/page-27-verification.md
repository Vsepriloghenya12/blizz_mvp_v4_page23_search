# Page 27 — Verification

Checks run:

- server `node page27-smoke-test.js`;
- server `npm run check`;
- mobile `npm run typecheck`.

Smoke test covers:

- accepted follower can view a followers-only post;
- share is denied when the selected target account cannot view that post;
- share succeeds after the target account also receives accepted follow access.
