const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const {
  getSummary,
  getContentMetrics,
  getBusinessMetrics,
  getOfferMetrics,
  getActionMetrics,
  recordMetricEvent
} = require('./metrics.service');

const router = express.Router();

router.get('/summary', requireSession, (req, res, next) => {
  try {
    res.json(getSummary({ userId: req.auth.user.id, activeAccountId: req.auth.activeAccountId, period: req.query.period }));
  } catch (error) {
    next(error);
  }
});

router.get('/content', requireSession, (req, res, next) => {
  try {
    res.json(getContentMetrics({ userId: req.auth.user.id, activeAccountId: req.auth.activeAccountId, period: req.query.period }));
  } catch (error) {
    next(error);
  }
});

router.get('/business', requireSession, (req, res, next) => {
  try {
    res.json(getBusinessMetrics({ userId: req.auth.user.id, activeAccountId: req.auth.activeAccountId, period: req.query.period }));
  } catch (error) {
    next(error);
  }
});

router.get('/offers', requireSession, (req, res, next) => {
  try {
    res.json(getOfferMetrics({ userId: req.auth.user.id, activeAccountId: req.auth.activeAccountId, period: req.query.period }));
  } catch (error) {
    next(error);
  }
});

router.get('/actions', requireSession, (req, res, next) => {
  try {
    res.json(getActionMetrics({ userId: req.auth.user.id, activeAccountId: req.auth.activeAccountId, period: req.query.period }));
  } catch (error) {
    next(error);
  }
});

router.post('/events', requireSession, (req, res, next) => {
  try {
    res.json(recordMetricEvent({ userId: req.auth.user.id, activeAccountId: req.auth.activeAccountId, input: req.body || {} }));
  } catch (error) {
    next(error);
  }
});

module.exports = { metricsRouter: router };
