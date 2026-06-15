const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page17-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4597';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');

const app = createApp();
const server = app.listen(4597);
const base = 'http://127.0.0.1:4597';

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
    const first = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page17_first_${suffix}@test.ru`, password: '123456' }
    })).json;
    const second = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page17_second_${suffix}@test.ru`, password: '123456' }
    })).json;

    const firstToken = first.session.token;
    const secondToken = second.session.token;
    const firstAccountId = first.activeAccount.id;
    const secondAccountId = second.activeAccount.id;

    const catalog = (await request('/api/games/catalog', { token: firstToken })).json.games;
    const types = catalog.map((game) => game.type);
    if (!types.includes('card_guess') || !types.includes('football') || !types.includes('cups')) {
      throw new Error('Catalog should include only agreed game directions');
    }
    if (types.includes('quiz') || types.includes('place_guess') || types.includes('quick_choice')) {
      throw new Error('Catalog should not include Quiz, Guess Place or Quick Choice');
    }
    if (catalog.find((game) => game.type === 'card_guess').status !== 'ready') {
      throw new Error('Card guess should be ready');
    }
    if (catalog.find((game) => game.type === 'football').status === 'ready' || catalog.find((game) => game.type === 'cups').status === 'ready') {
      throw new Error('Football and Cups should not be marked ready in page 17');
    }

    const conversation = (await request('/api/messages/conversations', {
      method: 'POST',
      token: firstToken,
      body: { type: 'personal', targetAccountId: secondAccountId }
    })).json.conversation;

    const quizForbidden = await request('/api/games/sessions', {
      method: 'POST',
      token: firstToken,
      body: { conversationId: conversation.id, gameType: 'quiz' },
      allowError: true
    });
    if (quizForbidden.status !== 400) throw new Error('Quiz should be rejected');

    const footballForbidden = await request('/api/games/sessions', {
      method: 'POST',
      token: firstToken,
      body: { conversationId: conversation.id, gameType: 'football' },
      allowError: true
    });
    if (footballForbidden.status !== 400) throw new Error('Football should wait for a separate module');

    const created = (await request('/api/games/sessions', {
      method: 'POST',
      token: firstToken,
      body: { conversationId: conversation.id, gameType: 'card_guess' }
    })).json;
    if (!created.session || created.session.type !== 'card_guess') throw new Error('Card guess game should be created');
    if (created.session.winningIndex !== null) throw new Error('Winning card should be hidden before answer');

    const chatWithInvite = (await request(`/api/messages/conversations/${conversation.id}`, { token: firstToken })).json;
    const inviteMessage = chatWithInvite.messages.find((message) => message.type === 'game_invite');
    if (!inviteMessage || !inviteMessage.gameSession || inviteMessage.gameSession.id !== created.session.id) {
      throw new Error('Game invite message should appear in chat');
    }

    const answered = (await request(`/api/games/sessions/${created.session.id}/answer`, {
      method: 'POST',
      token: firstToken,
      body: { answerIndex: 1 }
    })).json.session;
    if (answered.selectedIndex !== 1 || answered.winningIndex === null || typeof answered.isCorrect !== 'boolean') {
      throw new Error('Answer should reveal selected and winning card');
    }

    const duplicateAnswer = (await request(`/api/games/sessions/${created.session.id}/answer`, {
      method: 'POST',
      token: firstToken,
      body: { answerIndex: 2 }
    })).json;
    if (!duplicateAnswer.reused || duplicateAnswer.session.selectedIndex !== 1) {
      throw new Error('Repeated answer by same account should be idempotent');
    }

    const finished = (await request(`/api/games/sessions/${created.session.id}/finish`, {
      method: 'POST',
      token: firstToken
    })).json.session;
    if (finished.status !== 'finished' || !finished.resultMessageId) {
      throw new Error('Finish should create a result message');
    }

    const chatWithResult = (await request(`/api/messages/conversations/${conversation.id}`, { token: secondToken })).json;
    if (!chatWithResult.messages.some((message) => message.type === 'game_result' && message.gameSession && message.gameSession.status === 'finished')) {
      throw new Error('Game result should be visible to the other participant');
    }

    const group = (await request('/api/messages/groups', {
      method: 'POST',
      token: firstToken,
      body: { title: 'Играем', participantAccountIds: [secondAccountId], clientRequestId: `game_group_${suffix}` }
    })).json.conversation;
    const groupGame = (await request('/api/games/sessions', {
      method: 'POST',
      token: firstToken,
      body: { conversationId: group.id, gameType: 'card_guess' }
    })).json.session;
    if (groupGame.conversationId !== group.id) throw new Error('Games should work in group chat');

    const businessAuth = (await request('/api/accounts/business', {
      method: 'POST',
      token: firstToken,
      body: {
        name: `Кафе ${suffix}`,
        username: `cafe_${suffix}`.toLowerCase(),
        category: 'Еда и напитки',
        description: 'Тестовый бизнес',
        address: 'Сочи, Морская 1',
        phone: '+79990000000',
        website: 'https://example.com'
      }
    })).json;
    const businessAccountId = businessAuth.activeAccount.id;

    const businessChat = (await request('/api/messages/conversations', {
      method: 'POST',
      token: secondToken,
      body: { type: 'business', businessAccountId }
    })).json.conversation;
    const businessGame = await request('/api/games/sessions', {
      method: 'POST',
      token: secondToken,
      body: { conversationId: businessChat.id, gameType: 'card_guess' },
      allowError: true
    });
    if (businessGame.status !== 400) throw new Error('Games should be forbidden in business chat');

    console.log('page17 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
