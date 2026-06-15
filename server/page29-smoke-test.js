const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page29-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4629';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');
const app = createApp();
const server = app.listen(4629);
const base = 'http://127.0.0.1:4629';

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

function hasType(list, type) {
  return (list.items || []).some((item) => item.type === type);
}

(async () => {
  try {
    const suffix = Date.now().toString().slice(-8);
    const owner = await register(`page29_owner_${suffix}@test.ru`);
    const ownerToken = owner.session.token;
    const ownerAccountId = owner.activeAccount.id;

    const target = await register(`page29_target_${suffix}@test.ru`);
    const targetToken = target.session.token;
    const targetAccountId = target.activeAccount.id;

    const conversation = (await request('/api/messages/conversations', {
      method: 'POST',
      token: targetToken,
      body: { type: 'personal', targetAccountId: ownerAccountId }
    })).json.conversation;
    await request('/api/messages', {
      method: 'POST',
      token: targetToken,
      body: { conversationId: conversation.id, text: 'Привет из уведомлений' }
    });

    let ownerNotifications = (await request('/api/notifications', { token: ownerToken })).json;
    if (!hasType(ownerNotifications, 'direct_message')) throw new Error('Owner should receive direct_message notification');

    const post = (await request('/api/posts', {
      method: 'POST',
      token: ownerToken,
      body: {
        media: [{ type: 'image', url: 'https://example.com/page29-notifications.jpg' }],
        text: 'Post for notifications',
        visibility: 'public'
      }
    })).json.post;

    await request(`/api/posts/${post.id}/comments`, {
      method: 'POST',
      token: targetToken,
      body: { text: 'Комментарий для уведомления' }
    });
    ownerNotifications = (await request('/api/notifications?filter=activity', { token: ownerToken })).json;
    if (!hasType(ownerNotifications, 'comment')) throw new Error('Owner should receive comment notification');

    await request('/api/notifications/settings', {
      method: 'PATCH',
      token: ownerToken,
      body: { comments: false }
    });
    await request(`/api/posts/${post.id}/comments`, {
      method: 'POST',
      token: targetToken,
      body: { text: 'Этот комментарий не должен создать уведомление' }
    });
    const commentNotifications = (await request('/api/notifications?filter=activity', { token: ownerToken })).json.items.filter((item) => item.type === 'comment');
    if (commentNotifications.length !== 1) throw new Error('Disabled comments category should prevent new comment notifications');

    await request('/api/notifications/settings', {
      method: 'PATCH',
      token: ownerToken,
      body: { comments: true }
    });
    await request(`/api/posts/${post.id}/like`, { method: 'POST', token: targetToken });
    ownerNotifications = (await request('/api/notifications?filter=activity', { token: ownerToken })).json;
    if (!hasType(ownerNotifications, 'post_like')) throw new Error('Owner should receive grouped post_like notification');

    const story = (await request('/api/stories', {
      method: 'POST',
      token: ownerToken,
      body: {
        mediaType: 'image',
        mediaUrl: 'https://example.com/page29-story.jpg',
        text: 'Близз для уведомлений',
        visibility: 'public'
      }
    })).json.story;
    await request(`/api/stories/${story.id}/reply`, {
      method: 'POST',
      token: targetToken,
      body: { text: 'Ответ на Близз' }
    });
    ownerNotifications = (await request('/api/notifications?filter=messages', { token: ownerToken })).json;
    if (!hasType(ownerNotifications, 'story_reply')) throw new Error('Owner should receive story_reply notification');

    const privateOwner = await register(`page29_private_${suffix}@test.ru`);
    const privateToken = privateOwner.session.token;
    const privateAccountId = privateOwner.activeAccount.id;
    await request('/api/settings/me', { method: 'PATCH', token: privateToken, body: { privacy: { isPrivateAccount: true } } });
    await request(`/api/accounts/${privateAccountId}/follow`, { method: 'POST', token: targetToken });
    let privateNotifications = (await request('/api/notifications', { token: privateToken })).json;
    if (!hasType(privateNotifications, 'follow_request')) throw new Error('Private owner should receive follow_request notification');
    const requests = (await request('/api/follow-requests', { token: privateToken })).json.requests;
    await request(`/api/follow-requests/${requests[0].id}/accept`, { method: 'POST', token: privateToken });
    const targetNotifications = (await request('/api/notifications', { token: targetToken })).json;
    if (!hasType(targetNotifications, 'follow_request_accepted')) throw new Error('Follower should receive accepted request notification');

    const firstUnread = ownerNotifications.items.find((item) => item.isRead === false);
    if (!firstUnread) throw new Error('There should be an unread notification');
    const readOne = (await request(`/api/notifications/${firstUnread.id}/read`, { method: 'POST', token: ownerToken })).json;
    if (readOne.notification.isRead !== true) throw new Error('Notification should be marked read');
    const readAll = (await request('/api/notifications/read', { method: 'POST', token: ownerToken })).json;
    if (readAll.unreadCount !== 0) throw new Error('All notifications should be read');

    await request('/api/notifications/push-tokens', {
      method: 'POST',
      token: ownerToken,
      body: { platform: 'web', token: 'test-push-token', deviceId: 'page29-device' }
    });
    const pushDelete = (await request('/api/notifications/push-tokens/page29-device', { method: 'DELETE', token: ownerToken })).json;
    if (pushDelete.isActive !== false) throw new Error('Push token should be disabled');

    console.log('page29 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
