const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const {
  createStory,
  getStoryDetail,
  listStoryFeed,
  listMyStories,
  listAccountStories,
  markStoryView,
  replyToStory
} = require('./stories.service');

const router = express.Router();

router.get('/feed', requireSession, (req, res, next) => {
  try {
    const result = listStoryFeed({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/my', requireSession, (req, res, next) => {
  try {
    const result = listMyStories({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/detail/:storyId', requireSession, (req, res, next) => {
  try {
    const result = getStoryDetail({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      storyId: req.params.storyId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:accountId', requireSession, (req, res, next) => {
  try {
    const result = listAccountStories({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      accountId: req.params.accountId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireSession, (req, res, next) => {
  try {
    const result = createStory({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      input: req.body
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:storyId/view', requireSession, (req, res, next) => {
  try {
    const result = markStoryView({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      storyId: req.params.storyId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:storyId/reply', requireSession, (req, res, next) => {
  try {
    const result = replyToStory({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      storyId: req.params.storyId,
      input: req.body
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { storiesRouter: router };
