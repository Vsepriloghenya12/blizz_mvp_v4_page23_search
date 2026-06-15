const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { getSummary, getContentMetrics, getOfferMetrics, getActionMetrics } = require('../metrics/metrics.service');
const { listReportsForAccount } = require('../reports/reports.service');

const BUSINESS_DASHBOARD_ROLES = new Set(['owner', 'admin', 'smm', 'messages']);
const BUSINESS_FULL_ROLES = new Set(['owner', 'admin']);
const BUSINESS_CONTENT_ROLES = new Set(['owner', 'admin', 'smm']);
const OFFER_OWNER_STATUSES = new Set(['active', 'archived']);

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requireBusinessContext(state, userId, activeAccountId) {
  const membership = (state.accountMemberships || []).find((item) => item.userId === userId && item.accountId === activeAccountId && item.status === 'active');
  if (!membership) {
    throw new HttpError(403, 'ACCOUNT_ACCESS_DENIED', 'Нет доступа к активному аккаунту');
  }
  const account = (state.accounts || []).find((item) => item.id === activeAccountId && item.status !== 'archived');
  if (!account) {
    throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Аккаунт не найден');
  }
  if (account.type !== 'business' || !BUSINESS_DASHBOARD_ROLES.has(membership.role)) {
    throw new HttpError(403, 'BUSINESS_DASHBOARD_FORBIDDEN', 'Панель владельца доступна только бизнес-аккаунту');
  }
  const profile = (state.businessProfiles || []).find((item) => item.accountId === account.id) || null;
  return { account, membership, profile };
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

function countBy(items, predicate) {
  return items.filter(predicate).length;
}

function conversationPreview(state, accountId) {
  const conversations = (state.conversations || [])
    .filter((conversation) => conversation.status !== 'archived' && (conversation.participantAccountIds || []).includes(accountId))
    .map((conversation) => {
      const messages = (state.messages || [])
        .filter((message) => message.conversationId === conversation.id && message.status !== 'deleted')
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      const lastMessage = messages[0] || null;
      return {
        id: conversation.id,
        type: conversation.type,
        title: conversation.title || (conversation.type === 'business' ? 'Бизнес-чат' : conversation.type === 'group' ? 'Группа' : 'Диалог'),
        lastMessagePreview: lastMessage ? (lastMessage.text || lastMessage.type || 'Сообщение') : 'Пока нет сообщений',
        lastMessageAt: lastMessage ? lastMessage.createdAt : conversation.updatedAt || conversation.createdAt,
        unreadCount: messages.filter((message) => message.senderAccountId !== accountId && !message.readAt).length
      };
    })
    .sort((a, b) => String(b.lastMessageAt).localeCompare(String(a.lastMessageAt)));

  return {
    total: conversations.length,
    unread: conversations.reduce((sum, item) => sum + item.unreadCount, 0),
    items: conversations.slice(0, 8)
  };
}

function offerPreview(state, accountId) {
  const now = Date.now();
  const offers = (state.offers || [])
    .filter((offer) => offer.businessAccountId === accountId && offer.status !== 'deleted')
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return {
    active: countBy(offers, (offer) => offer.status === 'active' && (!offer.expiresAt || Date.parse(offer.expiresAt) > now)),
    expiring: countBy(offers, (offer) => offer.status === 'active' && offer.expiresAt && Date.parse(offer.expiresAt) > now && Date.parse(offer.expiresAt) <= now + 3 * 24 * 60 * 60 * 1000),
    archived: countBy(offers, (offer) => offer.status === 'archived'),
    restricted: countBy(offers, (offer) => offer.status === 'restricted'),
    items: offers.slice(0, 8).map((offer) => ({
      id: offer.id,
      title: offer.title,
      type: offer.type,
      status: offer.status,
      expiresAt: offer.expiresAt || null,
      createdAt: offer.createdAt
    }))
  };
}

function staffPreview(state, accountId) {
  const roleOrder = { owner: 1, admin: 2, smm: 3, messages: 4 };
  return (state.accountMemberships || [])
    .filter((membership) => membership.accountId === accountId && membership.status === 'active')
    .sort((a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99))
    .map((membership) => {
      const user = (state.users || []).find((item) => item.id === membership.userId) || null;
      return {
        id: membership.id,
        userId: membership.userId,
        login: user ? user.login : 'Пользователь удалён',
        role: membership.role,
        status: membership.status,
        createdAt: membership.createdAt
      };
    });
}

function reportPreview(state, account, membership) {
  const reports = listReportsForAccount(state, account, membership);
  return {
    total: reports.length,
    new: reports.filter((report) => report.ownerStatus === 'new' || report.moderationStatus === 'new').length,
    reviewing: reports.filter((report) => report.moderationStatus === 'reviewing').length,
    resolved: reports.filter((report) => report.moderationStatus === 'resolved' || report.ownerStatus === 'handled').length,
    items: reports.slice(0, 8)
  };
}

function getBusinessDashboard({ userId, activeAccountId, period }) {
  const state = db.read();
  const { account, membership, profile } = requireBusinessContext(state, userId, activeAccountId);
  const safePeriod = ['7d', '30d', '90d'].includes(sanitizeString(period)) ? sanitizeString(period) : '7d';
  const capabilities = {
    canViewOverview: BUSINESS_DASHBOARD_ROLES.has(membership.role),
    canViewMetrics: BUSINESS_FULL_ROLES.has(membership.role) || BUSINESS_CONTENT_ROLES.has(membership.role) || membership.role === 'messages',
    canViewContent: BUSINESS_CONTENT_ROLES.has(membership.role),
    canViewOffers: BUSINESS_CONTENT_ROLES.has(membership.role),
    canViewMessages: BUSINESS_FULL_ROLES.has(membership.role) || membership.role === 'messages',
    canViewReports: BUSINESS_DASHBOARD_ROLES.has(membership.role),
    canViewStaff: BUSINESS_FULL_ROLES.has(membership.role),
    canViewActions: BUSINESS_FULL_ROLES.has(membership.role)
  };

  let summary = null;
  let content = { items: [] };
  let offerMetrics = { items: [] };
  let actions = { items: [] };

  try {
    summary = getSummary({ userId, activeAccountId, period: safePeriod });
  } catch (_error) {
    summary = null;
  }
  if (capabilities.canViewContent) {
    try { content = getContentMetrics({ userId, activeAccountId, period: safePeriod }); } catch (_error) { content = { items: [] }; }
  }
  if (capabilities.canViewOffers) {
    try { offerMetrics = getOfferMetrics({ userId, activeAccountId, period: safePeriod }); } catch (_error) { offerMetrics = { items: [] }; }
  }
  if (capabilities.canViewActions) {
    try { actions = getActionMetrics({ userId, activeAccountId, period: safePeriod }); } catch (_error) { actions = { items: [] }; }
  }

  const reports = capabilities.canViewReports ? reportPreview(state, account, membership) : { total: 0, new: 0, reviewing: 0, resolved: 0, items: [] };
  const messages = capabilities.canViewMessages ? conversationPreview(state, account.id) : { total: 0, unread: 0, items: [] };
  const offers = capabilities.canViewOffers ? offerPreview(state, account.id) : { active: 0, expiring: 0, archived: 0, restricted: 0, items: [] };

  return {
    period: safePeriod,
    account: publicAccount(state, account.id),
    role: membership.role,
    capabilities,
    profile: profile ? {
      category: profile.category,
      description: profile.description || '',
      address: profile.address || '',
      phone: profile.phone || '',
      website: profile.website || ''
    } : null,
    overview: {
      status: account.status || 'active',
      profileViews: summary && summary.business ? summary.business.profileViews : 0,
      messages: summary && summary.business ? summary.business.messages : messages.total,
      routes: summary && summary.business ? summary.business.routes : 0,
      saves: summary && summary.business ? summary.business.saves : 0,
      activeOffers: offers.active,
      newReports: reports.new
    },
    metrics: {
      summary,
      content: content.items || [],
      offers: offerMetrics.items || [],
      actions: actions.items || []
    },
    showcase: offers,
    messages,
    reports,
    staff: capabilities.canViewStaff ? staffPreview(state, account.id) : []
  };
}

function updateOfferOwnerStatus({ userId, activeAccountId, offerId, input }) {
  const status = sanitizeString(input && input.status);
  if (!OFFER_OWNER_STATUSES.has(status)) {
    throw new HttpError(400, 'OFFER_STATUS_INVALID', 'Владелец может только активировать или архивировать предложение');
  }

  return db.transaction((state) => {
    const { account, membership } = requireBusinessContext(state, userId, activeAccountId);
    if (!BUSINESS_CONTENT_ROLES.has(membership.role)) {
      throw new HttpError(403, 'OFFER_STATUS_FORBIDDEN', 'Нет доступа к изменению предложения');
    }
    const offer = (state.offers || []).find((item) => item.id === offerId && item.businessAccountId === account.id && item.status !== 'deleted');
    if (!offer) {
      throw new HttpError(404, 'OFFER_NOT_FOUND', 'Предложение не найдено');
    }
    offer.status = status;
    offer.updatedAt = new Date().toISOString();
    return {
      offer: {
        id: offer.id,
        title: offer.title,
        type: offer.type,
        status: offer.status,
        expiresAt: offer.expiresAt || null,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt
      }
    };
  });
}

module.exports = { getBusinessDashboard, updateOfferOwnerStatus };
