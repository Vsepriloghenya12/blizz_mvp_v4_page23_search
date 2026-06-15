const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { createId } = require('../../shared/security/password');
const { isBlockedBetween } = require('../blocks/blocks.service');
const { createNotification } = require('../notifications/notifications.service');

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

function acceptedFollows(state) {
  return (state.follows || []).filter((follow) => follow.status === 'active');
}

function getFollowStats(state, accountId) {
  const active = acceptedFollows(state);
  return {
    followers: active.filter((follow) => follow.followingAccountId === accountId).length,
    following: active.filter((follow) => follow.followerAccountId === accountId).length,
    requests: (state.follows || []).filter((follow) => follow.followingAccountId === accountId && follow.status === 'pending').length
  };
}

function isPrivateAccount(state, account) {
  if (account.isPrivate) return true;
  const settings = (state.accountSettings || []).find((item) => item.accountId === account.id);
  return Boolean(settings && settings.privacy && settings.privacy.isPrivateAccount);
}

function getFollowRecord(state, followerAccountId, followingAccountId) {
  return (state.follows || []).find((follow) => {
    return follow.followerAccountId === followerAccountId && follow.followingAccountId === followingAccountId;
  }) || null;
}

function followStateFor(state, viewerAccountId, targetAccountId) {
  if (viewerAccountId === targetAccountId) return 'self';
  if (isBlockedBetween(state, viewerAccountId, targetAccountId)) return 'blocked';
  const follow = getFollowRecord(state, viewerAccountId, targetAccountId);
  if (!follow || follow.status === 'removed' || follow.status === 'declined') return 'not_following';
  if (follow.status === 'pending') return 'requested';
  if (follow.status === 'active') return 'following';
  return 'not_following';
}

function publicFollowState(state, viewerAccountId, targetAccount) {
  return {
    targetAccount: publicAccount(state, targetAccount),
    followState: followStateFor(state, viewerAccountId, targetAccount.id),
    isPrivate: isPrivateAccount(state, targetAccount),
    stats: getFollowStats(state, targetAccount.id)
  };
}

function getFollowState({ userId, activeAccountId, targetAccountId }) {
  const state = db.read();
  const { account } = requireActiveAccount(state, userId, activeAccountId);
  const targetAccount = findAccount(state, targetAccountId);
  return publicFollowState(state, account.id, targetAccount);
}

function followAccount({ userId, activeAccountId, targetAccountId }) {
  return db.transaction((state) => {
    state.follows = state.follows || [];
    const { account } = requireActiveAccount(state, userId, activeAccountId);
    const targetAccount = findAccount(state, targetAccountId);

    if (account.id === targetAccount.id) {
      throw new HttpError(400, 'SELF_FOLLOW_FORBIDDEN', 'Нельзя подписаться на свой аккаунт');
    }
    if (isBlockedBetween(state, account.id, targetAccount.id)) {
      throw new HttpError(403, 'ACCOUNT_BLOCKED', 'Нельзя подписаться на заблокированный аккаунт');
    }

    const now = new Date().toISOString();
    const nextStatus = isPrivateAccount(state, targetAccount) ? 'pending' : 'active';
    let follow = getFollowRecord(state, account.id, targetAccount.id);

    if (follow) {
      if (follow.status === 'active' || follow.status === 'pending') {
        return publicFollowState(state, account.id, targetAccount);
      }
      follow.status = nextStatus;
      follow.updatedAt = now;
      follow.requestedAt = nextStatus === 'pending' ? now : null;
      follow.acceptedAt = nextStatus === 'active' ? now : null;
      follow.declinedAt = null;
      follow.removedAt = null;
    } else {
      follow = {
        id: createId('follow'),
        followerAccountId: account.id,
        followingAccountId: targetAccount.id,
        status: nextStatus,
        createdAt: now,
        updatedAt: now,
        requestedAt: nextStatus === 'pending' ? now : null,
        acceptedAt: nextStatus === 'active' ? now : null,
        declinedAt: null,
        removedAt: null
      };
      state.follows.push(follow);
    }

    createNotification(state, {
      accountId: targetAccount.id,
      type: nextStatus === 'pending' ? 'follow_request' : 'follow',
      title: nextStatus === 'pending' ? `${account.name} хочет подписаться на вас` : `${account.name} подписался на вас`,
      body: nextStatus === 'pending' ? 'Новая заявка на подписку' : 'Новый подписчик',
      targetType: 'account',
      targetId: account.id,
      actorAccountId: account.id
    });

    return publicFollowState(state, account.id, targetAccount);
  });
}

function unfollowAccount({ userId, activeAccountId, targetAccountId }) {
  return db.transaction((state) => {
    const { account } = requireActiveAccount(state, userId, activeAccountId);
    const targetAccount = findAccount(state, targetAccountId);
    const follow = getFollowRecord(state, account.id, targetAccount.id);

    if (follow && (follow.status === 'active' || follow.status === 'pending')) {
      const now = new Date().toISOString();
      follow.status = 'removed';
      follow.updatedAt = now;
      follow.removedAt = now;
    }

    return publicFollowState(state, account.id, targetAccount);
  });
}

function listFollowers({ userId, activeAccountId, targetAccountId }) {
  const state = db.read();
  requireActiveAccount(state, userId, activeAccountId);
  const targetAccount = findAccount(state, targetAccountId);

  const followers = acceptedFollows(state)
    .filter((follow) => follow.followingAccountId === targetAccount.id)
    .sort((a, b) => String(b.acceptedAt || b.updatedAt || b.createdAt).localeCompare(String(a.acceptedAt || a.updatedAt || a.createdAt)))
    .map((follow) => {
      const account = (state.accounts || []).find((item) => item.id === follow.followerAccountId && item.status !== 'archived');
      return account ? { followId: follow.id, account: publicAccount(state, account), createdAt: follow.acceptedAt || follow.createdAt } : null;
    })
    .filter(Boolean);

  return { account: publicAccount(state, targetAccount), followers };
}

function listFollowing({ userId, activeAccountId, targetAccountId }) {
  const state = db.read();
  requireActiveAccount(state, userId, activeAccountId);
  const targetAccount = findAccount(state, targetAccountId);

  const following = acceptedFollows(state)
    .filter((follow) => follow.followerAccountId === targetAccount.id)
    .sort((a, b) => String(b.acceptedAt || b.updatedAt || b.createdAt).localeCompare(String(a.acceptedAt || a.updatedAt || a.createdAt)))
    .map((follow) => {
      const account = (state.accounts || []).find((item) => item.id === follow.followingAccountId && item.status !== 'archived');
      return account ? { followId: follow.id, account: publicAccount(state, account), createdAt: follow.acceptedAt || follow.createdAt } : null;
    })
    .filter(Boolean);

  return { account: publicAccount(state, targetAccount), following };
}

function listFollowRequests({ userId, activeAccountId }) {
  const state = db.read();
  const { account } = requireActiveAccount(state, userId, activeAccountId);
  const requests = (state.follows || [])
    .filter((follow) => follow.followingAccountId === account.id && follow.status === 'pending')
    .sort((a, b) => String(b.requestedAt || b.createdAt).localeCompare(String(a.requestedAt || a.createdAt)))
    .map((follow) => {
      const requester = (state.accounts || []).find((item) => item.id === follow.followerAccountId && item.status !== 'archived');
      return requester ? { id: follow.id, requester: publicAccount(state, requester), createdAt: follow.requestedAt || follow.createdAt } : null;
    })
    .filter(Boolean);

  return { requests };
}

function acceptFollowRequest({ userId, activeAccountId, requestId }) {
  return db.transaction((state) => {
    const { account } = requireActiveAccount(state, userId, activeAccountId);
    const request = (state.follows || []).find((follow) => follow.id === requestId && follow.status === 'pending');
    if (!request) {
      throw new HttpError(404, 'FOLLOW_REQUEST_NOT_FOUND', 'Заявка не найдена');
    }
    if (request.followingAccountId !== account.id) {
      throw new HttpError(403, 'FOLLOW_REQUEST_ACCESS_DENIED', 'Нет доступа к этой заявке');
    }

    const now = new Date().toISOString();
    request.status = 'active';
    request.updatedAt = now;
    request.acceptedAt = now;
    request.declinedAt = null;

    createNotification(state, {
      accountId: request.followerAccountId,
      type: 'follow_request_accepted',
      title: `${account.name} принял вашу заявку`,
      body: 'Теперь вы подписаны на этот аккаунт',
      targetType: 'account',
      targetId: account.id,
      actorAccountId: account.id
    });

    return { requestId: request.id, status: 'accepted', stats: getFollowStats(state, account.id) };
  });
}

function declineFollowRequest({ userId, activeAccountId, requestId }) {
  return db.transaction((state) => {
    const { account } = requireActiveAccount(state, userId, activeAccountId);
    const request = (state.follows || []).find((follow) => follow.id === requestId && follow.status === 'pending');
    if (!request) {
      throw new HttpError(404, 'FOLLOW_REQUEST_NOT_FOUND', 'Заявка не найдена');
    }
    if (request.followingAccountId !== account.id) {
      throw new HttpError(403, 'FOLLOW_REQUEST_ACCESS_DENIED', 'Нет доступа к этой заявке');
    }

    const now = new Date().toISOString();
    request.status = 'declined';
    request.updatedAt = now;
    request.declinedAt = now;

    return { requestId: request.id, status: 'declined', stats: getFollowStats(state, account.id) };
  });
}

function isAcceptedFollower(state, followerAccountId, followingAccountId) {
  return (state.follows || []).some((follow) => {
    return follow.followerAccountId === followerAccountId && follow.followingAccountId === followingAccountId && follow.status === 'active';
  });
}

function canViewAccountContent(state, viewerAccountId, ownerAccountId, visibility) {
  if (viewerAccountId === ownerAccountId) return true;
  if (isBlockedBetween(state, viewerAccountId, ownerAccountId)) return false;
  const owner = (state.accounts || []).find((account) => account.id === ownerAccountId && account.status !== 'archived');
  if (!owner) return false;
  const follows = isAcceptedFollower(state, viewerAccountId, ownerAccountId);
  if (isPrivateAccount(state, owner) && !follows) return false;
  if (visibility === 'public') return true;
  if (visibility === 'followers') return follows;
  return false;
}


function getPublicProfile({ userId, activeAccountId, targetAccountId }) {
  const state = db.read();
  const { account } = requireActiveAccount(state, userId, activeAccountId);
  const targetAccount = findAccount(state, targetAccountId);
  const businessProfile = businessProfileFor(state, targetAccount);
  const followState = followStateFor(state, account.id, targetAccount.id);
  const isBlocked = isBlockedBetween(state, account.id, targetAccount.id);
  const canViewContent = !isBlocked && canViewAccountContent(state, account.id, targetAccount.id, 'public');
  const posts = (state.posts || []).filter((post) => post.accountId === targetAccount.id && post.status === 'published').length;
  const videos = (state.videos || []).filter((video) => video.accountId === targetAccount.id && video.status === 'published').length;
  const offers = (state.offers || []).filter((offer) => offer.businessAccountId === targetAccount.id && offer.status === 'active').length;

  return {
    account: {
      ...publicAccount(state, targetAccount),
      businessProfile: businessProfile ? {
        category: businessProfile.category,
        description: businessProfile.description || '',
        address: businessProfile.address || '',
        phone: businessProfile.phone || '',
        website: businessProfile.website || '',
        logo: businessProfile.logo || null
      } : null
    },
    followState,
    isBlocked,
    isPrivate: isPrivateAccount(state, targetAccount),
    canViewContent,
    isSelf: account.id === targetAccount.id,
    stats: {
      ...getFollowStats(state, targetAccount.id),
      posts,
      videos,
      offers
    }
  };
}

function publicAuthorForContent(state, accountId) {
  const account = (state.accounts || []).find((item) => item.id === accountId && item.status !== 'archived');
  if (!account) return null;
  const businessProfile = businessProfileFor(state, account);
  return {
    id: account.id,
    type: account.type,
    name: account.name,
    username: account.username,
    avatar: account.avatar || null,
    businessCategory: businessProfile ? businessProfile.category : null
  };
}

function publicPostForProfile(state, post, viewerAccountId) {
  const author = publicAuthorForContent(state, post.accountId);
  if (!author) return null;
  const likes = (state.postLikes || []).filter((like) => like.postId === post.id && like.status === 'active');
  const savedItems = (state.savedItems || []).filter((item) => item.targetType === 'post' && item.targetId === post.id && item.status === 'active');
  return {
    id: post.id,
    accountId: post.accountId,
    status: post.status,
    media: post.media || [],
    text: post.text || '',
    location: post.location || null,
    visibility: post.visibility || 'public',
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt || null,
    author,
    likesCount: likes.length,
    commentsCount: post.commentCount || 0,
    savesCount: savedItems.length,
    isLikedByMe: likes.some((like) => like.accountId === viewerAccountId),
    isSavedByMe: savedItems.some((item) => item.accountId === viewerAccountId)
  };
}

function publicVideoForProfile(state, video, viewerAccountId) {
  const author = publicAuthorForContent(state, video.accountId);
  if (!author) return null;
  const likes = (state.videoLikes || []).filter((like) => like.videoId === video.id && like.status === 'active');
  const savedItems = (state.savedItems || []).filter((item) => item.targetType === 'video' && item.targetId === video.id && item.status === 'active');
  return {
    id: video.id,
    accountId: video.accountId,
    status: video.status,
    videoUrl: video.videoUrl,
    coverUrl: video.coverUrl,
    description: video.description || '',
    location: video.location || null,
    visibility: video.visibility || 'public',
    soundTitle: video.soundTitle || 'Оригинальный звук',
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
    publishedAt: video.publishedAt || null,
    author,
    likesCount: likes.length,
    commentsCount: video.commentCount || 0,
    savesCount: savedItems.length,
    isLikedByMe: likes.some((like) => like.accountId === viewerAccountId),
    isSavedByMe: savedItems.some((item) => item.accountId === viewerAccountId)
  };
}

function listPublicPosts({ userId, activeAccountId, targetAccountId }) {
  const state = db.read();
  const { account } = requireActiveAccount(state, userId, activeAccountId);
  const targetAccount = findAccount(state, targetAccountId);
  const items = (state.posts || [])
    .filter((post) => post.accountId === targetAccount.id && post.status === 'published')
    .filter((post) => canViewAccountContent(state, account.id, post.accountId, post.visibility || 'public'))
    .sort((a, b) => String(b.publishedAt || b.createdAt).localeCompare(String(a.publishedAt || a.createdAt)))
    .map((post) => publicPostForProfile(state, post, account.id))
    .filter(Boolean);
  return { account: publicAccount(state, targetAccount), items };
}

function listPublicVideos({ userId, activeAccountId, targetAccountId }) {
  const state = db.read();
  const { account } = requireActiveAccount(state, userId, activeAccountId);
  const targetAccount = findAccount(state, targetAccountId);
  const items = (state.videos || [])
    .filter((video) => video.accountId === targetAccount.id && video.status === 'published')
    .filter((video) => canViewAccountContent(state, account.id, video.accountId, video.visibility || 'public'))
    .sort((a, b) => String(b.publishedAt || b.createdAt).localeCompare(String(a.publishedAt || a.createdAt)))
    .map((video) => publicVideoForProfile(state, video, account.id))
    .filter(Boolean);
  return { account: publicAccount(state, targetAccount), items };
}

module.exports = {
  getFollowState,
  followAccount,
  unfollowAccount,
  listFollowers,
  listFollowing,
  listFollowRequests,
  acceptFollowRequest,
  declineFollowRequest,
  getPublicProfile,
  listPublicPosts,
  listPublicVideos,
  isAcceptedFollower,
  canViewAccountContent
};
