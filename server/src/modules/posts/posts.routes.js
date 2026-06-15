const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const {
  createPost,
  createDraft,
  listMyPosts,
  listMyDrafts,
  listFeed,
  getPostDetail,
  togglePostLike,
  togglePostSave,
  listPostComments,
  createPostComment
} = require('./posts.service');

const router = express.Router();

router.get('/feed', requireSession, (req, res, next) => {
  try {
    const result = listFeed({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      scope: req.query.scope === 'business' ? 'business' : 'personal'
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/my', requireSession, (req, res, next) => {
  try {
    const result = listMyPosts({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireSession, (req, res, next) => {
  try {
    const result = createPost({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      input: req.body
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/drafts', requireSession, (req, res, next) => {
  try {
    const result = listMyDrafts({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/drafts', requireSession, (req, res, next) => {
  try {
    const result = createDraft({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      input: req.body
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:postId', requireSession, (req, res, next) => {
  try {
    const result = getPostDetail({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      postId: req.params.postId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:postId/comments', requireSession, (req, res, next) => {
  try {
    const result = listPostComments({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      postId: req.params.postId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:postId/comments', requireSession, (req, res, next) => {
  try {
    const result = createPostComment({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      postId: req.params.postId,
      input: req.body
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:postId/like', requireSession, (req, res, next) => {
  try {
    const result = togglePostLike({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      postId: req.params.postId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:postId/save', requireSession, (req, res, next) => {
  try {
    const result = togglePostSave({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      postId: req.params.postId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { postsRouter: router };
