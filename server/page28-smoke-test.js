const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page28-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4628';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');
const app = createApp();
const server = app.listen(4628);
const base = 'http://127.0.0.1:4628';

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
    const owner = await register(`page28_owner_${suffix}@test.ru`);
    const ownerToken = owner.session.token;
    const ownerAccountId = owner.activeAccount.id;

    const target = await register(`page28_target_${suffix}@test.ru`);
    const targetToken = target.session.token;
    const targetAccountId = target.activeAccount.id;

    const followBeforeBlock = (await request(`/api/accounts/${ownerAccountId}/follow`, {
      method: 'POST',
      token: targetToken
    })).json;
    if (followBeforeBlock.followState !== 'following') throw new Error('Target should follow public owner before block');

    const conversation = (await request('/api/messages/conversations', {
      method: 'POST',
      token: targetToken,
      body: { type: 'personal', targetAccountId: ownerAccountId }
    })).json.conversation;
    await request('/api/messages', {
      method: 'POST',
      token: targetToken,
      body: { conversationId: conversation.id, text: 'Сообщение до блокировки' }
    });

    const post = (await request('/api/posts', {
      method: 'POST',
      token: ownerToken,
      body: {
        media: [{ type: 'image', url: 'https://example.com/page28-blocks.jpg' }],
        text: 'Post protected by account block',
        visibility: 'public'
      }
    })).json.post;

    const blockResult = (await request('/api/blocks', {
      method: 'POST',
      token: ownerToken,
      body: { targetAccountId }
    })).json;
    if (!blockResult.block || blockResult.block.blockedAccountId !== targetAccountId) throw new Error('Block should be created for target account');

    const blocks = (await request('/api/blocks', { token: ownerToken })).json;
    if (blocks.count !== 1 || blocks.items[0].blockedAccount.id !== targetAccountId) throw new Error('Blocked account should appear in list');

    const settings = (await request('/api/settings/me', { token: ownerToken })).json;
    if (settings.settings.privacy.blockedAccountsCount !== 1) throw new Error('Settings should show blocked accounts count');

    const followState = (await request(`/api/accounts/${ownerAccountId}/follow-state`, { token: targetToken })).json;
    if (followState.followState !== 'blocked') throw new Error('Follow state should become blocked');

    const followDenied = await request(`/api/accounts/${ownerAccountId}/follow`, {
      method: 'POST',
      token: targetToken,
      allowError: true
    });
    if (followDenied.status !== 403) throw new Error('Blocked target should not follow blocker');

    const sendDenied = await request('/api/messages', {
      method: 'POST',
      token: targetToken,
      body: { conversationId: conversation.id, text: 'Сообщение после блокировки' },
      allowError: true
    });
    if (sendDenied.status !== 403) throw new Error('Blocked target should not send a message');

    const commentDenied = await request(`/api/posts/${post.id}/comments`, {
      method: 'POST',
      token: targetToken,
      body: { text: 'Комментарий после блокировки' },
      allowError: true
    });
    if (commentDenied.status !== 403) throw new Error('Blocked target should not comment blocker post');

    const groupDenied = await request('/api/messages/groups', {
      method: 'POST',
      token: targetToken,
      body: {
        title: 'Blocked invite group',
        participantAccountIds: [ownerAccountId],
        clientRequestId: `page28_group_${suffix}`
      },
      allowError: true
    });
    if (groupDenied.status !== 403) throw new Error('Blocked target should not invite blocker to group');

    const publicProfile = (await request(`/api/accounts/${ownerAccountId}/public-profile`, { token: targetToken })).json;
    if (publicProfile.canViewContent !== false || publicProfile.followState !== 'blocked') throw new Error('Blocked account should not view blocked profile content');

    await request(`/api/blocks/${targetAccountId}`, { method: 'DELETE', token: ownerToken });
    const blocksAfterUnblock = (await request('/api/blocks', { token: ownerToken })).json;
    if (blocksAfterUnblock.count !== 0) throw new Error('Block list should be empty after unblock');

    const followAfterUnblock = (await request(`/api/accounts/${ownerAccountId}/follow`, {
      method: 'POST',
      token: targetToken
    })).json;
    if (followAfterUnblock.followState !== 'following') throw new Error('Target should follow again after unblock');

    console.log('page28 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
