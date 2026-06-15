# Page 22 — Public Profile

## Scope
Public profile for another personal or business account.

## Entry points
- feed post author
- showcase business post author
- offer business
- video author
- comments author
- followers/following list item
- saved business
- map object owner/business

## API
- GET /api/accounts/:accountId/public-profile
- GET /api/accounts/:accountId/public-posts
- GET /api/accounts/:accountId/public-videos

## Rules
- Actions are based on activeAccountId, not userId from client.
- Private account header is visible, content is hidden until accepted follow.
- Business profile shows business details and action buttons.
- Own account redirects to ProfileScreen.
- No recommendations, contacts import, reports, blocks, payments, reviews, or random demo profiles.
