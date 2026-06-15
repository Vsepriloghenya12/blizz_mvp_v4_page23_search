const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page22-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4622';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');
const app = createApp();
const server = app.listen(4622);
const base = 'http://127.0.0.1:4622';

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

async function register(login) {
  return (await request('/api/auth/register', { method: 'POST', body: { login, password: '123456' } })).json;
}

(async () => {
  try {
    const suffix = Date.now().toString().slice(-8);
    const owner = await register(`page22_owner_${suffix}@test.ru`);
    const ownerToken = owner.session.token;
    const ownerAccountId = owner.activeAccount.id;

    const publicPost = (await request('/api/posts', {
      method: 'POST',
      token: ownerToken,
      body: {
        media: [{ type: 'image', url: 'https://example.com/public.jpg' }],
        text: 'Открытый пост для публичного профиля',
        visibility: 'public',
        location: { title: 'Место профиля', address: 'Сочи', precision: 'area' }
      }
    })).json.post;

    const viewer = await register(`page22_viewer_${suffix}@test.ru`);
    const viewerToken = viewer.session.token;

    const publicProfile = (await request(`/api/accounts/${ownerAccountId}/public-profile`, { token: viewerToken })).json;
    if (publicProfile.account.id !== ownerAccountId) throw new Error('Public profile should return target account');
    if (!publicProfile.canViewContent) throw new Error('Open public profile should be viewable');
    if (publicProfile.followState !== 'not_following') throw new Error('Initial public follow state should be not_following');
    if (publicProfile.stats.posts !== 1) throw new Error('Public profile should include post count');

    const publicPosts = (await request(`/api/accounts/${ownerAccountId}/public-posts`, { token: viewerToken })).json;
    if (!publicPosts.items.some((item) => item.id === publicPost.id)) throw new Error('Viewer should see public profile post');

    await request('/api/settings/me', {
      method: 'PATCH',
      token: ownerToken,
      body: { privacy: { isPrivateAccount: true, defaultPostVisibility: 'followers' } }
    });
    const privatePost = (await request('/api/posts', {
      method: 'POST',
      token: ownerToken,
      body: {
        media: [{ type: 'image', url: 'https://example.com/private.jpg' }],
        text: 'Закрытый пост',
        visibility: 'followers'
      }
    })).json.post;

    const hiddenProfile = (await request(`/api/accounts/${ownerAccountId}/public-profile`, { token: viewerToken })).json;
    if (hiddenProfile.canViewContent) throw new Error('Private profile should hide content from non-follower');
    const hiddenPosts = (await request(`/api/accounts/${ownerAccountId}/public-posts`, { token: viewerToken })).json;
    if (hiddenPosts.items.some((item) => item.id === privatePost.id)) throw new Error('Private followers-only post should be hidden');

    const followResult = (await request(`/api/accounts/${ownerAccountId}/follow`, { method: 'POST', token: viewerToken })).json;
    if (followResult.followState !== 'requested') throw new Error('Private follow should be requested');
    const requests = (await request('/api/follow-requests', { token: ownerToken })).json.requests;
    await request(`/api/follow-requests/${requests[0].id}/accept`, { method: 'POST', token: ownerToken });
    const visibleProfile = (await request(`/api/accounts/${ownerAccountId}/public-profile`, { token: viewerToken })).json;
    if (!visibleProfile.canViewContent || visibleProfile.followState !== 'following') throw new Error('Accepted follower should view private profile content');
    const visiblePosts = (await request(`/api/accounts/${ownerAccountId}/public-posts`, { token: viewerToken })).json;
    if (!visiblePosts.items.some((item) => item.id === privatePost.id)) throw new Error('Accepted follower should see private post');

    const businessAuth = await request('/api/accounts/business', {
      method: 'POST',
      token: viewerToken,
      body: {
        name: `Кофейня ${suffix}`,
        username: `coffee_${suffix}`.toLowerCase(),
        category: 'Еда и напитки',
        description: 'Бизнес для публичного профиля',
        address: 'Сочи, Морская 1',
        phone: '+79990000000',
        website: 'https://example.com'
      }
    });
    const businessId = businessAuth.json.activeAccount.id;
    const businessProfile = (await request(`/api/accounts/${businessId}/public-profile`, { token: ownerToken })).json;
    if (businessProfile.account.type !== 'business') throw new Error('Business public profile should return business account');
    if (!businessProfile.account.businessProfile || businessProfile.account.businessProfile.address !== 'Сочи, Морская 1') {
      throw new Error('Business public profile should include business details');
    }

    const missing = await request('/api/accounts/nope/public-profile', { token: ownerToken, allowError: true });
    if (missing.status !== 404) throw new Error('Missing public profile should return 404');

    console.log('page22 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
