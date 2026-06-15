const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { createId } = require('../../shared/security/password');
const { canViewAccountContent } = require('../follows/follows.service');
const { isBlockedBetween, assertNotBlocked } = require('../blocks/blocks.service');
const { createNotification } = require('../notifications/notifications.service');

const POST_CREATOR_ROLES = new Set(['owner', 'admin', 'smm']);
const VISIBILITY_VALUES = new Set(['public', 'followers', 'close_friends', 'selected']);

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

function assertCanCreatePost(account, membership) {
  if (account.type === 'personal') {
    return;
  }

  if (account.type === 'business' && POST_CREATOR_ROLES.has(membership.role)) {
    return;
  }

  throw new HttpError(403, 'POST_CREATE_FORBIDDEN', 'Нет доступа к созданию постов');
}

function validateUrl(value) {
  const url = sanitizeString(value);
  if (!url) return '';

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('invalid protocol');
    }
    return parsed.toString();
  } catch (_error) {
    throw new HttpError(400, 'MEDIA_URL_INVALID', 'Добавьте корректную ссылку на изображение');
  }
}

function normalizeMedia(input, { requireMedia }) {
  const media = Array.isArray(input) ? input : [];

  if (requireMedia && media.length === 0) {
    throw new HttpError(400, 'POST_MEDIA_REQUIRED', 'Добавьте хотя бы одно фото');
  }

  if (media.length > 10) {
    throw new HttpError(400, 'POST_MEDIA_LIMIT', 'В пост можно добавить не больше 10 фото');
  }

  return media.map((item, index) => {
    const type = item && item.type === 'image' ? 'image' : null;
    if (!type) {
      throw new HttpError(400, 'MEDIA_TYPE_INVALID', 'В пост можно добавить только фото');
    }

    return {
      id: createId('media'),
      type: 'image',
      url: validateUrl(item.url),
      order: index
    };
  });
}

function normalizeLocation(input) {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const title = sanitizeString(input.title);
  const address = sanitizeString(input.address);

  if (!title && !address) {
    return null;
  }

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

function normalizePostInput(input, { requireMedia }) {
  const payload = input || {};
  const text = sanitizeString(payload.text);
  const visibility = sanitizeString(payload.visibility) || 'public';

  if (text.length > 2200) {
    throw new HttpError(400, 'POST_TEXT_TOO_LONG', 'Текст поста должен быть не длиннее 2200 символов');
  }

  if (!VISIBILITY_VALUES.has(visibility)) {
    throw new HttpError(400, 'POST_VISIBILITY_INVALID', 'Выберите видимость поста');
  }

  const media = normalizeMedia(payload.media, { requireMedia });

  return {
    media,
    text,
    location: normalizeLocation(payload.location),
    visibility
  };
}

function publicPost(post) {
  return {
    id: post.id,
    accountId: post.accountId,
    status: post.status,
    media: post.media,
    text: post.text,
    location: post.location,
    visibility: post.visibility,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt || null
  };
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

function publicFeedPost(state, post, viewerAccountId) {
  const author = state.accounts.find((account) => account.id === post.accountId);
  if (!author) return null;

  const businessProfile = author.type === 'business'
    ? state.businessProfiles.find((profile) => profile.accountId === author.id)
    : null;

  const likes = (state.postLikes || []).filter((like) => like.postId === post.id && like.status === 'active');
  const savedItems = (state.savedItems || []).filter((item) => {
    return item.targetType === 'post' && item.targetId === post.id && item.status === 'active';
  });

  return {
    ...publicPost(post),
    author: publicAuthor(author, businessProfile),
    likesCount: likes.length,
    commentsCount: post.commentCount || 0,
    savesCount: savedItems.length,
    isLikedByMe: likes.some((like) => like.accountId === viewerAccountId),
    isSavedByMe: savedItems.some((item) => item.accountId === viewerAccountId)
  };
}

function createPost({ userId, activeAccountId, input }) {
  const payload = normalizePostInput(input, { requireMedia: true });

  return db.transaction((state) => {
    const { account, membership } = getActiveAccountContext(state, userId, activeAccountId);
    assertCanCreatePost(account, membership);

    const now = new Date().toISOString();
    const post = {
      id: createId('post'),
      accountId: account.id,
      authorUserId: userId,
      status: 'published',
      media: payload.media,
      text: payload.text,
      location: payload.location,
      visibility: payload.visibility,
      likeCount: 0,
      commentCount: 0,
      saveCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: now
    };

    state.posts.push(post);
    return { post: publicPost(post) };
  });
}

function createDraft({ userId, activeAccountId, input }) {
  const payload = normalizePostInput(input, { requireMedia: false });

  return db.transaction((state) => {
    const { account, membership } = getActiveAccountContext(state, userId, activeAccountId);
    assertCanCreatePost(account, membership);

    const now = new Date().toISOString();
    const draft = {
      id: createId('draft'),
      accountId: account.id,
      authorUserId: userId,
      status: 'draft',
      media: payload.media,
      text: payload.text,
      location: payload.location,
      visibility: payload.visibility,
      createdAt: now,
      updatedAt: now
    };

    state.drafts.push(draft);
    return { draft: publicPost(draft) };
  });
}

function listMyPosts({ userId, activeAccountId }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);

  const posts = (state.posts || [])
    .filter((post) => post.accountId === account.id && post.status === 'published')
    .sort((a, b) => String(b.publishedAt || b.createdAt).localeCompare(String(a.publishedAt || a.createdAt)))
    .map(publicPost);

  return { posts };
}

function listMyDrafts({ userId, activeAccountId }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);

  const drafts = (state.drafts || [])
    .filter((draft) => draft.accountId === account.id && draft.status === 'draft')
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))
    .map(publicPost);

  return { drafts };
}

function listFeed({ userId, activeAccountId, scope }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);

  const items = (state.posts || [])
    .filter((post) => post.status === 'published')
    .filter((post) => {
      const author = state.accounts.find((item) => item.id === post.accountId && item.status !== 'archived');
      if (!author) return false;
      if (scope === 'business') return author.type === 'business';
      return author.type === 'personal';
    })
    .filter((post) => canViewAccountContent(state, account.id, post.accountId, post.visibility))
    .sort((a, b) => String(b.publishedAt || b.createdAt).localeCompare(String(a.publishedAt || a.createdAt)))
    .map((post) => publicFeedPost(state, post, account.id))
    .filter(Boolean);

  return { items };
}

function getPostDetail({ userId, activeAccountId, postId }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);
  const post = findPublishedPost(state, postId);
  assertCanViewPost(state, post, account.id);

  return { post: publicFeedPost(state, post, account.id) };
}

function findPublishedPost(state, postId) {
  const post = (state.posts || []).find((item) => item.id === postId && item.status === 'published');
  if (!post) {
    throw new HttpError(404, 'POST_NOT_FOUND', 'Пост не найден');
  }
  return post;
}

function togglePostLike({ userId, activeAccountId, postId }) {
  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    const post = findPublishedPost(state, postId);
    const now = new Date().toISOString();

    const existing = (state.postLikes || []).find((like) => like.postId === post.id && like.accountId === account.id);
    let isLikedByMe;

    if (existing && existing.status === 'active') {
      existing.status = 'removed';
      existing.updatedAt = now;
      isLikedByMe = false;
    } else if (existing) {
      existing.status = 'active';
      existing.updatedAt = now;
      isLikedByMe = true;
    } else {
      state.postLikes.push({
        id: createId('post_like'),
        postId: post.id,
        accountId: account.id,
        userId,
        status: 'active',
        createdAt: now,
        updatedAt: now
      });
      isLikedByMe = true;
    }

    const likesCount = (state.postLikes || []).filter((like) => like.postId === post.id && like.status === 'active').length;
    post.likeCount = likesCount;
    post.updatedAt = now;

    if (isLikedByMe) {
      createNotification(state, {
        accountId: post.accountId,
        type: 'post_like',
        title: `${account.name} отметил ваш пост`,
        body: 'Новая отметка “Нравится”',
        targetType: 'post',
        targetId: post.id,
        actorAccountId: account.id
      });
    }

    return { postId: post.id, likesCount, isLikedByMe };
  });
}

function togglePostSave({ userId, activeAccountId, postId }) {
  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    const post = findPublishedPost(state, postId);
    const now = new Date().toISOString();

    const existing = (state.savedItems || []).find((item) => {
      return item.accountId === account.id && item.targetType === 'post' && item.targetId === post.id;
    });
    let isSavedByMe;

    if (existing && existing.status === 'active') {
      existing.status = 'removed';
      existing.updatedAt = now;
      isSavedByMe = false;
    } else if (existing) {
      existing.status = 'active';
      existing.updatedAt = now;
      isSavedByMe = true;
    } else {
      state.savedItems.push({
        id: createId('saved'),
        accountId: account.id,
        userId,
        targetType: 'post',
        targetId: post.id,
        status: 'active',
        createdAt: now,
        updatedAt: now
      });
      isSavedByMe = true;
    }

    const savesCount = (state.savedItems || []).filter((item) => {
      return item.targetType === 'post' && item.targetId === post.id && item.status === 'active';
    }).length;
    post.saveCount = savesCount;
    post.updatedAt = now;

    return { postId: post.id, savesCount, isSavedByMe };
  });
}


function canViewPublishedPost(state, post, viewerAccountId) {
  return canViewAccountContent(state, viewerAccountId, post.accountId, post.visibility);
}

function assertCanViewPost(state, post, viewerAccountId) {
  if (!canViewPublishedPost(state, post, viewerAccountId)) {
    throw new HttpError(403, 'POST_ACCESS_DENIED', 'Пост недоступен');
  }
}

function sanitizeCommentText(value) {
  const text = sanitizeString(value);
  if (!text) {
    throw new HttpError(400, 'COMMENT_TEXT_REQUIRED', 'Введите комментарий');
  }
  if (text.length > 500) {
    throw new HttpError(400, 'COMMENT_TEXT_TOO_LONG', 'Комментарий должен быть не длиннее 500 символов');
  }
  return text;
}

function publicCommentAuthor(account, businessProfile) {
  return {
    id: account.id,
    type: account.type,
    name: account.name,
    username: account.username,
    avatar: account.avatar || null,
    businessCategory: businessProfile ? businessProfile.category : null
  };
}

function publicComment(state, comment, viewerAccountId, post) {
  const author = state.accounts.find((account) => account.id === comment.accountId);
  if (!author) return null;

  const businessProfile = author.type === 'business'
    ? state.businessProfiles.find((profile) => profile.accountId === author.id)
    : null;

  return {
    id: comment.id,
    postId: comment.postId,
    accountId: comment.accountId,
    author: publicCommentAuthor(author, businessProfile),
    text: comment.text,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    canDelete: comment.accountId === viewerAccountId || post.accountId === viewerAccountId
  };
}

function getActiveComments(state, postId) {
  return (state.postComments || [])
    .filter((comment) => comment.postId === postId && comment.status === 'active')
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

function listPostComments({ userId, activeAccountId, postId }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);
  const post = findPublishedPost(state, postId);
  assertCanViewPost(state, post, account.id);

  const comments = getActiveComments(state, post.id)
    .filter((comment) => !isBlockedBetween(state, account.id, comment.accountId))
    .map((comment) => publicComment(state, comment, account.id, post))
    .filter(Boolean);

  return { postId: post.id, comments, commentsCount: comments.length };
}

function createPostComment({ userId, activeAccountId, postId, input }) {
  const text = sanitizeCommentText(input && input.text);

  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    const post = findPublishedPost(state, postId);
    assertCanViewPost(state, post, account.id);
    assertNotBlocked(state, account.id, post.accountId, 'Нельзя комментировать публикацию этого аккаунта');

    const now = new Date().toISOString();
    const comment = {
      id: createId('comment'),
      postId: post.id,
      accountId: account.id,
      authorUserId: userId,
      text,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    state.postComments.push(comment);
    const commentsCount = getActiveComments(state, post.id).length;
    post.commentCount = commentsCount;
    post.updatedAt = now;

    createNotification(state, {
      accountId: post.accountId,
      type: 'comment',
      title: `${account.name} прокомментировал ваш пост`,
      body: text,
      targetType: 'post',
      targetId: post.id,
      actorAccountId: account.id
    });

    return {
      comment: publicComment(state, comment, account.id, post),
      commentsCount
    };
  });
}

function deletePostComment({ userId, activeAccountId, commentId }) {
  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    const comment = (state.postComments || []).find((item) => item.id === commentId && item.status === 'active');
    if (!comment) {
      throw new HttpError(404, 'COMMENT_NOT_FOUND', 'Комментарий не найден');
    }

    const post = findPublishedPost(state, comment.postId);
    assertCanViewPost(state, post, account.id);

    const canDelete = comment.accountId === account.id || post.accountId === account.id;
    if (!canDelete) {
      throw new HttpError(403, 'COMMENT_DELETE_FORBIDDEN', 'Нет доступа к удалению комментария');
    }

    const now = new Date().toISOString();
    comment.status = 'deleted';
    comment.updatedAt = now;
    comment.deletedAt = now;
    comment.deletedByAccountId = account.id;

    const commentsCount = getActiveComments(state, post.id).length;
    post.commentCount = commentsCount;
    post.updatedAt = now;

    return { commentId: comment.id, postId: post.id, commentsCount };
  });
}

module.exports = {
  createPost,
  createDraft,
  listMyPosts,
  listMyDrafts,
  listFeed,
  getPostDetail,
  publicFeedPost,
  togglePostLike,
  togglePostSave,
  listPostComments,
  createPostComment,
  deletePostComment
};
