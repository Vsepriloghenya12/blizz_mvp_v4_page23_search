const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page15-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4595';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');

const app = createApp();
const server = app.listen(4595);
const base = 'http://127.0.0.1:4595';

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
      body: { login: `page15_${suffix}@test.ru`, password: '123456' }
    })).json;
    const token = auth.session.token;
    const personalAccountId = auth.activeAccount.id;

    const post = (await request('/api/posts', {
      method: 'POST',
      token,
      body: {
        media: [{ type: 'image', url: 'https://example.com/messages-post.jpg' }],
        text: 'Пост для отправки в сообщения',
        location: null,
        visibility: 'public'
      }
    })).json.post;

    const business = (await request('/api/accounts/business', {
      method: 'POST',
      token,
      body: {
        name: 'Бизнес сообщения',
        username: `msgbiz_${suffix}`.slice(0, 24),
        category: 'Еда и напитки',
        description: 'Проверка сообщений',
        address: 'Сочи, ул. Сообщений, 1',
        phone: '+79990000000',
        website: 'https://example.com'
      }
    })).json;
    const businessAccountId = business.activeAccount.id;

    await request('/api/accounts/switch', { method: 'POST', token, body: { accountId: personalAccountId } });
    const recipients = (await request('/api/share/recipients', { token })).json.recipients;
    if (!recipients.some((item) => item.id === businessAccountId)) throw new Error('Share recipients should include own business account');

    const share = (await request('/api/share/post', {
      method: 'POST',
      token,
      body: { postId: post.id, targetAccountId: businessAccountId }
    })).json;
    if (!share.conversationId || !share.messageId) throw new Error('Share should create conversation and message');

    const personalConversations = (await request('/api/messages/conversations', { token })).json.conversations;
    if (!personalConversations.some((item) => item.id === share.conversationId && item.type === 'business')) {
      throw new Error('Personal account should see business conversation');
    }

    const chat = (await request(`/api/messages/conversations/${share.conversationId}`, { token })).json;
    if (!chat.messages.some((item) => item.type === 'shared_content' && item.sharedContent && item.sharedContent.contentId === post.id)) {
      throw new Error('Chat should include shared post content');
    }

    await request('/api/accounts/switch', { method: 'POST', token, body: { accountId: businessAccountId } });
    const businessConversations = (await request('/api/messages/conversations?filter=business', { token })).json.conversations;
    if (!businessConversations.some((item) => item.id === share.conversationId)) throw new Error('Business should see business conversation');

    const reply = (await request('/api/messages', {
      method: 'POST',
      token,
      body: { conversationId: share.conversationId, text: 'Здравствуйте! Ответ бизнеса.' }
    })).json.message;
    if (reply.senderAccountId !== businessAccountId || reply.actorUserId !== auth.user.id) {
      throw new Error('Business message should be sent from businessAccountId and keep actorUserId');
    }

    const offer = (await request('/api/offers', {
      method: 'POST',
      token,
      body: {
        type: 'promo',
        title: 'Предложение для чата',
        coverUrl: 'https://example.com/messages-offer.jpg',
        description: 'Проверка кнопки Написать',
        priceOrCondition: '-10%',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        address: 'Сочи, ул. Сообщений, 1',
        location: { title: 'Бизнес сообщения', address: 'Сочи, ул. Сообщений, 1', lat: null, lng: null, precision: 'exact' }
      }
    })).json.offer;
    if (!offer || offer.businessAccountId !== businessAccountId) throw new Error('Offer should belong to business');

    await request('/api/accounts/switch', { method: 'POST', token, body: { accountId: personalAccountId } });
    const openedBusinessChat = (await request('/api/messages/conversations', {
      method: 'POST',
      token,
      body: { type: 'business', businessAccountId }
    })).json.conversation;
    if (openedBusinessChat.id !== share.conversationId) throw new Error('Offer write should reuse existing business conversation');

    await request('/api/accounts/switch', { method: 'POST', token, body: { accountId: businessAccountId } });
    const story = (await request('/api/stories', {
      method: 'POST',
      token,
      body: {
        mediaType: 'image',
        mediaUrl: 'https://example.com/story-message.jpg',
        text: 'Близз для ответа',
        location: null,
        visibility: 'public'
      }
    })).json.story;

    await request('/api/accounts/switch', { method: 'POST', token, body: { accountId: personalAccountId } });
    const storyReply = (await request(`/api/stories/${story.id}/reply`, {
      method: 'POST',
      token,
      body: { text: 'Ответ на Близз в чат' }
    })).json.reply;
    if (!storyReply.conversationId || !storyReply.messageId) throw new Error('Story reply should create message');

    const chatAfterStoryReply = (await request(`/api/messages/conversations/${storyReply.conversationId}`, { token })).json;
    if (!chatAfterStoryReply.messages.some((item) => item.type === 'story_reply' && item.storyReply && item.storyReply.id === storyReply.id)) {
      throw new Error('Chat should include story reply card');
    }

    const outsider = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page15_outsider_${suffix}@test.ru`, password: '123456' }
    })).json;
    const forbidden = await request(`/api/messages/conversations/${share.conversationId}`, {
      token: outsider.session.token,
      allowError: true
    });
    if (forbidden.status !== 403) throw new Error('Outsider should not access conversation');

    const selfChat = await request('/api/messages/conversations', {
      method: 'POST',
      token,
      body: { type: 'business', businessAccountId: personalAccountId },
      allowError: true
    });
    if (selfChat.status !== 404 && selfChat.status !== 400) throw new Error('Invalid business chat should be rejected');

    console.log('page15 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
