const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page21-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4621';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');

const app = createApp();
const server = app.listen(4621);
const base = 'http://127.0.0.1:4621';

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
  return (await request('/api/auth/register', {
    method: 'POST',
    body: { login, password: '123456' }
  })).json;
}

(async () => {
  try {
    const suffix = Date.now().toString().slice(-8);
    const owner = await register(`page21_owner_${suffix}@test.ru`);
    const ownerToken = owner.session.token;
    const ownerAccountId = owner.activeAccount.id;

    await request('/api/settings/me', {
      method: 'PATCH',
      token: ownerToken,
      body: { privacy: { isPrivateAccount: true, defaultPostVisibility: 'followers' } }
    });

    const post = (await request('/api/posts', {
      method: 'POST',
      token: ownerToken,
      body: {
        media: [{ type: 'image', url: 'https://example.com/private.jpg' }],
        text: 'Пост для подписчиков',
        visibility: 'followers',
        location: { title: 'Закрытая точка', address: 'Сочи', precision: 'area' }
      }
    })).json.post;

    const follower = await register(`page21_follower_${suffix}@test.ru`);
    const followerToken = follower.session.token;

    const beforeFollowFeed = (await request('/api/posts/feed?scope=personal', { token: followerToken })).json;
    if (beforeFollowFeed.items.some((item) => item.id === post.id)) {
      throw new Error('Follower candidate should not see followers-only post before accepted follow');
    }

    const followResult = (await request(`/api/accounts/${ownerAccountId}/follow`, {
      method: 'POST',
      token: followerToken
    })).json;
    if (followResult.followState !== 'requested') throw new Error('Private account follow should create pending request');

    const requests = (await request('/api/follow-requests', { token: ownerToken })).json.requests;
    if (requests.length !== 1) throw new Error('Private owner should see one follow request');

    const requestId = requests[0].id;
    const accepted = (await request(`/api/follow-requests/${requestId}/accept`, {
      method: 'POST',
      token: ownerToken
    })).json;
    if (accepted.status !== 'accepted') throw new Error('Follow request should be accepted');

    const stateAfterAccept = (await request(`/api/accounts/${ownerAccountId}/follow-state`, { token: followerToken })).json;
    if (stateAfterAccept.followState !== 'following') throw new Error('Follower state should be following after accept');
    if (stateAfterAccept.stats.followers !== 1) throw new Error('Target followers count should update');

    const followers = (await request(`/api/accounts/${ownerAccountId}/followers`, { token: ownerToken })).json.followers;
    if (followers.length !== 1) throw new Error('Followers list should contain accepted follower');

    const following = (await request(`/api/accounts/${follower.activeAccount.id}/following`, { token: followerToken })).json.following;
    if (following.length !== 1) throw new Error('Following list should contain target account');

    const afterFollowFeed = (await request('/api/posts/feed?scope=personal', { token: followerToken })).json;
    if (!afterFollowFeed.items.some((item) => item.id === post.id)) {
      throw new Error('Accepted follower should see followers-only post');
    }

    const stranger = await register(`page21_stranger_${suffix}@test.ru`);
    const strangerFeed = (await request('/api/posts/feed?scope=personal', { token: stranger.session.token })).json;
    if (strangerFeed.items.some((item) => item.id === post.id)) {
      throw new Error('Stranger should not see followers-only private account post');
    }

    const unfollow = (await request(`/api/accounts/${ownerAccountId}/follow`, {
      method: 'DELETE',
      token: followerToken
    })).json;
    if (unfollow.followState !== 'not_following') throw new Error('Unfollow should reset follow state');

    const afterUnfollowFeed = (await request('/api/posts/feed?scope=personal', { token: followerToken })).json;
    if (afterUnfollowFeed.items.some((item) => item.id === post.id)) {
      throw new Error('Unfollowed account should lose access to followers-only post');
    }

    const selfFollow = await request(`/api/accounts/${follower.activeAccount.id}/follow`, {
      method: 'POST',
      token: followerToken,
      allowError: true
    });
    if (selfFollow.status !== 400) throw new Error('Self-follow should be rejected');

    console.log('page21 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
