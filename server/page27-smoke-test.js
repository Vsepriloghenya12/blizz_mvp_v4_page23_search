const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page27-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4627';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');
const app = createApp();
const server = app.listen(4627);
const base = 'http://127.0.0.1:4627';

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

async function acceptOnlyRequest(ownerToken) {
  const requests = (await request('/api/follow-requests', { token: ownerToken })).json.requests;
  if (requests.length !== 1) throw new Error('Expected one follow request');
  await request(`/api/follow-requests/${requests[0].id}/accept`, { method: 'POST', token: ownerToken });
}

(async () => {
  try {
    const suffix = Date.now().toString().slice(-8);
    const owner = await register(`page27_owner_${suffix}@test.ru`);
    const ownerToken = owner.session.token;
    const ownerAccountId = owner.activeAccount.id;

    await request('/api/settings/me', {
      method: 'PATCH',
      token: ownerToken,
      body: { privacy: { isPrivateAccount: true } }
    });

    const post = (await request('/api/posts', {
      method: 'POST',
      token: ownerToken,
      body: {
        media: [{ type: 'image', url: 'https://example.com/page27-private.jpg' }],
        text: 'Followers-only post for share privacy',
        visibility: 'followers'
      }
    })).json.post;

    const follower = await register(`page27_follower_${suffix}@test.ru`);
    const followerToken = follower.session.token;
    const followerAccountId = follower.activeAccount.id;

    await request(`/api/accounts/${ownerAccountId}/follow`, { method: 'POST', token: followerToken });
    await acceptOnlyRequest(ownerToken);

    const businessAuth = (await request('/api/accounts/business', {
      method: 'POST',
      token: followerToken,
      body: {
        name: 'Page 27 Business',
        username: `page27biz_${suffix}`,
        category: 'Другое'
      }
    })).json;
    const targetBusinessId = businessAuth.activeAccount.id;

    await request('/api/accounts/switch', {
      method: 'POST',
      token: followerToken,
      body: { accountId: followerAccountId }
    });

    const denied = await request('/api/share/post', {
      method: 'POST',
      token: followerToken,
      body: { postId: post.id, targetAccountId: targetBusinessId },
      allowError: true
    });
    if (denied.status !== 403) throw new Error('Share should not leak followers-only post to a target without access');

    await request('/api/accounts/switch', {
      method: 'POST',
      token: followerToken,
      body: { accountId: targetBusinessId }
    });
    await request(`/api/accounts/${ownerAccountId}/follow`, { method: 'POST', token: followerToken });
    await acceptOnlyRequest(ownerToken);

    await request('/api/accounts/switch', {
      method: 'POST',
      token: followerToken,
      body: { accountId: followerAccountId }
    });
    const shared = (await request('/api/share/post', {
      method: 'POST',
      token: followerToken,
      body: { postId: post.id, targetAccountId: targetBusinessId }
    })).json;
    if (!shared.sharedContent || shared.sharedContent.contentId !== post.id) throw new Error('Share should work when sender and target can view post');

    console.log('page27 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
