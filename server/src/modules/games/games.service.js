const { db } = require('../../shared/storage/jsonDatabase');
const { HttpError } = require('../../shared/http/httpError');
const { createId } = require('../../shared/security/password');
const { isBlockedBetween } = require('../blocks/blocks.service');
const { createNotification } = require('../notifications/notifications.service');

const GAME_CATALOG = [
  {
    type: 'card_guess',
    title: 'Угадай карту',
    description: 'Выбери одну из трёх карт и проверь результат. Без денег, ставок и случайных наград.',
    status: 'ready'
  },
  {
    type: 'football',
    title: 'Футбол',
    description: 'Пенальти с выбором направления. Будет реализовано отдельным модулем.',
    status: 'planned'
  },
  {
    type: 'shells',
    title: 'Напёрстки',
    description: 'Игра на внимание: выбери стаканчик, под которым спрятан шарик.',
    status: 'ready'
  }
];

const READY_GAME_TYPES = ['card_guess', 'shells'];
const SHELLS_ROUNDS_TOTAL = 5;

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function ensureArrays(state) {
  state.gameSessions = state.gameSessions || [];
  state.gameAnswers = state.gameAnswers || [];
  state.messages = state.messages || [];
  state.conversations = state.conversations || [];
}

function getActiveAccountContext(state, userId, activeAccountId) {
  const membership = state.accountMemberships.find((item) => {
    return item.userId === userId && item.accountId === activeAccountId && item.status === 'active';
  });

  if (!membership) {
    throw new HttpError(403, 'ACCOUNT_ACCESS_DENIED', 'Нет доступа к активному аккаунту');
  }

  const account = state.accounts.find((item) => item.id === activeAccountId && item.status !== 'archived');
  if (!account) {
    throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Аккаунт не найден');
  }

  return { account, membership };
}

function accountById(state, accountId) {
  return state.accounts.find((account) => account.id === accountId && account.status !== 'archived') || null;
}

function businessProfileByAccountId(state, accountId) {
  return (state.businessProfiles || []).find((profile) => profile.accountId === accountId) || null;
}

function publicAccount(state, accountId) {
  const account = accountById(state, accountId);
  if (!account) return null;
  const businessProfile = account.type === 'business' ? businessProfileByAccountId(state, account.id) : null;

  return {
    id: account.id,
    type: account.type,
    name: account.name,
    username: account.username,
    avatar: account.avatar || null,
    businessCategory: businessProfile ? businessProfile.category : null
  };
}

function normalizeParticipantIds(ids) {
  return Array.from(new Set(ids.filter(Boolean))).sort();
}

function publicConversation(state, conversation, activeAccountId) {
  const isGroup = conversation.type === 'group';
  const counterpartId = !isGroup
    ? (conversation.type === 'business'
        ? (activeAccountId === conversation.businessAccountId ? conversation.customerAccountId : conversation.businessAccountId)
        : (conversation.participantAccountIds || []).find((id) => id !== activeAccountId))
    : null;
  const counterpart = counterpartId ? publicAccount(state, counterpartId) : null;

  return {
    id: conversation.id,
    type: conversation.type,
    participantAccountIds: conversation.participantAccountIds || [],
    customerAccountId: conversation.customerAccountId || null,
    businessAccountId: conversation.businessAccountId || null,
    title: isGroup ? (conversation.title || 'Группа') : (counterpart?.name || 'Диалог'),
    counterpart,
    membersCount: isGroup ? (conversation.participantAccountIds || []).length : null,
    createdByAccountId: conversation.createdByAccountId || null,
    lastMessagePreview: 'Игра',
    lastMessageAt: conversation.lastMessageAt || conversation.createdAt,
    unreadCount: 0,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt
  };
}

function assertConversationAccess(conversation, activeAccountId) {
  if (!conversation || conversation.status === 'archived') {
    throw new HttpError(404, 'CONVERSATION_NOT_FOUND', 'Диалог не найден');
  }

  if (!Array.isArray(conversation.participantAccountIds) || !conversation.participantAccountIds.includes(activeAccountId)) {
    throw new HttpError(403, 'CONVERSATION_ACCESS_DENIED', 'Нет доступа к диалогу');
  }
}

function assertGameParticipantsCanInteract(state, conversation, activeAccountId) {
  const blockedParticipantId = (conversation.participantAccountIds || []).find((accountId) => {
    return accountId !== activeAccountId && isBlockedBetween(state, activeAccountId, accountId);
  });
  if (blockedParticipantId) {
    throw new HttpError(403, 'ACCOUNT_BLOCKED', 'Нельзя запускать игру с заблокированным аккаунтом');
  }
}

function assertGameTypeAllowed(gameType) {
  if (!GAME_CATALOG.some((game) => game.type === gameType)) {
    throw new HttpError(400, 'GAME_TYPE_INVALID', 'Игра не поддерживается');
  }

  if (!READY_GAME_TYPES.includes(gameType)) {
    throw new HttpError(400, 'GAME_NOT_READY', 'Эта игра будет реализована отдельным модулем');
  }
}

function gameTitle(gameType) {
  const item = GAME_CATALOG.find((game) => game.type === gameType);
  return item ? item.title : 'Игра';
}

function makeCardGuessState() {
  const cards = [
    { index: 0, label: 'Карта 1', icon: '♠' },
    { index: 1, label: 'Карта 2', icon: '◆' },
    { index: 2, label: 'Карта 3', icon: '♣' }
  ];
  const winningIndex = Math.floor(Math.random() * cards.length);
  return { cards, winningIndex };
}

function makeShellsState() {
  return {
    cups: [
      { index: 1, label: 'Стаканчик 1', icon: '◡' },
      { index: 2, label: 'Стаканчик 2', icon: '◡' },
      { index: 3, label: 'Стаканчик 3', icon: '◡' }
    ],
    roundsTotal: SHELLS_ROUNDS_TOTAL
  };
}

function makeGameState(gameType) {
  if (gameType === 'shells') return makeShellsState();
  return makeCardGuessState();
}

function makeRules(gameType) {
  if (gameType === 'shells') {
    return {
      roundsTotal: SHELLS_ROUNDS_TOTAL,
      cupsCount: 3,
      baseScore: 100,
      moneyForbidden: true,
      betsForbidden: true
    };
  }

  return {
    cardsCount: 3,
    baseScore: 100,
    moneyForbidden: true,
    betsForbidden: true
  };
}

function publicGameSession(state, session, activeAccountId) {
  const answer = (state.gameAnswers || []).find((item) => item.sessionId === session.id && item.accountId === activeAccountId) || null;
  const creator = publicAccount(state, session.createdByAccountId);
  const catalogItem = GAME_CATALOG.find((game) => game.type === session.type) || null;
  const showCardResult = session.type === 'card_guess' && (session.status === 'finished' || Boolean(answer));
  const shellsRounds = session.type === 'shells' && answer && Array.isArray(answer.rounds) ? answer.rounds : [];
  const lastShellRound = shellsRounds.length > 0 ? shellsRounds[shellsRounds.length - 1] : null;
  const roundsTotal = session.type === 'shells' ? (session.state.roundsTotal || SHELLS_ROUNDS_TOTAL) : null;
  const shellsFinished = session.type === 'shells' && shellsRounds.length >= (roundsTotal || SHELLS_ROUNDS_TOTAL);

  return {
    id: session.id,
    conversationId: session.conversationId,
    type: session.type,
    title: catalogItem ? catalogItem.title : 'Игра',
    status: session.status,
    createdByAccountId: session.createdByAccountId,
    creator,
    round: session.type === 'shells' ? Math.min(shellsRounds.length + 1, roundsTotal || SHELLS_ROUNDS_TOTAL) : (session.round || 1),
    roundsTotal,
    rules: session.rules || {},
    cards: session.type === 'card_guess' ? (session.state.cards || []) : [],
    cups: session.type === 'shells' ? (session.state.cups || []) : [],
    selectedIndex: session.type === 'card_guess' && answer ? answer.answerIndex : null,
    winningIndex: showCardResult ? session.state.winningIndex : null,
    selectedCup: lastShellRound ? lastShellRound.selectedCup : null,
    ballPosition: lastShellRound ? lastShellRound.ballPosition : null,
    lastRoundResult: lastShellRound ? lastShellRound.result : null,
    shellsRounds,
    shellsFinished,
    correctAnswers: session.type === 'shells' && answer ? answer.correctAnswers : 0,
    isCorrect: answer ? answer.isCorrect : null,
    score: answer ? answer.score : 0,
    scoreboard: session.scoreboard || [],
    resultMessageId: session.resultMessageId || null,
    inviteMessageId: session.inviteMessageId || null,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    finishedAt: session.finishedAt || null
  };
}

function appendGameMessage(state, { conversation, senderAccountId, actorUserId, type, gameSessionId, text = '' }) {
  const now = new Date().toISOString();
  const message = {
    id: createId('msg'),
    conversationId: conversation.id,
    senderAccountId,
    actorUserId,
    type,
    text,
    sharedContentId: null,
    storyReplyId: null,
    gameSessionId,
    status: 'sent',
    createdAt: now,
    updatedAt: now
  };
  state.messages.push(message);
  conversation.lastMessageAt = now;
  conversation.updatedAt = now;

  const sender = publicAccount(state, senderAccountId);
  const senderName = sender ? sender.name : 'Участник';
  (conversation.participantAccountIds || [])
    .filter((accountId) => accountId && accountId !== senderAccountId)
    .forEach((accountId) => {
      createNotification(state, {
        accountId,
        type: type === 'game_result' ? 'game_result' : 'game_invite',
        title: type === 'game_result' ? 'Результат игры' : `${senderName} пригласил вас в игру`,
        body: text || (type === 'game_result' ? 'Игра завершена' : 'Новая игра в чате'),
        targetType: 'game',
        targetId: gameSessionId,
        actorAccountId: senderAccountId
      });
    });
  return message;
}

function getGamesCatalog() {
  return { games: GAME_CATALOG };
}

function createGameSession({ userId, activeAccountId, input }) {
  const conversationId = sanitizeString(input && input.conversationId);
  const gameType = sanitizeString(input && input.gameType);

  if (!conversationId) {
    throw new HttpError(400, 'CONVERSATION_ID_REQUIRED', 'Не выбран чат');
  }
  if (!gameType) {
    throw new HttpError(400, 'GAME_TYPE_REQUIRED', 'Не выбрана игра');
  }
  assertGameTypeAllowed(gameType);

  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    ensureArrays(state);

    const conversation = state.conversations.find((item) => item.id === conversationId);
    assertConversationAccess(conversation, account.id);
    assertGameParticipantsCanInteract(state, conversation, account.id);

    if (!['personal', 'group'].includes(conversation.type)) {
      throw new HttpError(400, 'GAME_BUSINESS_CHAT_FORBIDDEN', 'Игры доступны только в личных и групповых чатах');
    }

    const now = new Date().toISOString();
    const session = {
      id: createId('game'),
      conversationId: conversation.id,
      type: gameType,
      status: 'active',
      createdByAccountId: account.id,
      actorUserId: userId,
      round: 1,
      state: makeGameState(gameType),
      rules: makeRules(gameType),
      scoreboard: [],
      inviteMessageId: null,
      resultMessageId: null,
      createdAt: now,
      updatedAt: now,
      finishedAt: null
    };
    state.gameSessions.push(session);

    const title = gameTitle(gameType);
    const inviteMessage = appendGameMessage(state, {
      conversation,
      senderAccountId: account.id,
      actorUserId: userId,
      type: 'game_invite',
      gameSessionId: session.id,
      text: `Запущена игра: ${title}`
    });
    session.inviteMessageId = inviteMessage.id;
    session.updatedAt = new Date().toISOString();

    return {
      conversation: publicConversation(state, conversation, account.id),
      session: publicGameSession(state, session, account.id)
    };
  });
}

function getGameSession({ userId, activeAccountId, sessionId }) {
  const state = db.read();
  const { account } = getActiveAccountContext(state, userId, activeAccountId);
  ensureArrays(state);

  const session = state.gameSessions.find((item) => item.id === sessionId);
  if (!session) {
    throw new HttpError(404, 'GAME_SESSION_NOT_FOUND', 'Игра не найдена');
  }

  const conversation = state.conversations.find((item) => item.id === session.conversationId);
  assertConversationAccess(conversation, account.id);

  return {
    conversation: publicConversation(state, conversation, account.id),
    session: publicGameSession(state, session, account.id)
  };
}

function upsertScore(session, state, accountId, scoreItem) {
  const existingScoreIndex = (session.scoreboard || []).findIndex((item) => item.accountId === accountId);
  if (existingScoreIndex >= 0) {
    session.scoreboard[existingScoreIndex] = scoreItem;
  } else {
    session.scoreboard.push(scoreItem);
  }
}

function answerCardGuess({ state, session, conversation, account, userId, input }) {
  const answerIndex = sanitizeNumber(input && input.answerIndex);
  if (answerIndex === null || answerIndex < 0 || answerIndex > 2) {
    throw new HttpError(400, 'GAME_ANSWER_INVALID', 'Выберите карту');
  }

  const existingAnswer = state.gameAnswers.find((item) => item.sessionId === session.id && item.accountId === account.id);
  if (existingAnswer) {
    return { session: publicGameSession(state, session, account.id), reused: true };
  }

  const isCorrect = answerIndex === session.state.winningIndex;
  const score = isCorrect ? 100 : 0;
  const now = new Date().toISOString();
  const answer = {
    id: createId('game_answer'),
    sessionId: session.id,
    conversationId: conversation.id,
    accountId: account.id,
    actorUserId: userId,
    answerIndex,
    isCorrect,
    score,
    createdAt: now
  };
  state.gameAnswers.push(answer);

  upsertScore(session, state, account.id, {
    accountId: account.id,
    account: publicAccount(state, account.id),
    score,
    isCorrect,
    answeredAt: now
  });
  session.updatedAt = now;

  return { session: publicGameSession(state, session, account.id), reused: false };
}

function answerShells({ state, session, conversation, account, userId, input }) {
  const selectedCup = sanitizeNumber(input && (input.selectedCup ?? input.answerIndex));
  if (selectedCup === null || selectedCup < 1 || selectedCup > 3) {
    throw new HttpError(400, 'GAME_ANSWER_INVALID', 'Выберите стаканчик');
  }

  const now = new Date().toISOString();
  let answer = state.gameAnswers.find((item) => item.sessionId === session.id && item.accountId === account.id);
  if (!answer) {
    answer = {
      id: createId('game_answer'),
      sessionId: session.id,
      conversationId: conversation.id,
      accountId: account.id,
      actorUserId: userId,
      rounds: [],
      correctAnswers: 0,
      answerIndex: null,
      selectedCup: null,
      ballPosition: null,
      isCorrect: null,
      score: 0,
      finished: false,
      createdAt: now,
      updatedAt: now
    };
    state.gameAnswers.push(answer);
  }

  const roundsTotal = session.state.roundsTotal || SHELLS_ROUNDS_TOTAL;
  if (answer.finished || answer.rounds.length >= roundsTotal) {
    return { session: publicGameSession(state, session, account.id), reused: true };
  }

  const roundNumber = answer.rounds.length + 1;
  const ballPosition = Math.floor(Math.random() * 3) + 1;
  const isCorrect = selectedCup === ballPosition;
  const round = {
    round: roundNumber,
    selectedCup,
    ballPosition,
    result: isCorrect ? 'correct' : 'miss',
    createdAt: now
  };
  answer.rounds.push(round);
  answer.correctAnswers += isCorrect ? 1 : 0;
  answer.answerIndex = selectedCup - 1;
  answer.selectedCup = selectedCup;
  answer.ballPosition = ballPosition;
  answer.isCorrect = isCorrect;
  answer.score = answer.correctAnswers * 100;
  answer.finished = answer.rounds.length >= roundsTotal;
  answer.updatedAt = now;

  upsertScore(session, state, account.id, {
    accountId: account.id,
    account: publicAccount(state, account.id),
    score: answer.score,
    isCorrect,
    correctAnswers: answer.correctAnswers,
    answeredAt: now
  });
  session.updatedAt = now;

  return { session: publicGameSession(state, session, account.id), reused: false };
}

function answerGameSession({ userId, activeAccountId, sessionId, input }) {
  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    ensureArrays(state);

    const session = state.gameSessions.find((item) => item.id === sessionId);
    if (!session) {
      throw new HttpError(404, 'GAME_SESSION_NOT_FOUND', 'Игра не найдена');
    }
    if (session.status !== 'active') {
      throw new HttpError(400, 'GAME_SESSION_NOT_ACTIVE', 'Игра уже завершена');
    }

    const conversation = state.conversations.find((item) => item.id === session.conversationId);
    assertConversationAccess(conversation, account.id);

    if (session.type === 'shells') {
      return answerShells({ state, session, conversation, account, userId, input });
    }
    return answerCardGuess({ state, session, conversation, account, userId, input });
  });
}

function assertCanFinish(session, state, accountId) {
  const answer = (state.gameAnswers || []).find((item) => item.sessionId === session.id && item.accountId === accountId);
  if (!answer) {
    throw new HttpError(400, 'GAME_ANSWER_REQUIRED', session.type === 'shells' ? 'Сначала сыграйте раунды' : 'Сначала выберите карту');
  }

  if (session.type === 'shells') {
    const roundsTotal = session.state.roundsTotal || SHELLS_ROUNDS_TOTAL;
    if (!Array.isArray(answer.rounds) || answer.rounds.length < roundsTotal) {
      throw new HttpError(400, 'GAME_ROUNDS_REQUIRED', 'Сначала завершите 5 раундов');
    }
  }
}

function finishGameSession({ userId, activeAccountId, sessionId }) {
  return db.transaction((state) => {
    const { account } = getActiveAccountContext(state, userId, activeAccountId);
    ensureArrays(state);

    const session = state.gameSessions.find((item) => item.id === sessionId);
    if (!session) {
      throw new HttpError(404, 'GAME_SESSION_NOT_FOUND', 'Игра не найдена');
    }

    const conversation = state.conversations.find((item) => item.id === session.conversationId);
    assertConversationAccess(conversation, account.id);

    assertCanFinish(session, state, account.id);

    if (!session.resultMessageId) {
      const now = new Date().toISOString();
      session.status = 'finished';
      session.finishedAt = now;
      session.updatedAt = now;
      session.scoreboard = (session.scoreboard || []).sort((a, b) => b.score - a.score || String(a.answeredAt).localeCompare(String(b.answeredAt)));

      const title = gameTitle(session.type);
      const resultMessage = appendGameMessage(state, {
        conversation,
        senderAccountId: account.id,
        actorUserId: userId,
        type: 'game_result',
        gameSessionId: session.id,
        text: `Результат игры: ${title}`
      });
      session.resultMessageId = resultMessage.id;
    }

    return {
      conversation: publicConversation(state, conversation, account.id),
      session: publicGameSession(state, session, account.id)
    };
  });
}

module.exports = {
  getGamesCatalog,
  createGameSession,
  getGameSession,
  answerGameSession,
  finishGameSession,
  publicGameSession
};
