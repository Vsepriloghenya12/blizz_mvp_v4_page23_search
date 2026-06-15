const express = require('express');
const { requireSession } = require('../../shared/http/sessionMiddleware');
const {
  createReport,
  listMyReports,
  listBusinessReports,
  updateBusinessReportOwnerStatus,
  listModerationReports,
  updateModerationReportStatus
} = require('./reports.service');

const reportsRouter = express.Router();
const moderationRouter = express.Router();

reportsRouter.post('/', requireSession, (req, res, next) => {
  try {
    res.json(createReport({ userId: req.auth.user.id, activeAccountId: req.auth.activeAccountId, input: req.body || {} }));
  } catch (error) {
    next(error);
  }
});

reportsRouter.get('/my', requireSession, (req, res, next) => {
  try {
    res.json(listMyReports({ userId: req.auth.user.id, activeAccountId: req.auth.activeAccountId }));
  } catch (error) {
    next(error);
  }
});

reportsRouter.get('/business', requireSession, (req, res, next) => {
  try {
    res.json(listBusinessReports({ userId: req.auth.user.id, activeAccountId: req.auth.activeAccountId, status: req.query.status }));
  } catch (error) {
    next(error);
  }
});

reportsRouter.patch('/business/:reportId/owner-status', requireSession, (req, res, next) => {
  try {
    res.json(updateBusinessReportOwnerStatus({ userId: req.auth.user.id, activeAccountId: req.auth.activeAccountId, reportId: req.params.reportId, input: req.body || {} }));
  } catch (error) {
    next(error);
  }
});

moderationRouter.get('/reports', requireSession, (req, res, next) => {
  try {
    res.json(listModerationReports({ userId: req.auth.user.id, activeAccountId: req.auth.activeAccountId, status: req.query.status }));
  } catch (error) {
    next(error);
  }
});

moderationRouter.patch('/reports/:reportId/status', requireSession, (req, res, next) => {
  try {
    res.json(updateModerationReportStatus({ userId: req.auth.user.id, activeAccountId: req.auth.activeAccountId, reportId: req.params.reportId, input: req.body || {} }));
  } catch (error) {
    next(error);
  }
});

module.exports = { reportsRouter, moderationRouter };
