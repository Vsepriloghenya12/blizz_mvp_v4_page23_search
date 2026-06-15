const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'page19-smoke-db.json');
process.env.DATA_FILE = dataFile;
process.env.PORT = '4599';

if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);

const { createApp } = require('./src/app');

const app = createApp();
const server = app.listen(4599);
const base = 'http://127.0.0.1:4599';

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
      body: { login: `page19_first_${suffix}@test.ru`, password: '123456' }
    })).json;
    const second = (await request('/api/auth/register', {
      method: 'POST',
      body: { login: `page19_second_${suffix}@test.ru`, password: '123456' }
    })).json;

    const firstToken = first.session.token;
    const secondToken = second.session.token;
    const secondAccountId = second.activeAccount.id;

    const catalog = (await request('/api/games/catalog', { token: firstToken })).json.games;
    const types = catalog.map((game) => game.type);
    if (!types.includes('card_guess') || !types.includes('football') || !types.includes('shells')) {
      throw new Error('Catalog should include card_guess, football and shells');
    }
    if (types.includes('quiz') || types.includes('place_guess') || types.includes('quick_choice')) {
      throw new Error('Catalog should not include Quiz, Guess Place or Quick Choice');
    }
    if (catalog.find((game) => game.type === 'shells').status !== 'ready') {
      throw new Error('Shells should be ready in page 19');
    }
    if (catalog.find((game) => game.type === 'football').status === 'ready') {
      throw new Error('Football should not be marked ready yet');
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
      body: { conversationId: conversation.id, gameType: 'shells' }
    })).json;
    if (!created.session || created.session.type !== 'shells') throw new Error('Shells game should be created');
    if (created.session.roundsTotal !== 5 || created.session.correctAnswers !== 0) {
      throw new Error('Shells game should start with 5 rounds and zero correct answers');
    }

    const chatWithInvite = (await request(`/api/messages/conversations/${conversation.id}`, { token: firstToken })).json;
    const inviteMessage = chatWithInvite.messages.find((message) => message.type === 'game_invite');
    if (!inviteMessage || !inviteMessage.gameSession || inviteMessage.gameSession.type !== 'shells') {
      throw new Error('Shells invite message should appear in chat');
    }

    let current = created.session;
    for (let i = 0; i < 5; i += 1) {
      current = (await request(`/api/games/sessions/${created.session.id}/answer`, {
        method: 'POST',
        token: firstToken,
        body: { selectedCup: (i % 3) + 1 }
      })).json.session;
      if (!current.ballPosition || !current.selectedCup || !['correct', 'miss'].includes(current.lastRoundResult)) {
        throw new Error('Shells answer should reveal selected cup and ball position');
      }
    }
    if (!current.shellsFinished || current.shellsRounds.length !== 5) {
      throw new Error('Shells should be finished after 5 rounds');
    }

    const duplicateAnswer = (await request(`/api/games/sessions/${created.session.id}/answer`, {
      method: 'POST',
      token: firstToken,
      body: { selectedCup: 2 }
    })).json;
    if (!duplicateAnswer.reused || duplicateAnswer.session.shellsRounds.length !== 5) {
      throw new Error('Additional shells answers after 5 rounds should be idempotent');
    }

    const finished = (await request(`/api/games/sessions/${created.session.id}/finish`, {
      method: 'POST',
      token: firstToken
    })).json.session;
    if (finished.status !== 'finished' || !finished.resultMessageId) {
      throw new Error('Finish should create a shells result message');
    }

    const chatWithResult = (await request(`/api/messages/conversations/${conversation.id}`, { token: secondToken })).json;
    if (!chatWithResult.messages.some((message) => message.type === 'game_result' && message.gameSession && message.gameSession.type === 'shells' && message.gameSession.status === 'finished')) {
      throw new Error('Shells game result should be visible to the other participant');
    }

    const group = (await request('/api/messages/groups', {
      method: 'POST',
      token: firstToken,
      body: { title: 'Напёрстки', participantAccountIds: [secondAccountId], clientRequestId: `shells_group_${suffix}` }
    })).json.conversation;
    const groupGame = (await request('/api/games/sessions', {
      method: 'POST',
      token: firstToken,
      body: { conversationId: group.id, gameType: 'shells' }
    })).json.session;
    if (groupGame.conversationId !== group.id) throw new Error('Shells should work in group chat');

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
      body: { conversationId: businessChat.id, gameType: 'shells' },
      allowError: true
    });
    if (businessGame.status !== 400) throw new Error('Shells should be forbidden in business chat');

    console.log('page19 smoke test ok');
  } finally {
    server.close();
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile);
  }
})().catch((error) => {
  console.error(error);
  server.close(() => process.exit(1));
});
