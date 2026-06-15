const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationSettings,
  updateNotificationSettings,
  savePushToken,
  deletePushToken
} = require('./notifications.service');

const router = express.Router();

router.get('/', requireSession, (req, res, next) => {
  try {
    res.json(listNotifications({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      filter: req.query.filter
    }));
  } catch (error) {
    next(error);
  }
});

router.post('/read', requireSession, (req, res, next) => {
  try {
    res.json(markAllNotificationsRead({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId
    }));
  } catch (error) {
    next(error);
  }
});

router.post('/:notificationId/read', requireSession, (req, res, next) => {
  try {
    res.json(markNotificationRead({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      notificationId: req.params.notificationId
    }));
  } catch (error) {
    next(error);
  }
});

router.get('/settings', requireSession, (req, res, next) => {
  try {
    res.json(getNotificationSettings({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId
    }));
  } catch (error) {
    next(error);
  }
});

router.patch('/settings', requireSession, (req, res, next) => {
  try {
    res.json(updateNotificationSettings({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      input: req.body || {}
    }));
  } catch (error) {
    next(error);
  }
});

router.post('/push-tokens', requireSession, (req, res, next) => {
  try {
    res.json(savePushToken({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      input: req.body || {}
    }));
  } catch (error) {
    next(error);
  }
});

router.delete('/push-tokens/:deviceId', requireSession, (req, res, next) => {
  try {
    res.json(deletePushToken({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      deviceId: req.params.deviceId
    }));
  } catch (error) {
    next(error);
  }
});

module.exports = { notificationsRouter: router };
