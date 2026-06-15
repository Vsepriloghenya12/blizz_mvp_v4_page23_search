const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page11-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4591';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');

const app = createApp();
const server = app.listen(4591);
const base = 'http://127.0.0.1:4591';

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
    const auth = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page11_stories_${Date.now()}@test.ru`, password: '123456' }
    })).json;
    const token = auth.session.token;

    const missingMedia = await request('/api/stories', {
      method: 'POST',
      token,
      body: { mediaType: 'image', mediaUrl: '', text: '', location: null, visibility: 'public' },
      allowError: true
    });
    if (missingMedia.status !== 400) throw new Error('Story without media should be rejected');

    const created = (await request('/api/stories', {
      method: 'POST',
      token,
      body: {
        mediaType: 'image',
        mediaUrl: 'https://example.com/story.jpg',
        text: 'Первый Близз',
        location: { title: 'Парк', address: 'Сочи', lat: null, lng: null, precision: 'exact' },
        visibility: 'public'
      }
    })).json.story;

    if (!created || created.accountId !== auth.activeAccount.id) throw new Error('Story should use activeAccountId');
    if (!created.expiresAt || Date.parse(created.expiresAt) <= Date.now()) throw new Error('Story should expire in the future');

    const second = (await request('/api/stories', {
      method: 'POST',
      token,
      body: {
        mediaType: 'video',
        mediaUrl: 'https://example.com/story-video.mp4',
        text: 'Второй Близз',
        location: null,
        visibility: 'public'
      }
    })).json.story;

    const feed = (await request('/api/stories/feed', { token })).json.groups;
    if (feed.length !== 1) throw new Error('Stories should be grouped by account');
    if (feed[0].storiesCount !== 2) throw new Error('Group should include two stories');
    if (!feed[0].hasUnseen) throw new Error('Group should start unseen');

    const accountStories = (await request(`/api/stories/${auth.activeAccount.id}`, { token })).json.items;
    if (accountStories.length !== 2 || accountStories[0].id !== created.id || accountStories[1].id !== second.id) {
      throw new Error('Account stories should return active stories');
    }

    const viewed = (await request(`/api/stories/${created.id}/view`, { method: 'POST', token })).json;
    if (!viewed.isSeenByMe || viewed.viewsCount !== 1) throw new Error('Story view should be counted once');

    const viewedAgain = (await request(`/api/stories/${created.id}/view`, { method: 'POST', token })).json;
    if (viewedAgain.viewsCount !== 1) throw new Error('Repeated story view by same account should not duplicate');

    const reply = (await request(`/api/stories/${created.id}/reply`, {
      method: 'POST',
      token,
      body: { text: 'Ответ на Близз' }
    })).json.reply;
    if (!reply || reply.storyId !== created.id || reply.senderAccountId !== auth.activeAccount.id) {
      throw new Error('Story reply should be stored from activeAccountId');
    }

    const business = (await request('/api/accounts/business', {
      method: 'POST',
      token,
      body: {
        name: 'Близз бизнес',
        username: `story_biz_${Date.now()}`.slice(0, 24),
        category: 'Развлечения',
        description: 'Проверка Близзов бизнеса',
        address: 'Сочи',
        phone: '+79990000000',
        website: 'https://example.com'
      }
    })).json;

    const businessStory = (await request('/api/stories', {
      method: 'POST',
      token: business.session.token,
      body: {
        mediaType: 'image',
        mediaUrl: 'https://example.com/business-story.jpg',
        text: 'Бизнес Близз',
        location: null,
        visibility: 'public'
      }
    })).json.story;
    if (businessStory.accountId !== business.activeAccount.id) throw new Error('Business story should use business activeAccountId');

    const state = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const businessMembership = state.accountMemberships.find((item) => item.accountId === business.activeAccount.id);
    businessMembership.role = 'messages';
    fs.writeFileSync(dataFile, JSON.stringify(state, null, 2));

    const forbidden = await request('/api/stories', {
      method: 'POST',
      token: business.session.token,
      body: {
        mediaType: 'image',
        mediaUrl: 'https://example.com/forbidden-story.jpg',
        text: 'Не должно пройти',
        location: null,
        visibility: 'public'
      },
      allowError: true
    });
    if (forbidden.status !== 403) throw new Error('Business messages role should not create stories');

    const expiredState = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const storyToExpire = expiredState.stories.find((item) => item.id === created.id);
    storyToExpire.expiresAt = new Date(Date.now() - 1000).toISOString();
    fs.writeFileSync(dataFile, JSON.stringify(expiredState, null, 2));
    const feedAfterExpiry = (await request('/api/stories/feed', { token })).json.groups;
    const remainingPersonalGroup = feedAfterExpiry.find((group) => group.account.id === auth.activeAccount.id);
    if (remainingPersonalGroup && remainingPersonalGroup.items.some((item) => item.id === created.id)) {
      throw new Error('Expired story should not be in feed');
    }

    console.log('page11 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
