const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { createId } = require('../../shared/security/password');

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function ensureArrays(state) {
  state.blocks = state.blocks || [];
  state.follows = state.follows || [];
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

function findAccount(state, accountId) {
  const account = (state.accounts || []).find((item) => item.id === accountId && item.status !== 'archived');
  if (!account) {
    throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Аккаунт не найден');
  }
  return account;
}

function businessProfileFor(state, account) {
  if (!account || account.type !== 'business') return null;
  return (state.businessProfiles || []).find((profile) => profile.accountId === account.id) || null;
}

function publicAccount(state, account) {
  if (!account) return null;
  const businessProfile = businessProfileFor(state, account);
  return {
    id: account.id,
    type: account.type,
    name: account.name,
    username: account.username,
    avatar: account.avatar || null,
    bio: account.bio || '',
    city: account.city || '',
    link: account.link || '',
    isPrivate: Boolean(account.isPrivate),
    businessCategory: businessProfile ? businessProfile.category : null,
    createdAt: account.createdAt
  };
}

function isActiveBlock(block) {
  return block && block.status !== 'removed';
}

function getBlockRecord(state, blockerAccountId, blockedAccountId) {
  ensureArrays(state);
  return (state.blocks || []).find((block) => {
    return block.blockerAccountId === blockerAccountId && block.blockedAccountId === blockedAccountId;
  }) || null;
}

function hasActiveBlock(state, blockerAccountId, blockedAccountId) {
  const block = getBlockRecord(state, blockerAccountId, blockedAccountId);
  return Boolean(block && isActiveBlock(block));
}

function isBlockedBetween(state, firstAccountId, secondAccountId) {
  if (!firstAccountId || !secondAccountId || firstAccountId === secondAccountId) return false;
  return hasActiveBlock(state, firstAccountId, secondAccountId) || hasActiveBlock(state, secondAccountId, firstAccountId);
}

function assertNotBlocked(state, firstAccountId, secondAccountId, message) {
  if (isBlockedBetween(state, firstAccountId, secondAccountId)) {
    throw new HttpError(403, 'ACCOUNT_BLOCKED', message || 'Действие недоступно из-за блокировки');
  }
}

function removeFollowLinksBetween(state, firstAccountId, secondAccountId, now) {
  (state.follows || []).forEach((follow) => {
    const samePair = (follow.followerAccountId === firstAccountId && follow.followingAccountId === secondAccountId)
      || (follow.followerAccountId === secondAccountId && follow.followingAccountId === firstAccountId);
    if (samePair && (follow.status === 'active' || follow.status === 'pending')) {
      follow.status = 'removed';
      follow.updatedAt = now;
      follow.removedAt = now;
      follow.declinedAt = null;
    }
  });
}

function publicBlock(state, block) {
  if (!block || !isActiveBlock(block)) return null;
  const account = (state.accounts || []).find((item) => item.id === block.blockedAccountId && item.status !== 'archived');
  if (!account) return null;
  return {
    id: block.id,
    blockerAccountId: block.blockerAccountId,
    blockedAccountId: block.blockedAccountId,
    blockedAccount: publicAccount(state, account),
    createdAt: block.createdAt,
    updatedAt: block.updatedAt
  };
}

function listBlocks({ userId, activeAccountId }) {
  const state = db.read();
  const { account } = requireActiveAccount(state, userId, activeAccountId);
  ensureArrays(state);

  const items = (state.blocks || [])
    .filter((block) => block.blockerAccountId === account.id && isActiveBlock(block))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((block) => publicBlock(state, block))
    .filter(Boolean);

  return { items, count: items.length };
}

function blockAccount({ userId, activeAccountId, targetAccountId }) {
  const safeTargetAccountId = sanitizeString(targetAccountId);
  if (!safeTargetAccountId) {
    throw new HttpError(400, 'BLOCK_TARGET_REQUIRED', 'Не выбран аккаунт для блокировки');
  }

  return db.transaction((state) => {
    const { account } = requireActiveAccount(state, userId, activeAccountId);
    const targetAccount = findAccount(state, safeTargetAccountId);
    ensureArrays(state);

    if (account.id === targetAccount.id) {
      throw new HttpError(400, 'SELF_BLOCK_FORBIDDEN', 'Нельзя заблокировать свой активный аккаунт');
    }

    const now = new Date().toISOString();
    let block = getBlockRecord(state, account.id, targetAccount.id);
    if (block) {
      block.status = 'active';
      block.updatedAt = now;
      block.removedAt = null;
    } else {
      block = {
        id: createId('block'),
        blockerAccountId: account.id,
        blockedAccountId: targetAccount.id,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        removedAt: null
      };
      state.blocks.push(block);
    }

    removeFollowLinksBetween(state, account.id, targetAccount.id, now);
    return { block: publicBlock(state, block), count: listActiveBlocksCount(state, account.id) };
  });
}

function unblockAccount({ userId, activeAccountId, targetAccountId }) {
  const safeTargetAccountId = sanitizeString(targetAccountId);
  if (!safeTargetAccountId) {
    throw new HttpError(400, 'BLOCK_TARGET_REQUIRED', 'Не выбран аккаунт для разблокировки');
  }

  return db.transaction((state) => {
    const { account } = requireActiveAccount(state, userId, activeAccountId);
    findAccount(state, safeTargetAccountId);
    ensureArrays(state);

    const block = getBlockRecord(state, account.id, safeTargetAccountId);
    if (block && isActiveBlock(block)) {
      const now = new Date().toISOString();
      block.status = 'removed';
      block.updatedAt = now;
      block.removedAt = now;
    }

    return { blockedAccountId: safeTargetAccountId, removed: true, count: listActiveBlocksCount(state, account.id) };
  });
}

function listActiveBlocksCount(state, accountId) {
  ensureArrays(state);
  return (state.blocks || []).filter((block) => block.blockerAccountId === accountId && isActiveBlock(block)).length;
}

module.exports = {
  listBlocks,
  blockAccount,
  unblockAccount,
  isBlockedBetween,
  assertNotBlocked,
  listActiveBlocksCount
};
