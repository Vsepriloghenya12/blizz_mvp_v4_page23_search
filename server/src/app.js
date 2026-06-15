const express = require('express');
const path = require('path');
const cors = require('cors');
const { env } = require('./config/env');
const { authRouter } = require('./modules/auth/auth.routes');
const { accountsRouter } = require('./modules/accounts/accounts.routes');
const { profileRouter } = require('./modules/profile/profile.routes');
const { postsRouter } = require('./modules/posts/posts.routes');
const { commentsRouter } = require('./modules/comments/comments.routes');
const { shareRouter } = require('./modules/share/share.routes');
const { videosRouter } = require('./modules/videos/videos.routes');
const { storiesRouter } = require('./modules/stories/stories.routes');
const { offersRouter } = require('./modules/offers/offers.routes');
const { businessRouter } = require('./modules/business/business.routes');
const { mapRouter } = require('./modules/map/map.routes');
const { savedRouter } = require('./modules/saved/saved.routes');
const { messagesRouter } = require('./modules/messages/messages.routes');
const { gamesRouter } = require('./modules/games/games.routes');
const { settingsRouter } = require('./modules/settings/settings.routes');
const { followsRouter } = require('./modules/follows/follows.routes');
const { searchRouter } = require('./modules/search/search.routes');
const { blocksRouter } = require('./modules/blocks/blocks.routes');
const { notificationsRouter } = require('./modules/notifications/notifications.routes');
const { metricsRouter } = require('./modules/metrics/metrics.routes');
const { reportsRouter, moderationRouter } = require('./modules/reports/reports.routes');
const { serviceOwnerRouter } = require('./modules/serviceOwner/serviceOwner.routes');
const { notFoundHandler, errorHandler } = require('./shared/http/httpError');

function createApp() {
  const app = express();

  app.use(cors({ origin: env.clientOrigin, credentials: false }));
  app.use(express.json({ limit: '1mb' }));

  const serviceOwnerPublicPath = path.join(__dirname, '..', 'public', 'service-owner');
  app.get(['/owner', '/owner/'], (_req, res) => {
    res.sendFile(path.join(serviceOwnerPublicPath, 'index.html'));
  });
  app.get(['/service-owner', '/service-owner/'], (_req, res) => {
    res.sendFile(path.join(serviceOwnerPublicPath, 'index.html'));
  });
  app.use('/owner', express.static(serviceOwnerPublicPath));
  app.use('/service-owner', express.static(serviceOwnerPublicPath));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'blizz-mvp-v4-server' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/accounts', accountsRouter);
  app.use('/api/profile', profileRouter);
  app.use('/api/posts', postsRouter);
  app.use('/api/comments', commentsRouter);
  app.use('/api/share', shareRouter);
  app.use('/api/videos', videosRouter);
  app.use('/api/stories', storiesRouter);
  app.use('/api/offers', offersRouter);
  app.use('/api/business', businessRouter);
  app.use('/api/map', mapRouter);
  app.use('/api/saved', savedRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/games', gamesRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api', followsRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/blocks', blocksRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/metrics', metricsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/moderation', moderationRouter);
  app.use('/api/service-owner', serviceOwnerRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
