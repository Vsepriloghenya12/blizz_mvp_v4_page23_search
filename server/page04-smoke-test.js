const fs = require('fs');
const path = require('path');
const { createApp } = require('./src/app');

const dataFile = path.join(__dirname, 'data', 'db.json');
fs.writeFileSync(dataFile, JSON.stringify({
  meta: { name: 'Blizz MVP v4 smoke', version: 1 },
  users: [],
  accounts: [],
  accountMemberships: [],
  businessProfiles: [],
  posts: [],
  videos: [],
  drafts: [],
  savedItems: [],
  follows: [],
  sessions: []
}, null, 2));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  return { response, json };
}

(async () => {
  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const register = await request(baseUrl, '/api/auth/register', {
      method: 'POST',
      body: { login: `business-${Date.now()}@test.ru`, password: 'password123' }
    });
    assert(register.response.status === 201, 'registration failed');
    const token = register.json.session.token;
    const personalId = register.json.activeAccount.id;
    assert(register.json.activeAccount.type === 'personal', 'registration must create personal account');
    assert(register.json.accounts.length === 1, 'registration must return one account');

    const createBusiness = await request(baseUrl, '/api/accounts/business', {
      method: 'POST',
      token,
      body: {
        name: 'Кофейня на Морской',
        username: `coffee_${Date.now()}`,
        category: 'Еда и напитки',
        description: 'Кофе, завтраки и десерты рядом с морем',
        address: 'Сочи, ул. Морская, 10',
        phone: '+79990000000',
        website: 'https://example.ru'
      }
    });
    assert(createBusiness.response.status === 201, 'business creation failed');
    assert(createBusiness.json.activeAccount.type === 'business', 'active account must become business');
    assert(createBusiness.json.activeAccount.role === 'owner', 'business role must be owner');
    assert(createBusiness.json.activeAccount.businessProfile.category === 'Еда и напитки', 'business profile category missing');
    assert(createBusiness.json.accounts.length === 2, 'user must have personal + business accounts');

    const profile = await request(baseUrl, '/api/profile/me', { token });
    assert(profile.response.status === 200, 'business profile fetch failed');
    assert(profile.json.profile.type === 'business', 'profile must be business after creation');
    assert(profile.json.profile.businessProfile.address === 'Сочи, ул. Морская, 10', 'business profile address missing');

    const switchToPersonal = await request(baseUrl, '/api/accounts/switch', {
      method: 'POST',
      token,
      body: { accountId: personalId }
    });
    assert(switchToPersonal.response.status === 200, 'switch to personal failed');
    assert(switchToPersonal.json.activeAccount.id === personalId, 'active account must be personal again');
    assert(switchToPersonal.json.activeAccount.type === 'personal', 'switched account type must be personal');

    const duplicate = await request(baseUrl, '/api/accounts/business', {
      method: 'POST',
      token,
      body: { name: 'Дубль', username: switchToPersonal.json.accounts[1].username, category: 'Услуги' }
    });
    assert(duplicate.response.status === 409, 'duplicate business username must be rejected');

    console.log('page04 business account smoke test passed');
  } finally {
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
