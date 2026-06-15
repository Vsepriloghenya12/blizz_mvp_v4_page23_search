const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { createId } = require('../../shared/security/password');

const PERIODS = new Set(['7d', '30d', '90d']);
const BUSINESS_FULL_ROLES = new Set(['owner', 'admin']);
const BUSINESS_CONTENT_ROLES = new Set(['owner', 'admin', 'smm']);
const BUSINESS_MESSAGE_ROLES = new Set(['owner', 'admin', 'messages']);
const EVENT_TYPES = new Set([
  'profile_view',
  'post_view',
  'video_view',
  'story_view',
  'offer_view',
  'save',
  'message_sent',
  'route_click',
  'phone_click',
  'site_click',
  'follow',
  'like',
  'comment',
  'share',
  'business_action'
]);

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function ensureArrays(state) {
  state.metricsEvents = state.metricsEvents || [];
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

function normalizePeriod(period) {
  const safePeriod = sanitizeString(period) || '7d';
  return PERIODS.has(safePeriod) ? safePeriod : '7d';
}

function daysForPeriod(period) {
  if (period === '90d') return 90;
  if (period === '30d') return 30;
  return 7;
}

function periodStart(period) {
  return Date.now() - daysForPeriod(period) * 24 * 60 * 60 * 1000;
}

function inPeriod(value, period) {
  const time = Date.parse(value || '');
  if (!Number.isFinite(time)) return false;
  return time >= periodStart(period);
}

function publicAccount(state, accountId) {
  const account = (state.accounts || []).find((item) => item.id === accountId && item.status !== 'archived');
  if (!account) return null;
  const profile = account.type === 'business'
    ? (state.businessProfiles || []).find((item) => item.accountId === account.id)
    : null;
  return {
    id: account.id,
    type: account.type,
    name: account.name,
    username: account.username,
    avatar: account.avatar || null,
    businessCategory: profile ? profile.category : null
  };
}

function getCapabilities(account, membership) {
  if (account.type !== 'business') {
    return {
      canViewPersonal: true,
      canViewBusiness: false,
      canViewContent: true,
      canViewOffers: false,
      canViewActions: false,
      canViewMessages: true
    };
  }

  return {
    canViewPersonal: false,
    canViewBusiness: BUSINESS_FULL_ROLES.has(membership.role) || BUSINESS_CONTENT_ROLES.has(membership.role) || BUSINESS_MESSAGE_ROLES.has(membership.role),
    canViewContent: BUSINESS_CONTENT_ROLES.has(membership.role),
    canViewOffers: BUSINESS_CONTENT_ROLES.has(membership.role),
    canViewActions: BUSINESS_FULL_ROLES.has(membership.role),
    canViewMessages: BUSINESS_MESSAGE_ROLES.has(membership.role)
  };
}

function assertCapability(capabilities, key, code, message) {
  if (!capabilities[key]) {
    throw new HttpError(403, code, message);
  }
}

function accountPosts(state, accountId) {
  return (state.posts || []).filter((post) => post.accountId === accountId && post.status === 'published');
}

function accountVideos(state, accountId) {
  return (state.videos || []).filter((video) => video.accountId === accountId && video.status === 'published');
}

function accountStories(state, accountId) {
  return (state.stories || []).filter((story) => story.accountId === accountId && story.status !== 'deleted');
}

function accountOffers(state, accountId) {
  return (state.offers || []).filter((offer) => offer.businessAccountId === accountId && offer.status !== 'archived');
}

function eventCount(state, accountId, eventType, period) {
  ensureArrays(state);
  return state.metricsEvents.filter((event) => {
    return event.accountId === accountId
      && event.eventType === eventType
      && event.status !== 'deleted'
      && inPeriod(event.createdAt, period);
  }).length;
}

function eventCountByTarget(state, accountId, eventType, targetType, targetId, period) {
  ensureArrays(state);
  return state.metricsEvents.filter((event) => {
    return event.accountId === accountId
      && event.eventType === eventType
      && event.targetType === targetType
      && event.targetId === targetId
      && event.status !== 'deleted'
      && inPeriod(event.createdAt, period);
  }).length;
}

function countPostLikes(state, posts, period) {
  const ids = new Set(posts.map((post) => post.id));
  return (state.postLikes || []).filter((like) => ids.has(like.postId) && like.status === 'active' && inPeriod(like.updatedAt || like.createdAt, period)).length;
}

function countVideoLikes(state, videos, period) {
  const ids = new Set(videos.map((video) => video.id));
  return (state.videoLikes || []).filter((like) => ids.has(like.videoId) && like.status === 'active' && inPeriod(like.updatedAt || like.createdAt, period)).length;
}

function countComments(state, posts, period) {
  const ids = new Set(posts.map((post) => post.id));
  return (state.postComments || []).filter((comment) => ids.has(comment.postId) && comment.status === 'active' && inPeriod(comment.createdAt, period)).length;
}

function countSaves(state, accountId, posts, videos, offers, period) {
  const postIds = new Set(posts.map((post) => post.id));
  const videoIds = new Set(videos.map((video) => video.id));
  const offerIds = new Set(offers.map((offer) => offer.id));
  return (state.savedItems || []).filter((item) => {
    if (item.status !== 'active' || !inPeriod(item.createdAt || item.updatedAt, period)) return false;
    if (item.targetType === 'business' && item.targetId === accountId) return true;
    if (item.targetType === 'post' && postIds.has(item.targetId)) return true;
    if (item.targetType === 'video' && videoIds.has(item.targetId)) return true;
    if (item.targetType === 'offer' && offerIds.has(item.targetId)) return true;
    return false;
  }).length;
}

function countFollowers(state, accountId, period) {
  return (state.follows || []).filter((follow) => {
    return follow.followingAccountId === accountId
      && follow.status === 'active'
      && inPeriod(follow.acceptedAt || follow.updatedAt || follow.createdAt, period);
  }).length;
}

function accountConversations(state, accountId) {
  return (state.conversations || []).filter((conversation) => {
    return conversation.status !== 'archived' && (conversation.participantAccountIds || []).includes(accountId);
  });
}

function countMessagesForAccount(state, accountId, period) {
  const conversationIds = new Set(accountConversations(state, accountId).map((conversation) => conversation.id));
  return (state.messages || []).filter((message) => {
    return conversationIds.has(message.conversationId) && message.senderAccountId !== accountId && inPeriod(message.createdAt, period);
  }).length;
}

function topContentItem(state, accountId, item, targetType, period) {
  const likes = targetType === 'post'
    ? (state.postLikes || []).filter((like) => like.postId === item.id && like.status === 'active').length
    : targetType === 'video'
      ? (state.videoLikes || []).filter((like) => like.videoId === item.id && like.status === 'active').length
      : 0;
  const comments = targetType === 'post'
    ? (state.postComments || []).filter((comment) => comment.postId === item.id && comment.status === 'active').length
    : 0;
  const saves = (state.savedItems || []).filter((save) => save.targetType === targetType && save.targetId === item.id && save.status === 'active').length;
  const views = eventCountByTarget(state, accountId, `${targetType}_view`, targetType, item.id, period);
  const title = targetType === 'post'
    ? (item.text || 'Пост').slice(0, 80)
    : targetType === 'video'
      ? (item.description || 'Видео').slice(0, 80)
      : (item.text || 'Близз').slice(0, 80);
  const score = views + likes * 2 + comments * 3 + saves * 2;
  return {
    id: item.id,
    type: targetType,
    title,
    views,
    likes,
    comments,
    saves,
    score,
    createdAt: item.publishedAt || item.createdAt
  };
}

function buildSummary(state, account, membership, period) {
  const capabilities = getCapabilities(account, membership);
  const posts = accountPosts(state, account.id);
  const videos = accountVideos(state, account.id);
  const stories = accountStories(state, account.id);
  const offers = accountOffers(state, account.id);
  const profileViews = eventCount(state, account.id, 'profile_view', period);
  const postViews = eventCount(state, account.id, 'post_view', period);
  const videoViews = eventCount(state, account.id, 'video_view', period);
  const storyViews = (state.storyViews || []).filter((view) => {
    const story = stories.find((item) => item.id === view.storyId);
    return story && inPeriod(view.createdAt, period);
  }).length + eventCount(state, account.id, 'story_view', period);
  const offerViews = eventCount(state, account.id, 'offer_view', period);
  const likes = countPostLikes(state, posts, period) + countVideoLikes(state, videos, period);
  const comments = countComments(state, posts, period);
  const saves = countSaves(state, account.id, posts, videos, offers, period);
  const shares = eventCount(state, account.id, 'share', period);
  const newFollowers = countFollowers(state, account.id, period);
  const messages = countMessagesForAccount(state, account.id, period) + eventCount(state, account.id, 'message_sent', period);
  const routes = eventCount(state, account.id, 'route_click', period);
  const phoneClicks = eventCount(state, account.id, 'phone_click', period);
  const siteClicks = eventCount(state, account.id, 'site_click', period);

  return {
    period,
    account: publicAccount(state, account.id),
    role: membership.role,
    capabilities,
    overview: {
      profileViews,
      reach: profileViews + postViews + videoViews + storyViews + offerViews,
      engagement: likes + comments + saves + shares,
      newFollowers,
      messages: capabilities.canViewMessages ? messages : 0
    },
    personal: account.type === 'personal' ? {
      profileViews,
      postViews,
      videoViews,
      storyViews,
      likes,
      comments,
      saves,
      shares,
      newFollowers
    } : null,
    business: account.type === 'business' ? {
      profileViews,
      messages: capabilities.canViewMessages ? messages : 0,
      routes: capabilities.canViewBusiness ? routes : 0,
      phoneClicks: capabilities.canViewBusiness ? phoneClicks : 0,
      siteClicks: capabilities.canViewBusiness ? siteClicks : 0,
      saves: capabilities.canViewBusiness ? saves : 0,
      followers: capabilities.canViewBusiness ? newFollowers : 0,
      offerViews: capabilities.canViewOffers ? offerViews : 0,
      activeOffers: capabilities.canViewOffers ? offers.filter((offer) => offer.status === 'active').length : 0
    } : null
  };
}

function getSummary({ userId, activeAccountId, period }) {
  const state = db.read();
  const { account, membership } = requireActiveAccount(state, userId, activeAccountId);
  return buildSummary(state, account, membership, normalizePeriod(period));
}

function getContentMetrics({ userId, activeAccountId, period }) {
  const state = db.read();
  const { account, membership } = requireActiveAccount(state, userId, activeAccountId);
  const safePeriod = normalizePeriod(period);
  const capabilities = getCapabilities(account, membership);
  assertCapability(capabilities, 'canViewContent', 'METRICS_CONTENT_FORBIDDEN', 'Нет доступа к метрикам контента');
  const items = [
    ...accountPosts(state, account.id).map((item) => topContentItem(state, account.id, item, 'post', safePeriod)),
    ...accountVideos(state, account.id).map((item) => topContentItem(state, account.id, item, 'video', safePeriod)),
    ...accountStories(state, account.id).map((item) => topContentItem(state, account.id, item, 'story', safePeriod))
  ].sort((a, b) => b.score - a.score || String(b.createdAt).localeCompare(String(a.createdAt)));
  return { period: safePeriod, account: publicAccount(state, account.id), items };
}

function getBusinessMetrics({ userId, activeAccountId, period }) {
  const state = db.read();
  const { account, membership } = requireActiveAccount(state, userId, activeAccountId);
  const safePeriod = normalizePeriod(period);
  const capabilities = getCapabilities(account, membership);
  if (account.type !== 'business') {
    throw new HttpError(400, 'METRICS_BUSINESS_ONLY', 'Бизнес-метрики доступны только бизнес-аккаунту');
  }
  assertCapability(capabilities, 'canViewBusiness', 'METRICS_BUSINESS_FORBIDDEN', 'Нет доступа к бизнес-метрикам');
  return { period: safePeriod, account: publicAccount(state, account.id), business: buildSummary(state, account, membership, safePeriod).business };
}

function getOfferMetrics({ userId, activeAccountId, period }) {
  const state = db.read();
  const { account, membership } = requireActiveAccount(state, userId, activeAccountId);
  const safePeriod = normalizePeriod(period);
  const capabilities = getCapabilities(account, membership);
  if (account.type !== 'business') {
    throw new HttpError(400, 'METRICS_OFFERS_BUSINESS_ONLY', 'Метрики предложений доступны только бизнес-аккаунту');
  }
  assertCapability(capabilities, 'canViewOffers', 'METRICS_OFFERS_FORBIDDEN', 'Нет доступа к метрикам предложений');
  const items = accountOffers(state, account.id).map((offer) => {
    const saves = (state.savedItems || []).filter((item) => item.targetType === 'offer' && item.targetId === offer.id && item.status === 'active' && inPeriod(item.createdAt || item.updatedAt, safePeriod)).length;
    const views = eventCountByTarget(state, account.id, 'offer_view', 'offer', offer.id, safePeriod);
    const routeClicks = eventCountByTarget(state, account.id, 'route_click', 'offer', offer.id, safePeriod);
    const shares = eventCountByTarget(state, account.id, 'share', 'offer', offer.id, safePeriod);
    return {
      id: offer.id,
      title: offer.title,
      type: offer.type,
      status: offer.status,
      views,
      saves,
      routeClicks,
      shares,
      createdAt: offer.createdAt
    };
  }).sort((a, b) => (b.views + b.saves + b.routeClicks + b.shares) - (a.views + a.saves + a.routeClicks + a.shares));
  return { period: safePeriod, account: publicAccount(state, account.id), items };
}

function getActionMetrics({ userId, activeAccountId, period }) {
  const state = db.read();
  const { account, membership } = requireActiveAccount(state, userId, activeAccountId);
  const safePeriod = normalizePeriod(period);
  const capabilities = getCapabilities(account, membership);
  assertCapability(capabilities, 'canViewActions', 'METRICS_ACTIONS_FORBIDDEN', 'Нет доступа к журналу действий');
  const items = (state.metricsEvents || [])
    .filter((event) => event.accountId === account.id && event.eventType === 'business_action' && event.status !== 'deleted' && inPeriod(event.createdAt, safePeriod))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((event) => ({
      id: event.id,
      actorAccountId: event.actorAccountId || null,
      actor: publicAccount(state, event.actorAccountId),
      targetType: event.targetType || null,
      targetId: event.targetId || null,
      metadata: event.metadata || {},
      createdAt: event.createdAt
    }));
  return { period: safePeriod, account: publicAccount(state, account.id), items };
}

function recordMetricEvent({ userId, activeAccountId, input }) {
  const eventType = sanitizeString(input && input.eventType);
  if (!EVENT_TYPES.has(eventType)) {
    throw new HttpError(400, 'METRIC_EVENT_TYPE_INVALID', 'Неподдерживаемый тип события метрики');
  }

  return db.transaction((state) => {
    ensureArrays(state);
    const { account } = requireActiveAccount(state, userId, activeAccountId);
    const now = new Date().toISOString();
    const event = {
      id: createId('metric'),
      accountId: account.id,
      actorAccountId: account.id,
      eventType,
      targetType: sanitizeString(input && input.targetType) || null,
      targetId: sanitizeString(input && input.targetId) || null,
      metadata: input && typeof input.metadata === 'object' && !Array.isArray(input.metadata) ? input.metadata : {},
      status: 'active',
      createdAt: now
    };
    state.metricsEvents.push(event);
    return { event };
  });
}

module.exports = {
  getSummary,
  getContentMetrics,
  getBusinessMetrics,
  getOfferMetrics,
  getActionMetrics,
  recordMetricEvent
};
