# Page 26 — Story detail schema

## Backend

Added `GET /api/stories/detail/:storyId`.

Response:

```json
{
  "story": {
    "id": "story_id",
    "accountId": "account_id",
    "author": {
      "id": "account_id",
      "type": "personal",
      "name": "Name",
      "username": "username",
      "avatar": null,
      "businessCategory": null
    },
    "mediaType": "image",
    "mediaUrl": "https://example.com/story.jpg",
    "text": "Story text",
    "location": null,
    "visibility": "public",
    "viewsCount": 0,
    "isSeenByMe": false,
    "createdAt": "ISO",
    "expiresAt": "ISO"
  }
}
```

The route only returns active stories. Access is checked from the session token and `activeAccountId` through the existing follow graph helper.

## Mobile

Added `StoryDetailScreen`.

Connected entry points:

- map object with `type = story`;
- story reply card in messages.

The screen reuses existing story behavior: media preview, author, text, location, view marking and reply.

Not added: new bottom tab, story archive, recommendations, share sheet, new media player dependency, visual redesign.
