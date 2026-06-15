const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const { createOffer, getOfferById, listMyOffers, listShowcase, saveOffer } = require('./offers.service');

const router = express.Router();

router.get('/showcase', requireSession, (req, res, next) => {
  try {
    const result = listShowcase({
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
    const result = listMyOffers({
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
    const result = createOffer({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      input: req.body
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:offerId', requireSession, (req, res, next) => {
  try {
    const result = getOfferById({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      offerId: req.params.offerId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:offerId/save', requireSession, (req, res, next) => {
  try {
    const result = saveOffer({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      offerId: req.params.offerId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = { offersRouter: router };
