const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const { listBusinessOffers } = require('../offers/offers.service');
const { getBusinessDashboard, updateOfferOwnerStatus } = require('../businessDashboard/businessDashboard.service');

const router = express.Router();

router.get('/dashboard', requireSession, (req, res, next) => {
  try {
    res.json(getBusinessDashboard({ userId: req.auth.user.id, activeAccountId: req.auth.activeAccountId, period: req.query.period }));
  } catch (error) {
    next(error);
  }
});

router.patch('/offers/:offerId/status', requireSession, (req, res, next) => {
  try {
    res.json(updateOfferOwnerStatus({ userId: req.auth.user.id, activeAccountId: req.auth.activeAccountId, offerId: req.params.offerId, input: req.body || {} }));
  } catch (error) {
    next(error);
  }
});

router.get('/:accountId/offers', requireSession, (req, res, next) => {
  try {
    const result = listBusinessOffers({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      accountId: req.params.accountId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { businessRouter: router };
