const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { createId } = require('../../shared/security/password');
const { createNotification } = require('../notifications/notifications.service');

const REPORT_TARGET_TYPES = new Set(['profile', 'account', 'business', 'post', 'video', 'story', 'comment', 'message', 'offer', 'sound', 'game', 'place']);
const REPORT_REASONS = new Set(['spam', 'abuse', 'fraud', 'forbidden_content', 'personal_data', 'other']);
const MODERATION_STATUSES = new Set(['new', 'reviewing', 'resolved', 'rejected']);
const OWNER_STATUSES = new Set(['new', 'seen', 'handled', 'archived']);
const BUSINESS_REPORT_ROLES = new Set(['owner', 'admin', 'smm', 'messages']);
const BUSINESS_OWNER_ROLES = new Set(['owner', 'admin']);

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function ensureArrays(state) {
  state.reports = state.reports || [];
  state.offers = state.offers || [];
}

function requireActiveAccount(state, userId, activeAccountId) {
  const membership = (state.accountMemberships || []).find((item) => item.userId === userId && item.accountId === activeAccountId && item.status === 'active');
  if (!membership) {
    throw new HttpError(403, 'ACCOUNT_ACCESS_DENIED', 'Нет доступа к активному аккаунту');
  }

  const account = (state.accounts || []).find((item) => item.id === activeAccountId && item.status !== 'archived');
  if (!account) {
    throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Аккаунт не найден');
  }

  return { account, membership };
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

function findPost(state, id) {
  return (state.posts || []).find((item) => item.id === id && item.status !== 'deleted') || null;
}

function findVideo(state, id) {
  return (state.videos || []).find((item) => item.id === id && item.status !== 'deleted') || null;
}

function findStory(state, id) {
  return (state.stories || []).find((item) => item.id === id && item.status !== 'deleted') || null;
}

function findOffer(state, id) {
  return (state.offers || []).find((item) => item.id === id && item.status !== 'deleted') || null;
}

function findComment(state, id) {
  return (state.postComments || []).find((item) => item.id === id && item.status !== 'deleted') || null;
}

function findMessage(state, id) {
  return (state.messages || []).find((item) => item.id === id && item.status !== 'deleted') || null;
}

function findGame(state, id) {
  return (state.gameSessions || []).find((item) => item.id === id && item.status !== 'deleted') || null;
}

function resolveTarget(state, targetType, targetId) {
  const id = sanitizeString(targetId);
  if (!id) {
    throw new HttpError(400, 'REPORT_TARGET_REQUIRED', 'Выберите объект жалобы');
  }

  if (targetType === 'profile' || targetType === 'account' || targetType === 'business') {
    const account = (state.accounts || []).find((item) => item.id === id && item.status !== 'archived');
    if (!account) throw new HttpError(404, 'REPORT_TARGET_NOT_FOUND', 'Объект жалобы не найден');
    return {
      targetType: account.type === 'business' ? 'business' : 'profile',
      targetId: account.id,
      targetAccountId: account.id,
      businessAccountId: account.type === 'business' ? account.id : null,
      title: account.name,
      subtitle: `@${account.username}`,
      objectStatus: account.status || 'active'
    };
  }

  if (targetType === 'post') {
    const post = findPost(state, id);
    if (!post) throw new HttpError(404, 'REPORT_TARGET_NOT_FOUND', 'Пост не найден');
    const account = publicAccount(state, post.accountId);
    return {
      targetType: 'post',
      targetId: post.id,
      targetAccountId: post.accountId,
      businessAccountId: account && account.type === 'business' ? post.accountId : null,
      title: post.text ? post.text.slice(0, 80) : 'Пост',
      subtitle: account ? `@${account.username}` : 'Аккаунт удалён',
      objectStatus: post.status || 'published'
    };
  }

  if (targetType === 'video') {
    const video = findVideo(state, id);
    if (!video) throw new HttpError(404, 'REPORT_TARGET_NOT_FOUND', 'Видео не найдено');
    const account = publicAccount(state, video.accountId);
    return {
      targetType: 'video',
      targetId: video.id,
      targetAccountId: video.accountId,
      businessAccountId: account && account.type === 'business' ? video.accountId : null,
      title: video.description ? video.description.slice(0, 80) : 'Видео',
      subtitle: account ? `@${account.username}` : 'Аккаунт удалён',
      objectStatus: video.status || 'published'
    };
  }

  if (targetType === 'story') {
    const story = findStory(state, id);
    if (!story) throw new HttpError(404, 'REPORT_TARGET_NOT_FOUND', 'Близз не найден');
    const account = publicAccount(state, story.accountId);
    return {
      targetType: 'story',
      targetId: story.id,
      targetAccountId: story.accountId,
      businessAccountId: account && account.type === 'business' ? story.accountId : null,
      title: story.text ? story.text.slice(0, 80) : 'Близз',
      subtitle: account ? `@${account.username}` : 'Аккаунт удалён',
      objectStatus: story.status || 'active'
    };
  }

  if (targetType === 'offer') {
    const offer = findOffer(state, id);
    if (!offer) throw new HttpError(404, 'REPORT_TARGET_NOT_FOUND', 'Предложение не найдено');
    const account = publicAccount(state, offer.businessAccountId);
    return {
      targetType: 'offer',
      targetId: offer.id,
      targetAccountId: offer.businessAccountId,
      businessAccountId: offer.businessAccountId,
      title: offer.title,
      subtitle: account ? `@${account.username}` : 'Бизнес удалён',
      objectStatus: offer.status || 'active'
    };
  }

  if (targetType === 'comment') {
    const comment = findComment(state, id);
    if (!comment) throw new HttpError(404, 'REPORT_TARGET_NOT_FOUND', 'Комментарий не найден');
    const account = publicAccount(state, comment.accountId);
    const post = findPost(state, comment.postId);
    const postOwner = post ? publicAccount(state, post.accountId) : null;
    return {
      targetType: 'comment',
      targetId: comment.id,
      targetAccountId: comment.accountId,
      businessAccountId: postOwner && postOwner.type === 'business' ? post.accountId : null,
      title: comment.text ? comment.text.slice(0, 80) : 'Комментарий',
      subtitle: account ? `@${account.username}` : 'Автор удалён',
      objectStatus: comment.status || 'active'
    };
  }

  if (targetType === 'message') {
    const message = findMessage(state, id);
    if (!message) throw new HttpError(404, 'REPORT_TARGET_NOT_FOUND', 'Сообщение не найдено');
    const account = publicAccount(state, message.senderAccountId);
    const conversation = (state.conversations || []).find((item) => item.id === message.conversationId) || null;
    return {
      targetType: 'message',
      targetId: message.id,
      targetAccountId: message.senderAccountId,
      businessAccountId: conversation ? conversation.businessAccountId || null : null,
      title: message.text ? message.text.slice(0, 80) : 'Сообщение',
      subtitle: account ? `@${account.username}` : 'Автор удалён',
      objectStatus: message.status || 'sent'
    };
  }

  if (targetType === 'game') {
    const game = findGame(state, id);
    if (!game) throw new HttpError(404, 'REPORT_TARGET_NOT_FOUND', 'Игра не найдена');
    const account = publicAccount(state, game.createdByAccountId);
    return {
      targetType: 'game',
      targetId: game.id,
      targetAccountId: game.createdByAccountId,
      businessAccountId: null,
      title: game.title || 'Игра',
      subtitle: account ? `@${account.username}` : 'Автор удалён',
      objectStatus: game.status || 'active'
    };
  }

  return {
    targetType,
    targetId: id,
    targetAccountId: null,
    businessAccountId: null,
    title: targetType === 'place' ? 'Место' : targetType === 'sound' ? 'Звук' : 'Объект',
    subtitle: '',
    objectStatus: 'active'
  };
}

function normalizeReportInput(input) {
  const payload = input || {};
  const targetType = sanitizeString(payload.targetType);
  const reason = sanitizeString(payload.reason);
  const comment = sanitizeString(payload.comment);

  if (!REPORT_TARGET_TYPES.has(targetType)) {
    throw new HttpError(400, 'REPORT_TARGET_TYPE_INVALID', 'Неподдерживаемый объект жалобы');
  }

  if (!REPORT_REASONS.has(reason)) {
    throw new HttpError(400, 'REPORT_REASON_INVALID', 'Выберите причину жалобы');
  }

  if (comment.length > 500) {
    throw new HttpError(400, 'REPORT_COMMENT_TOO_LONG', 'Комментарий к жалобе должен быть не длиннее 500 символов');
  }

  return { targetType, targetId: sanitizeString(payload.targetId), reason, comment };
}

function publicReport(state, report) {
  return {
    id: report.id,
    reporterAccountId: report.reporterAccountId,
    reporter: publicAccount(state, report.reporterAccountId),
    targetType: report.targetType,
    targetId: report.targetId,
    targetAccountId: report.targetAccountId,
    targetAccount: publicAccount(state, report.targetAccountId),
    businessAccountId: report.businessAccountId || null,
    businessAccount: publicAccount(state, report.businessAccountId),
    reason: report.reason,
    comment: report.comment || '',
    title: report.title,
    subtitle: report.subtitle,
    objectStatus: report.objectStatus || 'active',
    ownerStatus: report.ownerStatus || 'new',
    moderationStatus: report.moderationStatus || 'new',
    moderationNote: report.moderationNote || '',
    ownerNote: report.ownerNote || '',
    createdAt: report.createdAt,
    updatedAt: report.updatedAt
  };
}

function notifyBusinessOwners(state, report) {
  if (!report.businessAccountId) return;
  const members = (state.accountMemberships || []).filter((membership) => {
    return membership.accountId === report.businessAccountId && membership.status === 'active' && BUSINESS_OWNER_ROLES.has(membership.role);
  });

  for (const membership of members) {
    createNotification(state, {
      accountId: report.businessAccountId,
      userId: membership.userId,
      type: 'business_report',
      category: 'business',
      title: 'Новая жалоба на бизнес-контент',
      body: report.title || 'Поступила новая жалоба',
      targetType: 'settings',
      targetId: report.id,
      actorAccountId: report.reporterAccountId
    });
  }
}

function createReport({ userId, activeAccountId, input }) {
  const payload = normalizeReportInput(input);
  return db.transaction((state) => {
    ensureArrays(state);
    const { account } = requireActiveAccount(state, userId, activeAccountId);
    const target = resolveTarget(state, payload.targetType, payload.targetId);
    if (target.targetAccountId && target.targetAccountId === account.id) {
      throw new HttpError(400, 'REPORT_SELF_FORBIDDEN', 'Нельзя пожаловаться на свой аккаунт или контент');
    }

    const now = new Date().toISOString();
    const existing = state.reports.find((report) => {
      return report.reporterAccountId === account.id
        && report.targetType === target.targetType
        && report.targetId === target.targetId
        && report.moderationStatus !== 'rejected';
    });
    if (existing) {
      existing.updatedAt = now;
      return { report: publicReport(state, existing), reused: true };
    }

    const report = {
      id: createId('report'),
      reporterUserId: userId,
      reporterAccountId: account.id,
      targetType: target.targetType,
      targetId: target.targetId,
      targetAccountId: target.targetAccountId,
      businessAccountId: target.businessAccountId,
      reason: payload.reason,
      comment: payload.comment,
      title: target.title,
      subtitle: target.subtitle,
      objectStatus: target.objectStatus,
      ownerStatus: target.businessAccountId ? 'new' : null,
      moderationStatus: 'new',
      moderationNote: '',
      ownerNote: '',
      createdAt: now,
      updatedAt: now
    };
    state.reports.push(report);
    notifyBusinessOwners(state, report);
    return { report: publicReport(state, report), reused: false };
  });
}

function listMyReports({ userId, activeAccountId }) {
  const state = db.read();
  ensureArrays(state);
  const { account } = requireActiveAccount(state, userId, activeAccountId);
  const items = state.reports
    .filter((report) => report.reporterAccountId === account.id)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((report) => publicReport(state, report));
  return { items, count: items.length };
}

function canViewBusinessReport(report, account, membership) {
  if (account.type !== 'business') return false;
  if (!BUSINESS_REPORT_ROLES.has(membership.role)) return false;
  if (membership.role === 'messages') return report.targetType === 'message' && report.businessAccountId === account.id;
  return report.businessAccountId === account.id || report.targetAccountId === account.id;
}

function listBusinessReports({ userId, activeAccountId, status }) {
  const state = db.read();
  ensureArrays(state);
  const { account, membership } = requireActiveAccount(state, userId, activeAccountId);
  if (account.type !== 'business' || !BUSINESS_REPORT_ROLES.has(membership.role)) {
    throw new HttpError(403, 'BUSINESS_REPORTS_FORBIDDEN', 'Нет доступа к жалобам бизнеса');
  }

  const safeStatus = sanitizeString(status);
  const items = state.reports
    .filter((report) => canViewBusinessReport(report, account, membership))
    .filter((report) => !safeStatus || safeStatus === 'all' || report.ownerStatus === safeStatus || report.moderationStatus === safeStatus)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((report) => publicReport(state, report));
  return { items, count: items.length };
}

function updateBusinessReportOwnerStatus({ userId, activeAccountId, reportId, input }) {
  const status = sanitizeString(input && input.status);
  const ownerNote = sanitizeString(input && input.ownerNote);
  if (!OWNER_STATUSES.has(status)) {
    throw new HttpError(400, 'OWNER_REPORT_STATUS_INVALID', 'Неподдерживаемый статус обработки жалобы');
  }

  return db.transaction((state) => {
    ensureArrays(state);
    const { account, membership } = requireActiveAccount(state, userId, activeAccountId);
    const report = state.reports.find((item) => item.id === reportId);
    if (!report) throw new HttpError(404, 'REPORT_NOT_FOUND', 'Жалоба не найдена');
    if (!canViewBusinessReport(report, account, membership) || !BUSINESS_OWNER_ROLES.has(membership.role)) {
      throw new HttpError(403, 'BUSINESS_REPORT_UPDATE_FORBIDDEN', 'Нет доступа к обработке жалобы');
    }
    report.ownerStatus = status;
    if (ownerNote) report.ownerNote = ownerNote.slice(0, 500);
    report.updatedAt = new Date().toISOString();
    return { report: publicReport(state, report) };
  });
}

function isServiceModerator(user) {
  return Boolean(user && (user.isServiceModerator || ['service_admin', 'service_owner', 'moderator'].includes(user.status)));
}

function listModerationReports({ userId, activeAccountId, status }) {
  const state = db.read();
  ensureArrays(state);
  const user = (state.users || []).find((item) => item.id === userId);
  requireActiveAccount(state, userId, activeAccountId);
  if (!user || !isServiceModerator(user)) {
    throw new HttpError(403, 'MODERATION_FORBIDDEN', 'Нет доступа к общей модерации');
  }
  const safeStatus = sanitizeString(status);
  const items = state.reports
    .filter((report) => !safeStatus || safeStatus === 'all' || report.moderationStatus === safeStatus)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((report) => publicReport(state, report));
  return { items, count: items.length };
}

function updateModerationReportStatus({ userId, activeAccountId, reportId, input }) {
  const status = sanitizeString(input && input.status);
  const moderationNote = sanitizeString(input && input.moderationNote);
  if (!MODERATION_STATUSES.has(status)) {
    throw new HttpError(400, 'MODERATION_STATUS_INVALID', 'Неподдерживаемый статус модерации');
  }

  return db.transaction((state) => {
    ensureArrays(state);
    const user = (state.users || []).find((item) => item.id === userId);
    requireActiveAccount(state, userId, activeAccountId);
    if (!user || !isServiceModerator(user)) {
      throw new HttpError(403, 'MODERATION_FORBIDDEN', 'Нет доступа к общей модерации');
    }
    const report = state.reports.find((item) => item.id === reportId);
    if (!report) throw new HttpError(404, 'REPORT_NOT_FOUND', 'Жалоба не найдена');
    report.moderationStatus = status;
    if (moderationNote) report.moderationNote = moderationNote.slice(0, 500);
    report.updatedAt = new Date().toISOString();
    return { report: publicReport(state, report) };
  });
}

function listReportsForAccount(state, account, membership) {
  ensureArrays(state);
  if (account.type !== 'business' || !BUSINESS_REPORT_ROLES.has(membership.role)) {
    return [];
  }
  return state.reports
    .filter((report) => canViewBusinessReport(report, account, membership))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((report) => publicReport(state, report));
}

module.exports = {
  REPORT_REASONS,
  REPORT_TARGET_TYPES,
  createReport,
  listMyReports,
  listBusinessReports,
  updateBusinessReportOwnerStatus,
  listModerationReports,
  updateModerationReportStatus,
  listReportsForAccount
};
