const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const {
  createVideo,
  getVideoDetail,
  listMyVideos,
  listVideoFeed,
  toggleVideoLike,
  toggleVideoSave
} = require('./videos.service');

const router = express.Router();

router.get('/feed', requireSession, (req, res, next) => {
  try {
    const result = listVideoFeed({
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
    const result = listMyVideos({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:videoId', requireSession, (req, res, next) => {
  try {
    const result = getVideoDetail({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      videoId: req.params.videoId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireSession, (req, res, next) => {
  try {
    const result = createVideo({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      input: req.body
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:videoId/like', requireSession, (req, res, next) => {
  try {
    const result = toggleVideoLike({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      videoId: req.params.videoId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:videoId/save', requireSession, (req, res, next) => {
  try {
    const result = toggleVideoSave({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      videoId: req.params.videoId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { videosRouter: router };
