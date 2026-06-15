const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { createId } = require('../../shared/security/password');

const CATEGORY_BY_TYPE = {
  direct_message: 'directMessages',
  group_message: 'groupMessages',
  business_message: 'businessMessages',
  story_reply: 'storyReplies',
  follow: 'follows',
  follow_request: 'follows',
  follow_request_accepted: 'follows',
  comment: 'comments',
  post_like: 'likes',
  video_like: 'likes',
  game_invite: 'games',
  game_result: 'games',
  business: 'business',
  security: 'security',
  system: 'system'
};

const DEFAULT_SETTINGS = {
  pushEnabled: false,
  inAppEnabled: true,
  directMessages: true,
  groupMessages: true,
  businessMessages: true,
  storyReplies: true,
  follows: true,
  comments: true,
  likes: true,
  stories: true,
  videos: true,
  games: true,
  business: true,
  sounds: true,
  security: true,
  system: true
};

const SETTING_KEYS = new Set(Object.keys(DEFAULT_SETTINGS));

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function ensureArrays(state) {
  state.notifications = state.notifications || [];
  state.notificationSettings = state.notificationSettings || [];
  state.pushTokens = state.pushTokens || [];
}

function requireActiveAccount(state, userId, activeAccountId) {
  const membership = (state.accountMemberships || []).find((item) => {
    return item.userId === userId && item.accountId === activeAccountId && item.status === 'active';
  });
  if (!membership) {
    throw new HttpError(403, 'ACCOUNT_ACCESS_DENIED', 'Нет доступа к активному аккаунту');
  }

  const account = (state.accounts || []).find((item) => item.id === activeAccountId && item.status !== 'archived');
  if (!account) {
    throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Аккаунт не найден');
  }

  return { account, membership };
}

function publicActor(state, accountId) {
  if (!accountId) return null;
  const account = (state.accounts || []).find((item) => item.id === accountId && item.status !== 'archived');
  if (!account) return null;
  const businessProfile = account.type === 'business'
    ? (state.businessProfiles || []).find((item) => item.accountId === account.id)
    : null;
  return {
    id: account.id,
    type: account.type,
    name: account.name,
    username: account.username,
    avatar: account.avatar || null,
    businessCategory: businessProfile ? businessProfile.category : null
  };
}

function normalizeSettings(raw) {
  return {
    ...DEFAULT_SETTINGS,
    ...(raw || {})
  };
}

function getOrCreateNotificationSettingsRecord(state, accountId) {
  ensureArrays(state);
  let record = state.notificationSettings.find((item) => item.accountId === accountId);
  if (!record) {
    const now = new Date().toISOString();
    record = {
      id: createId('notif_settings'),
      accountId,
      ...DEFAULT_SETTINGS,
      createdAt: now,
      updatedAt: now
    };
    state.notificationSettings.push(record);
  }
  return record;
}

function getSettingsForAccount(state, accountId) {
  const record = getOrCreateNotificationSettingsRecord(state, accountId);
  return normalizeSettings(record);
}

function publicSettings(record) {
  return {
    id: record.id,
    accountId: record.accountId,
    pushEnabled: Boolean(record.pushEnabled),
    inAppEnabled: record.inAppEnabled !== false,
    directMessages: record.directMessages !== false,
    groupMessages: record.groupMessages !== false,
    businessMessages: record.businessMessages !== false,
    storyReplies: record.storyReplies !== false,
    follows: record.follows !== false,
    comments: record.comments !== false,
    likes: record.likes !== false,
    stories: record.stories !== false,
    videos: record.videos !== false,
    games: record.games !== false,
    business: record.business !== false,
    sounds: record.sounds !== false,
    security: record.security !== false,
    system: record.system !== false,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function getNotificationCategory(type, explicitCategory) {
  const safeCategory = sanitizeString(explicitCategory);
  return safeCategory || CATEGORY_BY_TYPE[type] || 'system';
}

function canCreateNotification(state, accountId, type, category) {
  const settings = getSettingsForAccount(state, accountId);
  if (settings.inAppEnabled === false) return false;
  const key = getNotificationCategory(type, category);
  if (Object.prototype.hasOwnProperty.call(settings, key) && settings[key] === false) {
    return false;
  }
  return true;
}

function findRecipientUserId(state, accountId) {
  const membership = (state.accountMemberships || []).find((item) => item.accountId === accountId && item.status === 'active');
  return membership ? membership.userId : null;
}

function createNotification(state, input) {
  ensureArrays(state);
  const accountId = sanitizeString(input && input.accountId);
  const type = sanitizeString(input && input.type) || 'system';
  if (!accountId) return null;

  const account = (state.accounts || []).find((item) => item.id === accountId && item.status !== 'archived');
  if (!account) return null;

  const actorAccountId = sanitizeString(input && input.actorAccountId) || null;
  if (actorAccountId && actorAccountId === accountId) return null;

  const category = getNotificationCategory(type, input && input.category);
  if (!canCreateNotification(state, accountId, type, category)) return null;

  const now = new Date().toISOString();
  const targetType = sanitizeString(input && input.targetType) || null;
  const targetId = sanitizeString(input && input.targetId) || null;

  if ((type === 'post_like' || type === 'video_like') && targetType && targetId) {
    const existing = state.notifications.find((item) => {
      return item.accountId === accountId
        && item.type === type
        && item.targetType === targetType
        && item.targetId === targetId
        && item.isRead === false
        && item.status !== 'deleted';
    });
    if (existing) {
      const actorIds = Array.from(new Set([...(existing.actorAccountIds || []), actorAccountId].filter(Boolean)));
      existing.actorAccountIds = actorIds;
      existing.actorAccountId = actorAccountId || existing.actorAccountId;
      existing.title = sanitizeString(input && input.title) || existing.title;
      existing.body = actorIds.length > 1 ? `Новых отметок: ${actorIds.length}` : (sanitizeString(input && input.body) || existing.body);
      existing.updatedAt = now;
      existing.createdAt = existing.createdAt || now;
      return existing;
    }
  }

  const notification = {
    id: createId('notif'),
    accountId,
    userId: sanitizeString(input && input.userId) || findRecipientUserId(state, accountId),
    type,
    category,
    title: sanitizeString(input && input.title) || 'Уведомление',
    body: sanitizeString(input && input.body),
    targetType,
    targetId,
    actorAccountId,
    actorAccountIds: actorAccountId ? [actorAccountId] : [],
    isRead: false,
    status: 'active',
    createdAt: now,
    updatedAt: now
  };
  state.notifications.push(notification);
  return notification;
}

function publicNotification(state, notification) {
  return {
    id: notification.id,
    accountId: notification.accountId,
    userId: notification.userId || null,
    type: notification.type,
    category: notification.category || getNotificationCategory(notification.type),
    title: notification.title,
    body: notification.body || '',
    targetType: notification.targetType || null,
    targetId: notification.targetId || null,
    actorAccountId: notification.actorAccountId || null,
    actor: publicActor(state, notification.actorAccountId),
    actorAccountIds: notification.actorAccountIds || [],
    isRead: Boolean(notification.isRead),
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt
  };
}

function listNotifications({ userId, activeAccountId, filter }) {
  const state = db.read();
  requireActiveAccount(state, userId, activeAccountId);
  ensureArrays(state);
  const safeFilter = sanitizeString(filter) || 'all';
  let items = state.notifications.filter((item) => {
    return item.accountId === activeAccountId && item.status !== 'deleted';
  });

  if (safeFilter === 'messages') {
    items = items.filter((item) => ['directMessages', 'groupMessages', 'businessMessages', 'storyReplies'].includes(item.category));
  } else if (safeFilter === 'activity') {
    items = items.filter((item) => ['follows', 'comments', 'likes', 'stories', 'videos', 'games'].includes(item.category));
  } else if (safeFilter === 'business') {
    items = items.filter((item) => item.category === 'business' || item.category === 'businessMessages');
  } else if (safeFilter === 'system') {
    items = items.filter((item) => item.category === 'security' || item.category === 'system');
  } else if (safeFilter === 'unread') {
    items = items.filter((item) => item.isRead === false);
  }

  const allItems = state.notifications.filter((item) => item.accountId === activeAccountId && item.status !== 'deleted');
  return {
    filter: ['all', 'messages', 'activity', 'business', 'system', 'unread'].includes(safeFilter) ? safeFilter : 'all',
    unreadCount: allItems.filter((item) => item.isRead === false).length,
    items: items
      .sort((a, b) => String(b.createdAt || b.updatedAt).localeCompare(String(a.createdAt || a.updatedAt)))
      .map((item) => publicNotification(state, item))
  };
}

function markNotificationRead({ userId, activeAccountId, notificationId }) {
  return db.transaction((state) => {
    requireActiveAccount(state, userId, activeAccountId);
    ensureArrays(state);
    const notification = state.notifications.find((item) => item.id === notificationId && item.accountId === activeAccountId && item.status !== 'deleted');
    if (!notification) {
      throw new HttpError(404, 'NOTIFICATION_NOT_FOUND', 'Уведомление не найдено');
    }
    notification.isRead = true;
    notification.readAt = new Date().toISOString();
    notification.updatedAt = notification.readAt;
    return { notification: publicNotification(state, notification), unreadCount: state.notifications.filter((item) => item.accountId === activeAccountId && item.status !== 'deleted' && item.isRead === false).length };
  });
}

function markAllNotificationsRead({ userId, activeAccountId }) {
  return db.transaction((state) => {
    requireActiveAccount(state, userId, activeAccountId);
    ensureArrays(state);
    const now = new Date().toISOString();
    let count = 0;
    state.notifications.forEach((item) => {
      if (item.accountId === activeAccountId && item.status !== 'deleted' && item.isRead === false) {
        item.isRead = true;
        item.readAt = now;
        item.updatedAt = now;
        count += 1;
      }
    });
    return { markedCount: count, unreadCount: 0 };
  });
}

function getNotificationSettings({ userId, activeAccountId }) {
  return db.transaction((state) => {
    requireActiveAccount(state, userId, activeAccountId);
    ensureArrays(state);
    return { settings: publicSettings(getOrCreateNotificationSettingsRecord(state, activeAccountId)) };
  });
}

function updateNotificationSettings({ userId, activeAccountId, input }) {
  return db.transaction((state) => {
    requireActiveAccount(state, userId, activeAccountId);
    ensureArrays(state);
    const record = getOrCreateNotificationSettingsRecord(state, activeAccountId);
    const patch = input || {};
    Object.keys(patch).forEach((key) => {
      if (SETTING_KEYS.has(key) && typeof patch[key] === 'boolean') {
        record[key] = patch[key];
      }
    });
    record.updatedAt = new Date().toISOString();
    return { settings: publicSettings(record) };
  });
}

function savePushToken({ userId, activeAccountId, input }) {
  const token = sanitizeString(input && input.token);
  const platform = sanitizeString(input && input.platform) || 'web';
  const deviceId = sanitizeString(input && input.deviceId);
  if (!token) {
    throw new HttpError(400, 'PUSH_TOKEN_REQUIRED', 'Не передан push-токен');
  }
  if (!deviceId) {
    throw new HttpError(400, 'PUSH_DEVICE_REQUIRED', 'Не передан идентификатор устройства');
  }
  if (!['android', 'web'].includes(platform)) {
    throw new HttpError(400, 'PUSH_PLATFORM_INVALID', 'Неподдерживаемая платформа');
  }

  return db.transaction((state) => {
    requireActiveAccount(state, userId, activeAccountId);
    ensureArrays(state);
    const now = new Date().toISOString();
    let pushToken = state.pushTokens.find((item) => item.userId === userId && item.deviceId === deviceId);
    if (pushToken) {
      pushToken.token = token;
      pushToken.platform = platform;
      pushToken.isActive = true;
      pushToken.updatedAt = now;
    } else {
      pushToken = {
        id: createId('push'),
        userId,
        platform,
        token,
        deviceId,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
      state.pushTokens.push(pushToken);
    }
    return { pushToken: { id: pushToken.id, platform: pushToken.platform, deviceId: pushToken.deviceId, isActive: pushToken.isActive, createdAt: pushToken.createdAt, updatedAt: pushToken.updatedAt } };
  });
}

function deletePushToken({ userId, activeAccountId, deviceId }) {
  const safeDeviceId = sanitizeString(deviceId);
  return db.transaction((state) => {
    requireActiveAccount(state, userId, activeAccountId);
    ensureArrays(state);
    const pushToken = state.pushTokens.find((item) => item.userId === userId && item.deviceId === safeDeviceId && item.isActive !== false);
    if (pushToken) {
      pushToken.isActive = false;
      pushToken.updatedAt = new Date().toISOString();
    }
    return { deviceId: safeDeviceId, isActive: false };
  });
}

module.exports = {
  createNotification,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationSettings,
  updateNotificationSettings,
  savePushToken,
  deletePushToken,
  publicNotification
};
