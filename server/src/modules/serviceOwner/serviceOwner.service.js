const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { logout: authLogout } = require('../auth/auth.service');
const { verifyPassword, createId, createToken } = require('../../shared/security/password');

const PERIODS = new Set(['7d', '30d', '90d']);
const SERVICE_OWNER_STATUSES = new Set(['service_owner', 'service_admin']);
const SERVICE_OWNER_FLAGS = new Set(['isServiceOwner', 'isServiceAdmin', 'isServiceModerator']);

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
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
  return Number.isFinite(time) && time >= periodStart(period);
}

function isServiceOwnerUser(user) {
  if (!user) return false;
  if (SERVICE_OWNER_STATUSES.has(user.status)) return true;
  return Array.from(SERVICE_OWNER_FLAGS).some((flag) => Boolean(user[flag]));
}

function publicServiceOwnerUser(user) {
  return {
    id: user.id,
    login: user.login,
    status: user.status,
    isServiceOwner: true,
    createdAt: user.createdAt
  };
}

function findServiceSession(token) {
  const cleanToken = sanitizeString(token);
  if (!cleanToken) return null;
  const state = db.read();
  const session = (state.sessions || []).find((item) => item.token === cleanToken && !item.revokedAt);
  if (!session) return null;
  const user = (state.users || []).find((item) => item.id === session.userId);
  if (!user) return null;
  return { state, session, user };
}

function requireServiceOwner(token) {
  const found = findServiceSession(token);
  if (!found) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Сессия владельца приложения не найдена');
  }
  if (!isServiceOwnerUser(found.user)) {
    throw new HttpError(403, 'SERVICE_OWNER_FORBIDDEN', 'Панель владельца приложения доступна только владельцу платформы');
  }

  return found;
}

function loginServiceOwner({ login, password }) {
  const normalizedLogin = sanitizeString(login).toLowerCase();
  const normalizedPassword = String(password || '');
  if (!normalizedLogin || !normalizedPassword) {
    throw new HttpError(400, 'SERVICE_OWNER_CREDENTIALS_REQUIRED', 'Введите логин и пароль владельца приложения');
  }

  return db.transaction((state) => {
    const user = (state.users || []).find((item) => item.login === normalizedLogin);
    if (!user) {
      throw new HttpError(404, 'USER_NOT_FOUND', 'Аккаунт владельца приложения не найден');
    }
    if (!isServiceOwnerUser(user)) {
      throw new HttpError(403, 'SERVICE_OWNER_FORBIDDEN', 'Этот аккаунт не имеет доступа к панели владельца приложения');
    }
    const passwordValid = verifyPassword(normalizedPassword, user.passwordSalt, user.passwordHash);
    if (!passwordValid) {
      throw new HttpError(401, 'INVALID_PASSWORD', 'Неверный пароль');
    }
    const membership = (state.accountMemberships || []).find((item) => item.userId === user.id && item.status === 'active');
    if (!membership) {
      throw new HttpError(403, 'NO_ACTIVE_ACCOUNT', 'Нет технического аккаунта для сервисной сессии');
    }
    const now = new Date().toISOString();
    const session = {
      id: createId('session'),
      token: createToken('blizz_service_owner_session'),
      userId: user.id,
      activeAccountId: membership.accountId,
      createdAt: now,
      lastSeenAt: now,
      revokedAt: null,
      kind: 'service_owner'
    };
    state.sessions.push(session);
    return {
      user: publicServiceOwnerUser(user),
      session: {
        token: session.token,
        createdAt: session.createdAt,
        lastSeenAt: session.lastSeenAt
      }
    };
  });
}

function getServiceOwnerSession(token) {
  const found = requireServiceOwner(token);
  return {
    user: publicServiceOwnerUser(found.user),
    session: {
      token: found.session.token,
      createdAt: found.session.createdAt,
      lastSeenAt: found.session.lastSeenAt || found.session.createdAt
    }
  };
}

function logoutServiceOwner(token) {
  requireServiceOwner(token);
  return authLogout(token);
}

function publicAccount(state, account) {
  if (!account) return null;
  const profile = account.type === 'business'
    ? (state.businessProfiles || []).find((item) => item.accountId === account.id)
    : null;
  return {
    id: account.id,
    type: account.type,
    name: account.name,
    username: account.username,
    status: account.status || 'active',
    ownerUserId: account.ownerUserId || null,
    isPrivate: Boolean(account.isPrivate),
    category: profile ? profile.category : null,
    address: profile ? profile.address || '' : '',
    phone: profile ? profile.phone || '' : '',
    website: profile ? profile.website || '' : '',
    createdAt: account.createdAt,
    updatedAt: account.updatedAt
  };
}

function publicUser(user) {
  return {
    id: user.id,
    login: user.login,
    status: user.status,
    isServiceOwner: isServiceOwnerUser(user),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function publicBusiness(state, account) {
  const profile = (state.businessProfiles || []).find((item) => item.accountId === account.id) || null;
  const offers = (state.offers || []).filter((offer) => offer.businessAccountId === account.id && offer.status !== 'deleted');
  const reports = (state.reports || []).filter((report) => report.businessAccountId === account.id);
  const conversations = (state.conversations || []).filter((conversation) => {
    return conversation.status !== 'archived' && (conversation.participantAccountIds || []).includes(account.id);
  });
  return {
    ...publicAccount(state, account),
    category: profile ? profile.category : null,
    description: profile ? profile.description || '' : '',
    offersTotal: offers.length,
    activeOffers: offers.filter((offer) => offer.status === 'active').length,
    reportsTotal: reports.length,
    conversationsTotal: conversations.length
  };
}

function uniqueCount(values) {
  return new Set(values.filter(Boolean)).size;
}

function count(items, predicate) {
  return items.filter(predicate).length;
}

function aggregateReports(state) {
  const reports = state.reports || [];
  const byStatus = {
    new: count(reports, (item) => item.moderationStatus === 'new'),
    reviewing: count(reports, (item) => item.moderationStatus === 'reviewing'),
    resolved: count(reports, (item) => item.moderationStatus === 'resolved'),
    rejected: count(reports, (item) => item.moderationStatus === 'rejected')
  };
  const byTargetType = reports.reduce((acc, report) => {
    const key = report.targetType || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return { total: reports.length, byStatus, byTargetType };
}

function aggregateEvents(state, period) {
  const events = (state.metricsEvents || []).filter((event) => event.status !== 'deleted' && inPeriod(event.createdAt, period));
  const byType = events.reduce((acc, event) => {
    const key = event.eventType || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return { total: events.length, byType };
}

function buildOverview(state, period) {
  const users = state.users || [];
  const accounts = state.accounts || [];
  const businessAccounts = accounts.filter((account) => account.type === 'business' && account.status !== 'archived');
  const personalAccounts = accounts.filter((account) => account.type === 'personal' && account.status !== 'archived');
  const sessions = state.sessions || [];
  const events = aggregateEvents(state, period);
  const reports = aggregateReports(state);

  return {
    period,
    users: {
      total: users.length,
      new: count(users, (user) => inPeriod(user.createdAt, period)),
      active: uniqueCount(sessions.filter((session) => !session.revokedAt && inPeriod(session.lastSeenAt || session.createdAt, period)).map((session) => session.userId)),
      serviceOwners: users.filter(isServiceOwnerUser).length
    },
    accounts: {
      total: accounts.length,
      personal: personalAccounts.length,
      business: businessAccounts.length,
      newBusiness: count(businessAccounts, (account) => inPeriod(account.createdAt, period)),
      privatePersonal: count(personalAccounts, (account) => Boolean(account.isPrivate))
    },
    content: {
      posts: (state.posts || []).filter((item) => item.status !== 'deleted').length,
      videos: (state.videos || []).filter((item) => item.status !== 'deleted').length,
      stories: (state.stories || []).filter((item) => item.status !== 'deleted').length,
      offers: (state.offers || []).filter((item) => item.status !== 'deleted').length,
      comments: (state.postComments || []).filter((item) => item.status !== 'deleted').length,
      messages: (state.messages || []).filter((item) => item.status !== 'deleted').length
    },
    activity: {
      feedViews: events.byType.feed_view || 0,
      showcaseViews: events.byType.showcase_view || 0,
      mapViews: events.byType.map_view || 0,
      searches: (state.recentSearches || []).filter((item) => inPeriod(item.createdAt, period)).length,
      profileViews: events.byType.profile_view || 0,
      offerViews: events.byType.offer_view || 0,
      routeClicks: events.byType.route_click || 0,
      phoneClicks: events.byType.phone_click || 0,
      siteClicks: events.byType.site_click || 0,
      saves: (state.savedItems || []).filter((item) => item.status === 'active' && inPeriod(item.createdAt || item.updatedAt, period)).length,
      shares: events.byType.share || 0,
      comments: (state.postComments || []).filter((item) => item.status !== 'deleted' && inPeriod(item.createdAt, period)).length,
      likes: (state.postLikes || []).filter((item) => item.status === 'active' && inPeriod(item.createdAt || item.updatedAt, period)).length
        + (state.videoLikes || []).filter((item) => item.status === 'active' && inPeriod(item.createdAt || item.updatedAt, period)).length
    },
    business: {
      total: businessAccounts.length,
      new: count(businessAccounts, (account) => inPeriod(account.createdAt, period)),
      activeWithOffers: businessAccounts.filter((account) => (state.offers || []).some((offer) => offer.businessAccountId === account.id && offer.status === 'active')).length,
      offers: (state.offers || []).filter((item) => item.status !== 'deleted').length,
      activeOffers: (state.offers || []).filter((item) => item.status === 'active').length,
      messages: (state.conversations || []).filter((item) => item.type === 'business' && item.status !== 'archived').length,
      routeClicks: events.byType.route_click || 0,
      phoneClicks: events.byType.phone_click || 0,
      siteClicks: events.byType.site_click || 0
    },
    moderation: reports
  };
}

function getOverview({ token, period }) {
  requireServiceOwner(token);
  const state = db.read();
  return buildOverview(state, normalizePeriod(period));
}

function queryMatches(value, query) {
  if (!query) return true;
  return String(value || '').toLowerCase().includes(query);
}

function listUsers({ token, query }) {
  requireServiceOwner(token);
  const state = db.read();
  const safeQuery = sanitizeString(query).toLowerCase();
  const items = (state.users || [])
    .filter((user) => queryMatches(user.login, safeQuery) || queryMatches(user.status, safeQuery) || queryMatches(user.id, safeQuery))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 100)
    .map((user) => {
      const accounts = (state.accounts || []).filter((account) => account.ownerUserId === user.id || (state.accountMemberships || []).some((membership) => membership.userId === user.id && membership.accountId === account.id));
      return {
        ...publicUser(user),
        accountsCount: accounts.length,
        businessAccountsCount: accounts.filter((account) => account.type === 'business').length,
        sessionsCount: (state.sessions || []).filter((session) => session.userId === user.id && !session.revokedAt).length
      };
    });
  return { items };
}

function listAccounts({ token, query }) {
  requireServiceOwner(token);
  const state = db.read();
  const safeQuery = sanitizeString(query).toLowerCase();
  const items = (state.accounts || [])
    .filter((account) => {
      const owner = (state.users || []).find((user) => user.id === account.ownerUserId) || null;
      return queryMatches(account.name, safeQuery)
        || queryMatches(account.username, safeQuery)
        || queryMatches(account.type, safeQuery)
        || queryMatches(owner ? owner.login : '', safeQuery)
        || queryMatches(account.id, safeQuery);
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 100)
    .map((account) => {
      const owner = (state.users || []).find((user) => user.id === account.ownerUserId) || null;
      return {
        ...publicAccount(state, account),
        ownerLogin: owner ? owner.login : '',
        membersCount: (state.accountMemberships || []).filter((membership) => membership.accountId === account.id && membership.status === 'active').length
      };
    });
  return { items };
}

function listBusinesses({ token, query }) {
  requireServiceOwner(token);
  const state = db.read();
  const safeQuery = sanitizeString(query).toLowerCase();
  const items = (state.accounts || [])
    .filter((account) => account.type === 'business' && account.status !== 'archived')
    .filter((account) => {
      const profile = (state.businessProfiles || []).find((item) => item.accountId === account.id) || null;
      return queryMatches(account.name, safeQuery)
        || queryMatches(account.username, safeQuery)
        || queryMatches(profile ? profile.category : '', safeQuery)
        || queryMatches(profile ? profile.address : '', safeQuery);
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 100)
    .map((account) => publicBusiness(state, account));
  return { items };
}

function listContent({ token, period }) {
  requireServiceOwner(token);
  const state = db.read();
  const safePeriod = normalizePeriod(period);
  const posts = (state.posts || []).filter((item) => item.status !== 'deleted');
  const videos = (state.videos || []).filter((item) => item.status !== 'deleted');
  const stories = (state.stories || []).filter((item) => item.status !== 'deleted');
  const offers = (state.offers || []).filter((item) => item.status !== 'deleted');
  return {
    period: safePeriod,
    summary: {
      posts: posts.length,
      newPosts: count(posts, (item) => inPeriod(item.createdAt || item.publishedAt, safePeriod)),
      videos: videos.length,
      newVideos: count(videos, (item) => inPeriod(item.createdAt || item.publishedAt, safePeriod)),
      stories: stories.length,
      newStories: count(stories, (item) => inPeriod(item.createdAt, safePeriod)),
      offers: offers.length,
      activeOffers: count(offers, (item) => item.status === 'active'),
      restricted: posts.concat(videos, stories, offers).filter((item) => item.status === 'restricted' || item.moderationStatus === 'restricted').length
    },
    recent: posts.slice(-10).map((item) => ({ id: item.id, type: 'post', title: (item.text || 'Пост').slice(0, 80), accountId: item.accountId, status: item.status, createdAt: item.createdAt }))
      .concat(videos.slice(-10).map((item) => ({ id: item.id, type: 'video', title: (item.description || 'Видео').slice(0, 80), accountId: item.accountId, status: item.status, createdAt: item.createdAt })))
      .concat(stories.slice(-10).map((item) => ({ id: item.id, type: 'story', title: (item.text || 'Близз').slice(0, 80), accountId: item.accountId, status: item.status, createdAt: item.createdAt })))
      .concat(offers.slice(-10).map((item) => ({ id: item.id, type: 'offer', title: item.title, accountId: item.businessAccountId, status: item.status, createdAt: item.createdAt })))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, 30)
  };
}

function listReports({ token, status }) {
  requireServiceOwner(token);
  const state = db.read();
  const safeStatus = sanitizeString(status);
  const items = (state.reports || [])
    .filter((report) => !safeStatus || report.moderationStatus === safeStatus || report.ownerStatus === safeStatus)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 100);
  return { items, summary: aggregateReports(state) };
}

function getMetrics({ token, period }) {
  requireServiceOwner(token);
  const state = db.read();
  const safePeriod = normalizePeriod(period);
  const events = aggregateEvents(state, safePeriod);
  const topBusinessByOffers = (state.accounts || [])
    .filter((account) => account.type === 'business')
    .map((account) => ({
      account: publicAccount(state, account),
      offers: (state.offers || []).filter((offer) => offer.businessAccountId === account.id && offer.status !== 'deleted').length,
      reports: (state.reports || []).filter((report) => report.businessAccountId === account.id).length,
      messages: (state.conversations || []).filter((conversation) => conversation.type === 'business' && (conversation.participantAccountIds || []).includes(account.id)).length
    }))
    .sort((a, b) => (b.offers + b.messages + b.reports) - (a.offers + a.messages + a.reports))
    .slice(0, 10);
  return {
    period: safePeriod,
    events,
    topBusinessByOffers,
    registrations: {
      users: count(state.users || [], (user) => inPeriod(user.createdAt, safePeriod)),
      businesses: count(state.accounts || [], (account) => account.type === 'business' && inPeriod(account.createdAt, safePeriod))
    }
  };
}

module.exports = {
  isServiceOwnerUser,
  requireServiceOwner,
  loginServiceOwner,
  getServiceOwnerSession,
  logoutServiceOwner,
  getOverview,
  listUsers,
  listAccounts,
  listBusinesses,
  listContent,
  listReports,
  getMetrics
};
