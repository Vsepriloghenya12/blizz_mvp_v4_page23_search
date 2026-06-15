const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const {
  listSearchResults,
  listRecentSearches,
  addRecentSearch,
  deleteRecentSearch,
  clearRecentSearches
} = require('./search.service');

const router = express.Router();

router.get('/', requireSession, (req, res, next) => {
  try {
    res.json(listSearchResults({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      query: req.query.q,
      type: req.query.type
    }));
  } catch (error) {
    next(error);
  }
});

router.get('/recent', requireSession, (req, res, next) => {
  try {
    res.json(listRecentSearches({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId
    }));
  } catch (error) {
    next(error);
  }
});

router.post('/recent', requireSession, (req, res, next) => {
  try {
    res.status(201).json(addRecentSearch({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      input: req.body
    }));
  } catch (error) {
    next(error);
  }
});

router.delete('/recent', requireSession, (req, res, next) => {
  try {
    res.json(clearRecentSearches({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId
    }));
  } catch (error) {
    next(error);
  }
});

router.delete('/recent/:id', requireSession, (req, res, next) => {
  try {
    res.json(deleteRecentSearch({
      userId: req.auth.user.id,
      activeAccountId: req.auth.activeAccountId,
      id: req.params.id
    }));
  } catch (error) {
    next(error);
  }
});

module.exports = { searchRouter: router };
