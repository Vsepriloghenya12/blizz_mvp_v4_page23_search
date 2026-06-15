const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { createId } = require('../../shared/security/password');
const { canViewAccountContent } = require('../follows/follows.service');
const { createStoryReplyMessage } = require('../messages/messages.service');

const STORY_CREATOR_ROLES = new Set(['owner', 'admin', 'smm']);
const VISIBILITY_VALUES = new Set(['public', 'followers', 'close_friends', 'selected']);
const MEDIA_TYPES = new Set(['image', 'video']);
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getActiveAccountContext(state, userId, activeAccountId) {
  const membership = state.accountMemberships.find((item) => {
    return item.userId === userId && item.accountId === activeAccountId && item.status === 'active';
  });

  if (!membership) {
    throw new HttpError(403, 'ACCOUNT_ACCESS_DENIED', 'Нет доступа к активному аккаунту');
  }

  const account = state.accounts.find((item) => item.id === activeAccountId && item.status !== 'archived');
  if (!account) {
    throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Аккаунт не найден');
  }

  return { account, membership };
}

function assertCanCreateStory(account, membership) {
  if (account.type === 'personal') return;
  if (account.type === 'business' && STORY_CREATOR_ROLES.has(membership.role)) return;
  throw new HttpError(403, 'STORY_CREATE_FORBIDDEN', 'Нет доступа к созданию Близза');
}

function validateUrl(value) {
  const url = sanitizeString(value);
  if (!url) {
    throw new HttpError(400, 'STORY_MEDIA_REQUIRED', 'Добавьте ссылку на фото или видео');
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('invalid protocol');
    }
    return parsed.toString();
  } catch (_error) {
    throw new HttpError(400, 'STORY_MEDIA_URL_INVALID', 'Добавьте корректную ссылку на фото или видео');
  }
}

function normalizeLocation(input) {
  if (!input || typeof input !== 'object') return null;

  const title = sanitizeString(input.title);
  const address = sanitizeString(input.address);
  if (!title && !address) return null;

  if (title.length > 80) {
    throw new HttpError(400, 'LOCATION_TITLE_TOO_LONG', 'Название места должно быть не длиннее 80 символов');
  }

  if (address.length > 160) {
    throw new HttpError(400, 'LOCATION_ADDRESS_TOO_LONG', 'Адрес места должен быть не длиннее 160 символов');
  }

  return {
    title,
    address,
    lat: typeof input.lat === 'number' ? input.lat : null,
    lng: typeof input.lng === 'number' ? input.lng : null,
    precision: input.precision === 'area' ? 'area' : 'exact'
  };
}

function normalizeStoryInput(input) {
  const payload = input || {};
  const mediaType = sanitizeString(payload.mediaType) || 'image';
  const mediaUrl = validateUrl(payload.mediaUrl);
  const text = sanitizeString(payload.text);
  const visibility = sanitizeString(payload.visibility) || 'public';

  if (!MEDIA_TYPES.has(mediaType)) {
    throw new HttpError(400, 'STORY_MEDIA_TYPE_INVALID', 'Выберите фото или видео');
  }

  if (!VISIBILITY_VALUES.has(visibility)) {
    throw new HttpError(400, 'STORY_VISIBILITY_INVALID', 'Выберите видимость Близза');
  }

  if (text.length > 300) {
    throw new HttpError(400, 'STORY_TEXT_TOO_LONG', 'Текст Близза должен быть не длиннее 300 символов');
  }

  return {
    mediaType,
    mediaUrl,
    text,
    location: normalizeLocation(payload.location),
    visibility
  };
}

function activeStories(state) {
  const nowMs = Date.now();
  return (state.stories || []).filter((story) => {
    if (story.status !== 'active') return false;
    const expiresMs = Date.parse(story.expiresAt || '');
    return Number.isFinite(expiresMs) && expiresMs > nowMs;
  });
}

function canViewStory(state, story, viewerAccountId) {
  return canViewAccountContent(state, viewerAccountId, story.accountId, story.visibility);
}

function findActiveStory(state, storyId) {
  const story = activeStories(state).find((item) => item.id === storyId);
  if (!story) {
    throw new HttpError(404, 'STORY_NOT_FOUND', 'Близз больше недоступен');
  }
  return story;
}

function publicAuthor(account, businessProfile) {
  return {
    id: account.id,
    type: account.type,
    name: account.name,
    username: account.username,
    avatar: account.avatar || null,
    businessCategory: businessProfile ? businessProfile.category : null
  };
}

function viewsCount(state, storyId) {
  return (state.storyViews || []).filter((view) => view.storyId === storyId).length;
}

function hasSeen(state, storyId, accountId) {
  return (state.storyViews || []).some((view) => view.storyId === storyId && view.accountId === accountId);
}

function publicStory(state, story, viewerAccountId) {
  const author = state.accounts.find((account) => account.id === story.accountId);
  if (!author) return null;

  const businessProfile = author.type === 'business'
    ? state.businessProfiles.find((profile) => profile.accountId === author.id)
    : null;

  return {
    id: story.id,
    accountId: story.accountId,
    author: publicAuthor(author, businessProfile),
    mediaType: story.mediaType,
    mediaUrl: story.mediaUrl,
    text: story.text,
    location: story.location,
    visibility: story.visibility,
    viewsCount: viewsCount(state, story.id),
    isSeenByMe: hasSeen(state, story.id, viewerAccountId),
    createdAt: story.createdAt,
    expiresAt: story.expiresAt
  };
}

function groupStories(state, stories, viewerAccountId) {
  const groupsByAccount = new Map();

  stories.forEach((story) => {
    const publicItem = publicStory(state, story, viewerAccountId);
    if (!publicItem) return;

    const existing = groupsByAccount.get(story.accountId);
    if (existing) {
      existing.items.push(publicItem);
      existing.storiesCount = existing.items.length;
      existing.hasUnseen = existing.items.some((item) => !item.isSeenByMe);
      return;
    }

    groupsByAccount.set(story.accountId, {
      account: publicItem.author,
      storiesCount: 1,
      hasUnseen: !publicItem.isSeenByMe,
      items: [publicItem]
    });
  });

  return Array.from(groupsByAccount.values()).sort((a, b) => {
    const aLast = a.items[a.items.length - 1]?.createdAt || '';
    const bLast = b.items[b.items.length - 1]?.createdAt || '';
    return String(bLast).localeCompare(String(aLast));
  });
}

function createStory({ userId, activeAccountId, input }) {
  const payload = normalizeStoryInput(input);

  return db.transaction((state) => {
    const { account, membership } = getActiveAccountContext(state, userId, activeAccountId);
    assertCanCreateStory(account, membership);

    state.stories = state.stories || [];
    const now = new Date();
    const story = {
      id: createId('story'),
      accountId: account.id,
      authorUserId: userId,
      status: 'active',
      mediaType: payload.mediaType,
      mediaUrl: payload.mediaUrl,
      text: payload.text,
      location: payload.location,
      visibility: payload.visibility,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ONE_DAY_MS).toISOString()
    };

    state.stories.push(story);
    return { story: publicStory(state, story, account.id) };
  });
}

function listStoryFeed({ userId, activeAccountId }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);

  const stories = activeStories(state)
    .filter((story) => canViewStory(state, story, account.id))
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

  return { groups: groupStories(state, stories, account.id) };
}

function listMyStories({ userId, activeAccountId }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);

  const items = activeStories(state)
    .filter((story) => story.accountId === account.id)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    .map((story) => publicStory(state, story, account.id))
    .filter(Boolean);

  return { items };
}

function listAccountStories({ userId, activeAccountId, accountId }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);

  const items = activeStories(state)
    .filter((story) => story.accountId === accountId)
    .filter((story) => canViewStory(state, story, account.id))
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    .map((story) => publicStory(state, story, account.id))
    .filter(Boolean);

  if (items.length === 0) {
    throw new HttpError(404, 'STORY_GROUP_NOT_FOUND', 'Активных Близзов нет');
  }

  return { accountId, items };
}

function getStoryDetail({ userId, activeAccountId, storyId }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);
  const story = findActiveStory(state, storyId);
  if (!canViewStory(state, story, account.id)) {
    throw new HttpError(403, 'STORY_ACCESS_DENIED', 'Близз недоступен');
  }

  return { story: publicStory(state, story, account.id) };
}

function markStoryView({ userId, activeAccountId, storyId }) {
  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    const story = findActiveStory(state, storyId);
    if (!canViewStory(state, story, account.id)) {
      throw new HttpError(403, 'STORY_ACCESS_DENIED', 'Близз недоступен');
    }

    state.storyViews = state.storyViews || [];
    const existing = state.storyViews.find((view) => view.storyId === story.id && view.accountId === account.id);
    const now = new Date().toISOString();
    if (!existing) {
      state.storyViews.push({
        id: createId('story_view'),
        storyId: story.id,
        accountId: account.id,
        userId,
        createdAt: now
      });
    }

    return { storyId: story.id, viewsCount: viewsCount(state, story.id), isSeenByMe: true };
  });
}

function replyToStory({ userId, activeAccountId, storyId, input }) {
  const text = sanitizeString(input && input.text);
  if (!text) {
    throw new HttpError(400, 'STORY_REPLY_REQUIRED', 'Введите ответ');
  }
  if (text.length > 500) {
    throw new HttpError(400, 'STORY_REPLY_TOO_LONG', 'Ответ должен быть не длиннее 500 символов');
  }

  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    const story = findActiveStory(state, storyId);
    if (!canViewStory(state, story, account.id)) {
      throw new HttpError(403, 'STORY_ACCESS_DENIED', 'Близз недоступен');
    }

    state.storyReplies = state.storyReplies || [];
    const now = new Date().toISOString();
    const reply = {
      id: createId('story_reply'),
      storyId: story.id,
      storyAccountId: story.accountId,
      senderAccountId: account.id,
      senderUserId: userId,
      text,
      status: 'sent',
      createdAt: now
    };

    state.storyReplies.push(reply);
    const message = createStoryReplyMessage(state, { reply, actorUserId: userId });
    return { reply: { ...reply, conversationId: message ? message.conversationId : null, messageId: message ? message.id : null } };
  });
}

module.exports = {
  createStory,
  listStoryFeed,
  listMyStories,
  listAccountStories,
  getStoryDetail,
  markStoryView,
  replyToStory
};
