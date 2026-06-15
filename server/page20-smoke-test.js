const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page20-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4600';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');

const app = createApp();
const server = app.listen(4600);
const base = 'http://127.0.0.1:4600';

async function request(pathname, options = {}) {
  const response = await fetch(`${base}${pathname}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const json = await response.json().catch(() => null);
  if (!response.ok && !options.allowError) {
    throw new Error(`${options.method || 'GET'} ${pathname} failed ${response.status}: ${JSON.stringify(json)}`);
  }
  return { status: response.status, json };
}

(async () => {
  try {
    const suffix = Date.now().toString().slice(-8);
    const auth = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page20_${suffix}@test.ru`, password: '123456' }
    })).json;

    const token = auth.session.token;
    const personalAccountId = auth.activeAccount.id;

    const initial = (await request('/api/settings/me', { token })).json;
    if (initial.account.id !== personalAccountId) throw new Error('Settings should belong to active account');
    if (initial.settings.map.showLiveLocation !== false) throw new Error('Live location should be disabled by default');
    if (initial.settings.privacy.draftsVisibility !== 'only_me') throw new Error('Drafts should stay private');

    const updated = (await request('/api/settings/me', {
      method: 'PATCH',
      token,
      body: {
        userId: 'malicious_user_id_should_be_ignored',
        privacy: {
          isPrivateAccount: true,
          defaultPostVisibility: 'followers',
          defaultVideoVisibility: 'close_friends',
          defaultStoryVisibility: 'followers'
        },
        map: {
          showLiveLocation: true,
          geotagsVisibility: 'followers',
          showPublicationsOnMap: false,
          locationPrecision: 'area',
          placesHistoryEnabled: true,
          recommendationRadius: '5km'
        },
        messages: {
          allowMessagesFrom: 'followers',
          allowStoryRepliesFrom: 'close_friends',
          allowGroupInvitesFrom: 'followers',
          gamesInMessagesEnabled: false,
          allowGameInvitesFrom: 'nobody',
          autoSaveSharedPlaces: true,
          chatContentPreview: false
        },
        content: {
          recommendationsNearby: false,
          showLikeAndShareCounts: false
        },
        safety: {
          interactionLimitsEnabled: true,
          suspiciousMessagesFilter: true,
          familySafetyMode: true,
          teenRestrictionsEnabled: true
        }
      }
    })).json;

    if (updated.account.id !== personalAccountId) throw new Error('PATCH should keep active account scope');
    if (updated.settings.privacy.isPrivateAccount !== true) throw new Error('Private account should update');
    if (updated.settings.map.showLiveLocation !== false) throw new Error('Live location must stay false even if client sends true');
    if (updated.settings.map.recommendationRadius !== '5km') throw new Error('Recommendation radius should update');
    if (updated.settings.messages.gamesInMessagesEnabled !== false) throw new Error('Games setting should update');
    if (updated.settings.messages.allowGameInvitesFrom !== 'nobody') throw new Error('Game invite setting should update');

    const profile = (await request('/api/profile/me', { token })).json.profile;
    if (profile.isPrivate !== true) throw new Error('Profile privacy should sync from settings');

    const bad = await request('/api/settings/me', {
      method: 'PATCH',
      token,
      body: { map: { recommendationRadius: '100km' } },
      allowError: true
    });
    if (bad.status !== 400) throw new Error('Invalid settings values should be rejected');

    const businessAuth = (await request('/api/accounts/business', {
      method: 'POST',
      token,
      body: {
        name: `Кафе настроек ${suffix}`,
        username: `settings_cafe_${suffix}`.toLowerCase(),
        category: 'Еда и напитки',
        description: 'Тестовый бизнес',
        address: 'Сочи, Морская 1',
        phone: '+79990000000',
        website: 'https://example.com'
      }
    })).json;

    const businessSettings = (await request('/api/settings/me', { token })).json;
    if (businessSettings.account.id !== businessAuth.activeAccount.id) throw new Error('Settings should follow switched business account');
    if (businessSettings.account.id === personalAccountId) throw new Error('Business settings should be separate from personal settings');
    if (businessSettings.settings.privacy.isPrivateAccount !== false) throw new Error('Business settings should not inherit personal privacy');

    const personalAgain = (await request('/api/accounts/switch', {
      method: 'POST',
      token,
      body: { accountId: personalAccountId }
    })).json;
    if (personalAgain.activeAccount.id !== personalAccountId) throw new Error('Switch back to personal account failed');

    const personalSettingsAgain = (await request('/api/settings/me', { token })).json;
    if (personalSettingsAgain.settings.privacy.isPrivateAccount !== true) throw new Error('Personal settings should persist separately');

    console.log('page20 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
