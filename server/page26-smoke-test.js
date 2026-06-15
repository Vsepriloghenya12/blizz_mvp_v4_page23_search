const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page26-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4626';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');
const app = createApp();
const server = app.listen(4626);
const base = 'http://127.0.0.1:4626';

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
    const owner = await register(`page26_owner_${suffix}@test.ru`);
    const viewer = await register(`page26_viewer_${suffix}@test.ru`);

    const created = (await request('/api/stories', {
      method: 'POST',
      token: owner.session.token,
      body: {
        mediaType: 'image',
        mediaUrl: 'https://example.com/page26-story.jpg',
        text: 'Близз для отдельного экрана',
        visibility: 'public',
        location: { title: 'Площадь Близза', address: 'Сочи', precision: 'area' }
      }
    })).json.story;

    const detail = (await request(`/api/stories/detail/${created.id}`, { token: viewer.session.token })).json;
    if (!detail.story || detail.story.id !== created.id) throw new Error('Story detail should return requested story');
    if (detail.story.text !== 'Близз для отдельного экрана') throw new Error('Story detail should return text');
    if (!detail.story.author || detail.story.author.id !== owner.activeAccount.id) throw new Error('Story detail should include author');
    if (detail.story.viewsCount !== 0 || detail.story.isSeenByMe !== false) throw new Error('Story detail should include viewer state');

    await request(`/api/stories/${created.id}/view`, { method: 'POST', token: viewer.session.token });
    const viewed = (await request(`/api/stories/detail/${created.id}`, { token: viewer.session.token })).json;
    if (viewed.story.viewsCount !== 1 || viewed.story.isSeenByMe !== true) throw new Error('Story detail should reflect views');

    await request('/api/settings/me', {
      method: 'PATCH',
      token: owner.session.token,
      body: { privacy: { isPrivateAccount: true } }
    });
    const privateStory = (await request('/api/stories', {
      method: 'POST',
      token: owner.session.token,
      body: {
        mediaType: 'video',
        mediaUrl: 'https://example.com/page26-private.mp4',
        text: 'Закрытый Близз для отдельного экрана',
        visibility: 'followers'
      }
    })).json.story;

    const denied = await request(`/api/stories/detail/${privateStory.id}`, { token: viewer.session.token, allowError: true });
    if (denied.status !== 403) throw new Error('Story detail should deny private followers-only content');

    console.log('page26 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
