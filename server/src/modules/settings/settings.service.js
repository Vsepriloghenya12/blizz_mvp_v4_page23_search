const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { createId } = require('../../shared/security/password');
const { listActiveBlocksCount } = require('../blocks/blocks.service');

const VISIBILITY_VALUES = ['public', 'followers', 'close_friends', 'nobody'];
const AUDIENCE_VALUES = ['everyone', 'followers', 'close_friends', 'nobody'];
const INVITE_VALUES = ['everyone', 'followers', 'nobody'];
const GEO_VISIBILITY_VALUES = ['public', 'followers', 'nobody'];
const LOCATION_PRECISION_VALUES = ['exact', 'area'];
const RECOMMENDATION_RADIUS_VALUES = ['1km', '3km', '5km', 'city'];

function defaultSettings(account) {
  const now = new Date().toISOString();
  return {
    id: createId('settings'),
    accountId: account.id,
    privacy: {
      isPrivateAccount: Boolean(account.isPrivate),
      defaultStoryVisibility: 'public',
      defaultPostVisibility: 'public',
      defaultVideoVisibility: 'public',
      draftsVisibility: 'only_me',
      closeFriendsCount: 0,
      hiddenAccountsCount: 0,
      blockedAccountsCount: 0
    },
    map: {
      showLiveLocation: false,
      geotagsVisibility: 'public',
      showPublicationsOnMap: true,
      locationPrecision: 'area',
      placesHistoryEnabled: false,
      myPlacesCount: 0,
      recommendationRadius: '3km',
      savedPlacesCount: 0,
      routesCount: 0
    },
    messages: {
      allowMessagesFrom: 'everyone',
      allowStoryRepliesFrom: 'everyone',
      allowGroupInvitesFrom: 'followers',
      gamesInMessagesEnabled: true,
      allowGameInvitesFrom: 'followers',
      messageRequestsCount: 0,
      blockedChatsCount: 0,
      autoSaveSharedPlaces: false,
      chatContentPreview: true
    },
    content: {
      favoritesCount: 0,
      feedMode: 'balanced',
      showcaseMode: 'nearby',
      recommendationsNearby: true,
      showLikeAndShareCounts: true,
      mediaQuality: 'auto',
      recentSearchesCount: 0,
      viewHistoryCount: 0
    },
    safety: {
      restrictedAccountsCount: 0,
      interactionLimitsEnabled: false,
      suspiciousMessagesFilter: true,
      familySafetyMode: false,
      teenRestrictionsEnabled: false,
      reportsCount: 0,
      moderationItemsCount: 0
    },
    app: {
      language: 'ru',
      dataSaver: false,
      devicePermissionsStatus: 'not_configured',
      pwaInstallHintShown: false
    },
    createdAt: now,
    updatedAt: now
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function requireActiveAccount(state, userId, activeAccountId) {
  const membership = state.accountMemberships.find((item) => item.userId === userId && item.accountId === activeAccountId && item.status === 'active');
  if (!membership) {
    throw new HttpError(403, 'ACCOUNT_ACCESS_DENIED', 'Нет доступа к активному аккаунту');
  }

  const account = state.accounts.find((item) => item.id === activeAccountId);
  if (!account) {
    throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Аккаунт не найден');
  }

  return { account, membership };
}

function getOrCreateSettings(state, account) {
  state.accountSettings = state.accountSettings || [];
  let settings = state.accountSettings.find((item) => item.accountId === account.id);
  if (!settings) {
    settings = defaultSettings(account);
    state.accountSettings.push(settings);
  }
  if (!settings.privacy) settings.privacy = defaultSettings(account).privacy;
  if (!settings.map) settings.map = defaultSettings(account).map;
  if (!settings.messages) settings.messages = defaultSettings(account).messages;
  if (!settings.content) settings.content = defaultSettings(account).content;
  if (!settings.safety) settings.safety = defaultSettings(account).safety;
  if (!settings.app) settings.app = defaultSettings(account).app;
  settings.privacy.isPrivateAccount = Boolean(settings.privacy.isPrivateAccount || account.isPrivate);
  settings.map.showLiveLocation = false;
  return settings;
}

function refreshComputedCounts(state, account, settings) {
  settings.privacy.blockedAccountsCount = listActiveBlocksCount(state, account.id);
  const reports = state.reports || [];
  settings.safety.reportsCount = reports.filter((report) => report.reporterAccountId === account.id).length;
  settings.safety.moderationItemsCount = account.type === 'business'
    ? reports.filter((report) => report.businessAccountId === account.id || report.targetAccountId === account.id).length
    : 0;
  return settings;
}

function publicSettings(settings, account, membership) {
  return {
    account: {
      id: account.id,
      type: account.type,
      role: membership.role,
      name: account.name,
      username: account.username
    },
    settings: clone(settings)
  };
}

function applyBoolean(target, key, value) {
  if (value === undefined) return;
  if (typeof value !== 'boolean') {
    throw new HttpError(400, 'INVALID_SETTING', `${key} должен быть boolean`);
  }
  target[key] = value;
}

function applyEnum(target, key, value, allowed) {
  if (value === undefined) return;
  if (!allowed.includes(value)) {
    throw new HttpError(400, 'INVALID_SETTING', `${key} имеет недопустимое значение`);
  }
  target[key] = value;
}

function updateNestedSettings(settings, input) {
  const patch = input || {};

  if (patch.privacy) {
    applyBoolean(settings.privacy, 'isPrivateAccount', patch.privacy.isPrivateAccount);
    applyEnum(settings.privacy, 'defaultStoryVisibility', patch.privacy.defaultStoryVisibility, VISIBILITY_VALUES);
    applyEnum(settings.privacy, 'defaultPostVisibility', patch.privacy.defaultPostVisibility, VISIBILITY_VALUES);
    applyEnum(settings.privacy, 'defaultVideoVisibility', patch.privacy.defaultVideoVisibility, VISIBILITY_VALUES);
  }

  if (patch.map) {
    settings.map.showLiveLocation = false;
    applyEnum(settings.map, 'geotagsVisibility', patch.map.geotagsVisibility, GEO_VISIBILITY_VALUES);
    applyBoolean(settings.map, 'showPublicationsOnMap', patch.map.showPublicationsOnMap);
    applyEnum(settings.map, 'locationPrecision', patch.map.locationPrecision, LOCATION_PRECISION_VALUES);
    applyBoolean(settings.map, 'placesHistoryEnabled', patch.map.placesHistoryEnabled);
    applyEnum(settings.map, 'recommendationRadius', patch.map.recommendationRadius, RECOMMENDATION_RADIUS_VALUES);
  }

  if (patch.messages) {
    applyEnum(settings.messages, 'allowMessagesFrom', patch.messages.allowMessagesFrom, AUDIENCE_VALUES);
    applyEnum(settings.messages, 'allowStoryRepliesFrom', patch.messages.allowStoryRepliesFrom, AUDIENCE_VALUES);
    applyEnum(settings.messages, 'allowGroupInvitesFrom', patch.messages.allowGroupInvitesFrom, INVITE_VALUES);
    applyBoolean(settings.messages, 'gamesInMessagesEnabled', patch.messages.gamesInMessagesEnabled);
    applyEnum(settings.messages, 'allowGameInvitesFrom', patch.messages.allowGameInvitesFrom, INVITE_VALUES);
    applyBoolean(settings.messages, 'autoSaveSharedPlaces', patch.messages.autoSaveSharedPlaces);
    applyBoolean(settings.messages, 'chatContentPreview', patch.messages.chatContentPreview);
  }

  if (patch.content) {
    applyBoolean(settings.content, 'recommendationsNearby', patch.content.recommendationsNearby);
    applyBoolean(settings.content, 'showLikeAndShareCounts', patch.content.showLikeAndShareCounts);
  }

  if (patch.safety) {
    applyBoolean(settings.safety, 'interactionLimitsEnabled', patch.safety.interactionLimitsEnabled);
    applyBoolean(settings.safety, 'suspiciousMessagesFilter', patch.safety.suspiciousMessagesFilter);
    applyBoolean(settings.safety, 'familySafetyMode', patch.safety.familySafetyMode);
    applyBoolean(settings.safety, 'teenRestrictionsEnabled', patch.safety.teenRestrictionsEnabled);
  }

  if (patch.app) {
    applyBoolean(settings.app, 'dataSaver', patch.app.dataSaver);
  }
}

function getMySettings({ userId, activeAccountId }) {
  return db.transaction((state) => {
    const { account, membership } = requireActiveAccount(state, userId, activeAccountId);
    const settings = refreshComputedCounts(state, account, getOrCreateSettings(state, account));
    return publicSettings(settings, account, membership);
  });
}

function updateMySettings({ userId, activeAccountId, input }) {
  return db.transaction((state) => {
    const { account, membership } = requireActiveAccount(state, userId, activeAccountId);
    const settings = refreshComputedCounts(state, account, getOrCreateSettings(state, account));
    updateNestedSettings(settings, input || {});
    settings.map.showLiveLocation = false;
    settings.updatedAt = new Date().toISOString();
    account.isPrivate = Boolean(settings.privacy.isPrivateAccount);
    account.updatedAt = settings.updatedAt;
    refreshComputedCounts(state, account, settings);
    return publicSettings(settings, account, membership);
  });
}

module.exports = { getMySettings, updateMySettings };
