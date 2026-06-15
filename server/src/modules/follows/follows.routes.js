const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const {
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
  listPublicVideos
} = require('./follows.service');

const router = express.Router();


router.get('/accounts/:accountId/public-profile', requireSession, (req, res, next) => {
  try {
    res.json(getPublicProfile({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      targetAccountId: req.params.accountId
    }));
  } catch (error) {
    next(error);
  }
});

router.get('/accounts/:accountId/public-posts', requireSession, (req, res, next) => {
  try {
    res.json(listPublicPosts({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      targetAccountId: req.params.accountId
    }));
  } catch (error) {
    next(error);
  }
});

router.get('/accounts/:accountId/public-videos', requireSession, (req, res, next) => {
  try {
    res.json(listPublicVideos({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      targetAccountId: req.params.accountId
    }));
  } catch (error) {
    next(error);
  }
});

router.get('/accounts/:accountId/follow-state', requireSession, (req, res, next) => {
  try {
    res.json(getFollowState({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      targetAccountId: req.params.accountId
    }));
  } catch (error) {
    next(error);
  }
});

router.post('/accounts/:accountId/follow', requireSession, (req, res, next) => {
  try {
    res.json(followAccount({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      targetAccountId: req.params.accountId
    }));
  } catch (error) {
    next(error);
  }
});

router.delete('/accounts/:accountId/follow', requireSession, (req, res, next) => {
  try {
    res.json(unfollowAccount({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      targetAccountId: req.params.accountId
    }));
  } catch (error) {
    next(error);
  }
});

router.get('/accounts/:accountId/followers', requireSession, (req, res, next) => {
  try {
    res.json(listFollowers({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      targetAccountId: req.params.accountId
    }));
  } catch (error) {
    next(error);
  }
});

router.get('/accounts/:accountId/following', requireSession, (req, res, next) => {
  try {
    res.json(listFollowing({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      targetAccountId: req.params.accountId
    }));
  } catch (error) {
    next(error);
  }
});

router.get('/follow-requests', requireSession, (req, res, next) => {
  try {
    res.json(listFollowRequests({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId
    }));
  } catch (error) {
    next(error);
  }
});

router.post('/follow-requests/:requestId/accept', requireSession, (req, res, next) => {
  try {
    res.json(acceptFollowRequest({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      requestId: req.params.requestId
    }));
  } catch (error) {
    next(error);
  }
});

router.post('/follow-requests/:requestId/decline', requireSession, (req, res, next) => {
  try {
    res.json(declineFollowRequest({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      requestId: req.params.requestId
    }));
  } catch (error) {
    next(error);
  }
});

module.exports = { followsRouter: router };
