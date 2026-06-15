const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page09-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4589';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');

const app = createApp();
const server = app.listen(4589);
const base = 'http://127.0.0.1:4589';

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
      body: { login: `page09_sender_${Date.now()}@test.ru`, password: '123456' }
    })).json;
    const token = auth.session.token;
    const personalAccountId = auth.activeAccount.id;

    const post = (await request('/api/posts', {
      method: 'POST',
      token,
      body: {
        media: [{ type: 'image', url: 'https://example.com/share-photo.jpg' }],
        text: 'Публичный пост для проверки Share',
        location: { title: 'Морпорт', address: 'Сочи', lat: null, lng: null, precision: 'exact' },
        visibility: 'public'
      }
    })).json.post;

    let recipients = (await request('/api/share/recipients', { token })).json.recipients;
    if (recipients.length !== 0) throw new Error('Single-account user should have no own-account recipients');

    const business = (await request('/api/accounts/business', {
      method: 'POST',
      token,
      body: {
        name: 'Кофейня Share',
        username: `share_coffee_${Date.now()}`.slice(0, 24),
        category: 'Еда и напитки',
        description: 'Проверка шаринга',
        address: 'Сочи',
        phone: '+79990000000',
        website: 'https://example.com'
      }
    })).json;
    const businessToken = business.session.token;
    const businessAccountId = business.activeAccount.id;

    recipients = (await request('/api/share/recipients', { token: businessToken })).json.recipients;
    if (!recipients.some((item) => item.id === personalAccountId)) {
      throw new Error('Business active account should see personal account as share recipient');
    }

    const shared = (await request('/api/share/post', {
      method: 'POST',
      token: businessToken,
      body: { postId: post.id, targetAccountId: personalAccountId }
    })).json.sharedContent;
    if (!shared || shared.type !== 'post') throw new Error('Shared content was not created');
    if (shared.senderAccountId !== businessAccountId) throw new Error('Share sender should be activeAccountId');
    if (shared.targetAccountId !== personalAccountId) throw new Error('Share target account mismatch');

    const privatePost = (await request('/api/posts', {
      method: 'POST',
      token: businessToken,
      body: {
        media: [{ type: 'image', url: 'https://example.com/private-share-photo.jpg' }],
        text: 'Закрытый пост для проверки запрета Share',
        location: null,
        visibility: 'followers'
      }
    })).json.post;

    const forbiddenShare = await request('/api/share/post', {
      method: 'POST',
      token: businessToken,
      body: { postId: privatePost.id, targetAccountId: personalAccountId },
      allowError: true
    });
    if (forbiddenShare.status !== 403) throw new Error('Non-public post should not be shared to another account yet');

    const missingTarget = await request('/api/share/post', {
      method: 'POST',
      token: businessToken,
      body: { postId: post.id },
      allowError: true
    });
    if (missingTarget.status !== 400) throw new Error('Missing target account should be rejected');

    const state = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    if (!Array.isArray(state.sharedContents) || state.sharedContents.length !== 1) {
      throw new Error('sharedContents storage should contain exactly one sent item');
    }

    console.log('page09 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
