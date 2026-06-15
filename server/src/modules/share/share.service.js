const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { createId } = require('../../shared/security/password');
const { createSharedContentMessage } = require('../messages/messages.service');
const { canViewAccountContent } = require('../follows/follows.service');

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

function publicAccount(account, membership, state) {
  const businessProfile = account.type === 'business'
    ? state.businessProfiles.find((profile) => profile.accountId === account.id)
    : null;

  return {
    id: account.id,
    type: account.type,
    name: account.name,
    username: account.username,
    avatar: account.avatar || null,
    role: membership ? membership.role : null,
    businessCategory: businessProfile ? businessProfile.category : null
  };
}

function findPublishedPost(state, postId) {
  const post = (state.posts || []).find((item) => item.id === postId && item.status === 'published');
  if (!post) {
    throw new HttpError(404, 'POST_NOT_FOUND', 'Пост не найден');
  }
  return post;
}

function assertCanViewPost(state, post, viewerAccountId) {
  if (!canViewAccountContent(state, viewerAccountId, post.accountId, post.visibility)) {
    throw new HttpError(403, 'POST_ACCESS_DENIED', 'Пост недоступен');
  }
}

function assertTargetCanReceivePost(state, post, targetAccountId) {
  if (!canViewAccountContent(state, targetAccountId, post.accountId, post.visibility)) {
    throw new HttpError(403, 'POST_SHARE_FORBIDDEN', 'Этот пост нельзя отправить выбранному получателю');
  }
}

function listShareRecipients({ userId, activeAccountId }) {
  const state = db.read();
  getActiveAccountContext(state, userId, activeAccountId);

  const recipients = (state.accountMemberships || [])
    .filter((membership) => membership.userId === userId && membership.status === 'active')
    .map((membership) => {
      const account = state.accounts.find((item) => item.id === membership.accountId && item.status !== 'archived');
      return account ? publicAccount(account, membership, state) : null;
    })
    .filter(Boolean)
    .filter((account) => account.id !== activeAccountId);

  return { recipients };
}

function sharePost({ userId, activeAccountId, input }) {
  const postId = String((input && input.postId) || '').trim();
  const targetAccountId = String((input && input.targetAccountId) || '').trim();

  if (!postId) {
    throw new HttpError(400, 'POST_ID_REQUIRED', 'Не выбран пост');
  }

  if (!targetAccountId) {
    throw new HttpError(400, 'TARGET_ACCOUNT_REQUIRED', 'Выберите получателя');
  }

  return db.transaction((state) => {
    const { account: senderAccount } = getActiveAccountContext(state, userId, activeAccountId);
    const post = findPublishedPost(state, postId);
    assertCanViewPost(state, post, senderAccount.id);

    const targetAccount = state.accounts.find((item) => item.id === targetAccountId && item.status !== 'archived');
    if (!targetAccount) {
      throw new HttpError(404, 'TARGET_ACCOUNT_NOT_FOUND', 'Получатель не найден');
    }

    assertTargetCanReceivePost(state, post, targetAccount.id);

    const now = new Date().toISOString();
    const sharedContent = {
      id: createId('shared'),
      type: 'post',
      contentId: post.id,
      senderAccountId: senderAccount.id,
      senderUserId: userId,
      targetType: 'account',
      targetAccountId: targetAccount.id,
      status: 'sent',
      createdAt: now
    };

    state.sharedContents.push(sharedContent);
    const message = createSharedContentMessage(state, { sharedContent, actorUserId: userId });

    return {
      conversationId: message ? message.conversationId : null,
      messageId: message ? message.id : null,
      sharedContent: {
        id: sharedContent.id,
        type: sharedContent.type,
        contentId: sharedContent.contentId,
        senderAccountId: sharedContent.senderAccountId,
        targetType: sharedContent.targetType,
        targetAccountId: sharedContent.targetAccountId,
        createdAt: sharedContent.createdAt
      }
    };
  });
}

module.exports = {
  listShareRecipients,
  sharePost
};
