import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import type { AuthAccount, AuthResponse, ChatMessage, ConversationItem, GameCatalogItem, GameSession, MessageAccount } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { BackButton } from '../../shared/ui/BackButton';
import { createGroupConversation, getConversation, getConversations, markConversationRead, sendMessage } from '../../features/messages/api/messagesApi';
import { answerGameSession, createGameSession, finishGameSession, getGameSession, getGamesCatalog } from '../../features/games/api/gamesApi';

function IconNewGroup() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="8" r="3.2" stroke="#0B3D99" strokeWidth="1.8"/>
      <Path d="M2 19c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#0B3D99" strokeWidth="1.8" strokeLinecap="round"/>
      <Line x1="19" y1="9" x2="19" y2="15" stroke="#0B3D99" strokeWidth="2" strokeLinecap="round"/>
      <Line x1="16" y1="12" x2="22" y2="12" stroke="#0B3D99" strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  );
}

type MessagesScreenProps = {
  auth: AuthResponse;
  onBack: () => void;
  onOpenPost: (postId: string) => void;
  onOpenStory: (storyId: string) => void;
  initialConversationId?: string | null;
};

type MessagesFilter = 'all' | 'personal' | 'group' | 'business';

type ParticipantCandidate = {
  id: string;
  name: string;
  username: string;
  type: AuthAccount['type'];
  businessCategory: string | null;
};

export function MessagesScreen({ auth, onBack, onOpenPost, onOpenStory, initialConversationId = null }: MessagesScreenProps) {
  const [filter, setFilter] = useState<MessagesFilter>('all');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null);
  const [draft, setDraft] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [gamePickerOpen, setGamePickerOpen] = useState(false);
  const [gamesCatalog, setGamesCatalog] = useState<GameCatalogItem[]>([]);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [gameLoading, setGameLoading] = useState(false);
  const [gameSubmitting, setGameSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadConversations(nextFilter: MessagesFilter = filter) {
    setLoading(true);
    setError(null);
    try {
      const response = await getConversations(auth.session.token, nextFilter);
      setConversations(response.conversations);
    } catch (_requestError) {
      setError('Не удалось загрузить сообщения');
    } finally {
      setLoading(false);
    }
  }

  async function openConversation(conversationId: string) {
    setSelectedConversationId(conversationId);
    setCreatingGroup(false);
    setGamePickerOpen(false);
    setGameSession(null);
    setChatLoading(true);
    setError(null);
    try {
      const response = await getConversation(auth.session.token, conversationId);
      setSelectedConversation(response.conversation);
      setMessages(response.messages);
      await markConversationRead(auth.session.token, conversationId).catch(() => null);
    } catch (_requestError) {
      setError('Диалог недоступен');
    } finally {
      setChatLoading(false);
    }
  }

  useEffect(() => {
    loadConversations(filter);
  }, [auth.session.token, filter]);

  useEffect(() => {
    if (initialConversationId) {
      openConversation(initialConversationId);
    }
  }, [initialConversationId, auth.session.token]);

  useEffect(() => {
    getGamesCatalog(auth.session.token)
      .then((response) => setGamesCatalog(response.games.filter((game) => ['card_guess', 'football', 'shells'].includes(game.type))))
      .catch(() => setGamesCatalog([]));
  }, [auth.session.token]);

  const participantCandidates = useMemo(() => {
    const byId = new Map<string, ParticipantCandidate>();

    auth.accounts
      .filter((account) => account.id !== auth.activeAccount.id)
      .forEach((account) => {
        byId.set(account.id, {
          id: account.id,
          name: account.name,
          username: account.username,
          type: account.type,
          businessCategory: account.businessProfile?.category || null,
        });
      });

    conversations.forEach((conversation) => {
      const counterpart = conversation.counterpart;
      if (counterpart && counterpart.id !== auth.activeAccount.id) {
        byId.set(counterpart.id, {
          id: counterpart.id,
          name: counterpart.name,
          username: counterpart.username,
          type: counterpart.type,
          businessCategory: counterpart.businessCategory,
        });
      }
    });

    return Array.from(byId.values());
  }, [auth.accounts, auth.activeAccount.id, conversations]);

  async function handleSend() {
    if (!selectedConversationId || !draft.trim() || sending) return;
    const text = draft.trim();
    setDraft('');
    setSending(true);
    setError(null);
    try {
      const response = await sendMessage(auth.session.token, selectedConversationId, text);
      setMessages((current) => [...current, response.message]);
      setSelectedConversation(response.conversation);
      loadConversations(filter).catch(() => null);
    } catch (_requestError) {
      setDraft(text);
      setError('Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  }

  function changeFilter(nextFilter: MessagesFilter) {
    setFilter(nextFilter);
    setSelectedConversationId(null);
    setSelectedConversation(null);
    setMessages([]);
    setCreatingGroup(false);
    setGamePickerOpen(false);
    setGameSession(null);
  }

  function backFromChat() {
    setSelectedConversationId(null);
    setSelectedConversation(null);
    setMessages([]);
    setGamePickerOpen(false);
    setGameSession(null);
    loadConversations(filter).catch(() => null);
  }

  function openGroupCreator() {
    setError(null);
    setCreatingGroup(true);
    setSelectedConversationId(null);
    setSelectedConversation(null);
    setMessages([]);
    setGamePickerOpen(false);
    setGameSession(null);
  }

  function closeGroupCreator() {
    setCreatingGroup(false);
    setGroupTitle('');
    setSelectedParticipantIds([]);
    setError(null);
  }

  function toggleParticipant(accountId: string) {
    setSelectedParticipantIds((current) => {
      if (current.includes(accountId)) {
        return current.filter((id) => id !== accountId);
      }
      return [...current, accountId];
    });
  }

  async function handleCreateGroup() {
    if (groupSubmitting) return;
    const title = groupTitle.trim();
    if (!title) {
      setError('Введите название группы');
      return;
    }
    if (selectedParticipantIds.length === 0) {
      setError('Выберите хотя бы одного участника');
      return;
    }

    setGroupSubmitting(true);
    setError(null);
    try {
      const clientRequestId = `group_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const response = await createGroupConversation(auth.session.token, title, selectedParticipantIds, clientRequestId);
      setCreatingGroup(false);
      setGroupTitle('');
      setSelectedParticipantIds([]);
      setFilter('group');
      await openConversation(response.conversation.id);
      loadConversations('group').catch(() => null);
    } catch (_requestError) {
      setError('Не удалось создать группу');
    } finally {
      setGroupSubmitting(false);
    }
  }


  function canUseGamesInSelectedConversation() {
    return selectedConversation && selectedConversation.type !== 'business';
  }

  async function handleCreateGame(gameType: GameCatalogItem['type']) {
    if (!selectedConversationId || gameSubmitting) return;
    if (!canUseGamesInSelectedConversation()) {
      setError('Игры доступны только в личных и групповых чатах');
      return;
    }
    if (!['card_guess', 'shells'].includes(gameType)) {
      setError('Эта игра будет добавлена отдельным модулем');
      return;
    }

    setGameSubmitting(true);
    setError(null);
    try {
      const response = await createGameSession(auth.session.token, selectedConversationId, gameType);
      setSelectedConversation(response.conversation);
      setGameSession(response.session);
      setGamePickerOpen(false);
      await openConversation(response.conversation.id);
      setGameSession(response.session);
      loadConversations(filter).catch(() => null);
    } catch (_requestError) {
      setError('Не удалось запустить игру');
    } finally {
      setGameSubmitting(false);
    }
  }

  async function handleOpenGame(sessionId: string) {
    setGameLoading(true);
    setError(null);
    try {
      const response = await getGameSession(auth.session.token, sessionId);
      setSelectedConversation(response.conversation);
      setSelectedConversationId(response.conversation.id);
      setGameSession(response.session);
      setGamePickerOpen(false);
    } catch (_requestError) {
      setError('Игра недоступна');
    } finally {
      setGameLoading(false);
    }
  }

  async function handleAnswerGame(answerValue: number) {
    if (!gameSession || gameSubmitting) return;
    setGameSubmitting(true);
    setError(null);
    try {
      const payload = gameSession.type === 'shells' ? { selectedCup: answerValue } : { answerIndex: answerValue };
      const response = await answerGameSession(auth.session.token, gameSession.id, payload);
      setGameSession(response.session);
    } catch (_requestError) {
      setError(gameSession.type === 'shells' ? 'Не удалось выбрать стаканчик' : 'Не удалось выбрать карту');
    } finally {
      setGameSubmitting(false);
    }
  }

  async function handleFinishGame() {
    if (!gameSession || gameSubmitting) return;
    setGameSubmitting(true);
    setError(null);
    try {
      const response = await finishGameSession(auth.session.token, gameSession.id);
      setGameSession(response.session);
      await openConversation(response.conversation.id);
      setGameSession(null);
      loadConversations(filter).catch(() => null);
    } catch (_requestError) {
      setError('Не удалось отправить результат игры');
    } finally {
      setGameSubmitting(false);
    }
  }

  function closeGameSession() {
    const conversationId = selectedConversationId;
    setGameSession(null);
    if (conversationId) {
      openConversation(conversationId).catch(() => null);
    }
  }

  if (gameSession) {
    return (
      <GameSessionScreen
        loading={gameLoading}
        session={gameSession}
        submitting={gameSubmitting}
        error={error}
        onAnswer={handleAnswerGame}
        onBack={closeGameSession}
        onFinish={handleFinishGame}
      />
    );
  }

  if (creatingGroup) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={closeGroupCreator} />
          <Text style={styles.title}>Новая группа</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.formBlock}>
          <Text style={styles.fieldLabel}>Название группы</Text>
          <TextInput
            onChangeText={setGroupTitle}
            placeholder="Например: Куда пойдём?"
            placeholderTextColor={colors.textSecondary}
            style={styles.inputSingle}
            value={groupTitle}
          />
        </View>

        <View style={styles.formBlock}>
          <Text style={styles.fieldLabel}>Участники</Text>
          <Text style={styles.helperText}>Можно выбрать аккаунты из уже известных диалогов и ваших аккаунтов. Случайные демо-участники не добавляются.</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {participantCandidates.length === 0 ? <Text style={styles.emptyText}>Пока нет доступных участников</Text> : null}

        <ScrollView contentContainerStyle={styles.listContent}>
          {participantCandidates.map((candidate) => {
            const selected = selectedParticipantIds.includes(candidate.id);
            return (
              <Pressable accessibilityRole="button" key={candidate.id} onPress={() => toggleParticipant(candidate.id)} style={[styles.participantRow, selected && styles.participantRowSelected]}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{candidate.name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={styles.conversationBody}>
                  <Text style={styles.conversationTitle}>{candidate.name}</Text>
                  <Text style={styles.conversationPreview}>@{candidate.username}{candidate.type === 'business' ? ' · бизнес' : ''}</Text>
                </View>
                <Text style={[styles.checkMark, selected && styles.checkMarkSelected]}>{selected ? '✓' : '+'}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable accessibilityRole="button" disabled={groupSubmitting} onPress={handleCreateGroup} style={[styles.primaryButton, groupSubmitting && styles.sendButtonDisabled]}>
          <Text style={styles.primaryButtonText}>{groupSubmitting ? 'Создаём...' : 'Создать группу'}</Text>
        </Pressable>
      </View>
    );
  }


  if (selectedConversationId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={backFromChat} />
          <View style={styles.headerTitleBlock}>
            <Text style={styles.title}>{selectedConversation?.title || 'Диалог'}</Text>
            {selectedConversation ? <Text style={styles.subtitle}>{conversationSubtitle(selectedConversation)}</Text> : null}
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {chatLoading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Загружаем диалог</Text>
          </View>
        ) : null}

        <ScrollView contentContainerStyle={styles.chatContent} style={styles.chatList}>
          {!chatLoading && messages.length === 0 ? <Text style={styles.emptyText}>Пока нет сообщений</Text> : null}
          {messages.map((message) => <MessageBubble key={message.id} message={message} onOpenGame={handleOpenGame} onOpenPost={onOpenPost} onOpenStory={onOpenStory} />)}
        </ScrollView>

        {gamePickerOpen && selectedConversation ? (
          <GamePickerSheet
            games={gamesCatalog}
            loading={gameSubmitting}
            onClose={() => setGamePickerOpen(false)}
            onSelect={handleCreateGame}
          />
        ) : null}

        <View style={styles.composer}>
          {canUseGamesInSelectedConversation() ? (
            <Pressable accessibilityRole="button" onPress={() => setGamePickerOpen((current) => !current)} style={styles.chatPlusButton}>
              <Text style={styles.chatPlusText}>+</Text>
            </Pressable>
          ) : null}
          <TextInput
            multiline
            onChangeText={setDraft}
            placeholder="Сообщение..."
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={draft}
          />
          <Pressable accessibilityRole="button" disabled={!draft.trim() || sending} onPress={handleSend} style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}>
            <Text style={styles.sendText}>{sending ? '...' : 'Отпр.'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            editable={false}
            placeholder="Поиск по сообщениям..."
            placeholderTextColor="#98A2B3"
            style={styles.searchInput}
          />
        </View>
        <Pressable accessibilityRole="button" onPress={openGroupCreator} style={styles.addButton}>
          <IconNewGroup />
        </Pressable>
      </View>

      <View style={styles.filters}>
        <FilterButton active={filter === 'all'} title="Все" onPress={() => changeFilter('all')} />
        <FilterButton active={filter === 'personal'} title="Личные" onPress={() => changeFilter('personal')} />
        <FilterButton active={filter === 'group'} title="Группы" onPress={() => changeFilter('group')} />
        <FilterButton active={filter === 'business'} title="Бизнес" onPress={() => changeFilter('business')} />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {loading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Загружаем сообщения</Text>
        </View>
      ) : null}

      {!loading && conversations.length === 0 ? <Text style={styles.emptyText}>{filter === 'group' ? 'Пока нет групп' : 'Пока нет сообщений'}</Text> : null}

      <ScrollView contentContainerStyle={styles.listContent}>
        {conversations.map((conversation) => (
          <Pressable accessibilityRole="button" key={conversation.id} onPress={() => openConversation(conversation.id)} style={styles.conversationCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{conversation.title.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.conversationBody}>
              <Text style={styles.conversationTitle}>{conversation.title}</Text>
              <Text numberOfLines={1} style={styles.conversationPreview}>{conversation.lastMessagePreview}</Text>
            </View>
            <Text style={styles.conversationType}>{conversationTypeLabel(conversation)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function conversationSubtitle(conversation: ConversationItem) {
  if (conversation.type === 'business') return 'Бизнес-чат';
  if (conversation.type === 'group') return `${conversation.membersCount || conversation.participantAccountIds.length} участника`;
  return 'Личный чат';
}

function conversationTypeLabel(conversation: ConversationItem) {
  if (conversation.type === 'business') return 'Бизнес';
  if (conversation.type === 'group') return 'Группа';
  return 'Личные';
}

type FilterButtonProps = {
  title: string;
  active: boolean;
  onPress: () => void;
};

function FilterButton({ title, active, onPress }: FilterButtonProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.filterButton, active && styles.filterButtonActive]}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{title}</Text>
    </Pressable>
  );
}

function MessageBubble({ message, onOpenGame, onOpenPost, onOpenStory }: { message: ChatMessage; onOpenGame: (sessionId: string) => void; onOpenPost: (postId: string) => void; onOpenStory: (storyId: string) => void }) {
  return (
    <View style={[styles.messageBubble, message.isMine ? styles.messageMine : styles.messageOther]}>
      <Text style={styles.messageAuthor}>{message.sender?.name || 'Аккаунт'}</Text>
      {message.type === 'text' ? <Text style={styles.messageText}>{message.text}</Text> : null}
      {message.type === 'shared_content' && message.sharedContent ? <SharedContentCard message={message} onOpenPost={onOpenPost} /> : null}
      {message.type === 'story_reply' && message.storyReply ? <StoryReplyCard message={message} onOpenStory={onOpenStory} /> : null}
      {(message.type === 'game_invite' || message.type === 'game_result') && message.gameSession ? <GameMessageCard message={message} onOpenGame={onOpenGame} /> : null}
      <Text style={styles.messageMeta}>{new Date(message.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</Text>
    </View>
  );
}

function SharedContentCard({ message, onOpenPost }: { message: ChatMessage; onOpenPost: (postId: string) => void }) {
  const preview = message.sharedContent?.preview;
  const canOpenPost = message.sharedContent?.type === 'post' && Boolean(message.sharedContent.contentId);
  return (
    <View style={styles.contentCard}>
      <Text style={styles.contentLabel}>Отправлен пост</Text>
      {preview?.imageUrl ? <Image source={{ uri: preview.imageUrl }} style={styles.contentImage} /> : null}
      <Text style={styles.contentTitle}>{preview?.title || 'Пост'}</Text>
      {preview?.subtitle ? <Text numberOfLines={2} style={styles.contentSubtitle}>{preview.subtitle}</Text> : null}
      {canOpenPost ? (
        <Pressable accessibilityRole="button" onPress={() => onOpenPost(message.sharedContent?.contentId || '')} style={styles.contentActionButton}>
          <Text style={styles.contentActionText}>Открыть пост</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function StoryReplyCard({ message, onOpenStory }: { message: ChatMessage; onOpenStory: (storyId: string) => void }) {
  const reply = message.storyReply;
  return (
    <View style={styles.contentCard}>
      <Text style={styles.contentLabel}>Ответ на Близз</Text>
      {reply?.story?.imageUrl ? <Image source={{ uri: reply.story.imageUrl }} style={styles.contentImage} /> : null}
      <Text style={styles.contentTitle}>{reply?.story?.title || 'Близз'}</Text>
      <Text style={styles.contentSubtitle}>{reply?.text || message.text}</Text>
      {reply?.storyId ? (
        <Pressable accessibilityRole="button" onPress={() => onOpenStory(reply.storyId)} style={styles.contentActionButton}>
          <Text style={styles.contentActionText}>Открыть Близз</Text>
        </Pressable>
      ) : null}
    </View>
  );
}



function gameTitleByType(type: GameSession['type']) {
  if (type === 'shells') return 'Напёрстки';
  if (type === 'football') return 'Футбол';
  return 'Угадай карту';
}

function gameInviteDescription(session: GameSession) {
  if (session.type === 'shells') return 'Найди шарик под одним из трёх стаканчиков. 5 раундов, без денег и ставок.';
  return 'Выбери одну из трёх карт и проверь результат.';
}

function gameResultDescription(session: GameSession) {
  if (session.type === 'shells') return `Итог: ${session.correctAnswers || 0} из ${session.roundsTotal || 5}. Результат сохранён в чате.`;
  return 'Игра завершена, результат сохранён в чате.';
}

function GameMessageCard({ message, onOpenGame }: { message: ChatMessage; onOpenGame: (sessionId: string) => void }) {
  const session = message.gameSession;
  if (!session) return null;
  const isResult = message.type === 'game_result' || session.status === 'finished';
  const sortedScores = [...session.scoreboard].sort((a, b) => b.score - a.score);

  return (
    <View style={styles.contentCard}>
      <Text style={styles.contentLabel}>{isResult ? 'Результат игры' : 'Игра в чате'}</Text>
      <Text style={styles.contentTitle}>{session.title || gameTitleByType(session.type)}</Text>
      <Text style={styles.contentSubtitle}>{isResult ? gameResultDescription(session) : gameInviteDescription(session)}</Text>
      {isResult && sortedScores.length > 0 ? (
        <View style={styles.scoreListCompact}>
          {sortedScores.slice(0, 3).map((score, index) => (
            <Text key={`${score.accountId}_${index}`} style={styles.scoreCompactText}>{index + 1}. {score.account?.name || 'Аккаунт'} — {score.score}</Text>
          ))}
        </View>
      ) : null}
      <Pressable accessibilityRole="button" onPress={() => onOpenGame(session.id)} style={styles.contentActionButton}>
        <Text style={styles.contentActionText}>{isResult ? 'Открыть результат' : 'Открыть игру'}</Text>
      </Pressable>
    </View>
  );
}

function GamePickerSheet({ games, loading, onClose, onSelect }: { games: GameCatalogItem[]; loading: boolean; onClose: () => void; onSelect: (gameType: GameCatalogItem['type']) => void }) {
  const allowedGames = games.filter((game) => ['card_guess', 'football', 'shells'].includes(game.type));
  return (
    <View style={styles.gameSheet}>
      <View style={styles.gameSheetHeader}>
        <Text style={styles.gameSheetTitle}>Игры</Text>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.gameCloseButton}>
          <Text style={styles.gameCloseText}>×</Text>
        </Pressable>
      </View>
      {allowedGames.length === 0 ? <Text style={styles.contentSubtitle}>Игры пока не загрузились</Text> : null}
      {allowedGames.map((game) => {
        const ready = ['card_guess', 'shells'].includes(game.type) && game.status === 'ready';
        return (
          <Pressable
            accessibilityRole="button"
            disabled={!ready || loading}
            key={game.type}
            onPress={() => onSelect(game.type)}
            style={[styles.gameRow, (!ready || loading) && styles.gameRowDisabled]}
          >
            <View style={styles.gameIconCircle}>
              <Text style={styles.gameIconText}>{game.type === 'card_guess' ? '▣' : game.type === 'football' ? '⚽' : '◔'}</Text>
            </View>
            <View style={styles.conversationBody}>
              <Text style={styles.conversationTitle}>{game.title}</Text>
              <Text style={styles.conversationPreview}>{ready ? game.description : 'Следующий отдельный модуль'}</Text>
            </View>
            <Text style={styles.conversationType}>{ready ? 'Открыть' : 'Позже'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function GameSessionScreen({ loading, session, submitting, error, onAnswer, onBack, onFinish }: { loading: boolean; session: GameSession; submitting: boolean; error: string | null; onAnswer: (answerValue: number) => void; onBack: () => void; onFinish: () => void }) {
  if (session.type === 'shells') {
    return <ShellsGameScreen loading={loading} session={session} submitting={submitting} error={error} onAnswer={onAnswer} onBack={onBack} onFinish={onFinish} />;
  }
  return <CardGuessGameScreen loading={loading} session={session} submitting={submitting} error={error} onAnswer={onAnswer} onBack={onBack} onFinish={onFinish} />;
}

function CardGuessGameScreen({ loading, session, submitting, error, onAnswer, onBack, onFinish }: { loading: boolean; session: GameSession; submitting: boolean; error: string | null; onAnswer: (answerIndex: number) => void; onBack: () => void; onFinish: () => void }) {
  const selected = session.selectedIndex !== null;
  const sortedScores = [...session.scoreboard].sort((a, b) => b.score - a.score);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <View style={styles.headerTitleBlock}>
          <Text style={styles.title}>Угадай карту</Text>
          <Text style={styles.subtitle}>Игра в чате</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Загружаем игру</Text>
        </View>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.gameIntroCard}>
        <Text style={styles.gameTitle}>Найди выигрышную карту</Text>
        <Text style={styles.gameDescription}>Выбери одну из трёх карт. Деньги, ставки и азартная механика здесь не используются — это простая мини-игра для чата.</Text>
      </View>

      <View style={styles.cardsRow}>
        {session.cards.map((card) => {
          const isSelected = session.selectedIndex === card.index;
          const isWinner = session.winningIndex === card.index;
          const revealed = selected || session.status === 'finished';
          return (
            <Pressable
              accessibilityRole="button"
              disabled={selected || submitting || session.status === 'finished'}
              key={card.index}
              onPress={() => onAnswer(card.index)}
              style={[styles.playCard, isSelected && styles.playCardSelected, revealed && isWinner && styles.playCardWinner]}
            >
              <Text style={styles.playCardIcon}>{revealed ? card.icon : '?'}</Text>
              <Text style={styles.playCardText}>{card.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {selected ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{session.isCorrect ? 'Угадал' : 'Не угадал'}</Text>
          <Text style={styles.resultText}>Очки: {session.score}</Text>
          <Text style={styles.resultText}>Выигрышная карта: {session.winningIndex !== null ? session.winningIndex + 1 : '—'}</Text>
        </View>
      ) : null}

      {sortedScores.length > 0 ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Таблица</Text>
          {sortedScores.map((score, index) => (
            <Text key={`${score.accountId}_${index}`} style={styles.resultText}>{index + 1}. {score.account?.name || 'Аккаунт'} — {score.score}</Text>
          ))}
        </View>
      ) : null}

      <Pressable accessibilityRole="button" disabled={!selected || submitting} onPress={onFinish} style={[styles.primaryButton, (!selected || submitting) && styles.sendButtonDisabled]}>
        <Text style={styles.primaryButtonText}>{session.resultMessageId ? 'Результат уже в чате' : submitting ? 'Отправляем...' : 'Отправить результат в чат'}</Text>
      </Pressable>
    </View>
  );
}

function ShellsGameScreen({ loading, session, submitting, error, onAnswer, onBack, onFinish }: { loading: boolean; session: GameSession; submitting: boolean; error: string | null; onAnswer: (selectedCup: number) => void; onBack: () => void; onFinish: () => void }) {
  const roundsTotal = session.roundsTotal || 5;
  const roundsPlayed = session.shellsRounds?.length || 0;
  const finished = Boolean(session.shellsFinished) || session.status === 'finished';
  const canChoose = !finished && !submitting && session.status !== 'finished';
  const canFinish = finished && !session.resultMessageId && !submitting;
  const sortedScores = [...session.scoreboard].sort((a, b) => b.score - a.score);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <View style={styles.headerTitleBlock}>
          <Text style={styles.title}>Напёрстки</Text>
          <Text style={styles.subtitle}>Игра в чате</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Загружаем игру</Text>
        </View>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.gameIntroCard}>
        <Text style={styles.gameTitle}>Найди шарик</Text>
        <Text style={styles.gameDescription}>Выбери один из трёх стаканчиков. Всего 5 раундов. Это лёгкая игра на внимание без денег, ставок, призов и азартной механики.</Text>
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Раунд {Math.min(roundsPlayed + 1, roundsTotal)} из {roundsTotal}</Text>
        <Text style={styles.resultText}>Угадано: {session.correctAnswers || 0}</Text>
      </View>

      <View style={styles.cardsRow}>
        {(session.cups || []).map((cup) => {
          const isSelected = session.selectedCup === cup.index;
          const isBall = session.ballPosition === cup.index;
          const revealed = Boolean(session.ballPosition);
          return (
            <Pressable
              accessibilityRole="button"
              disabled={!canChoose}
              key={cup.index}
              onPress={() => onAnswer(cup.index)}
              style={[styles.playCard, isSelected && styles.playCardSelected, revealed && isBall && styles.playCardWinner]}
            >
              <Text style={styles.playCardIcon}>{revealed && isBall ? '●' : '◡'}</Text>
              <Text style={styles.playCardText}>{cup.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {session.lastRoundResult ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{session.lastRoundResult === 'correct' ? 'Угадал' : 'Не угадал'}</Text>
          <Text style={styles.resultText}>Выбран стаканчик: {session.selectedCup || '—'}</Text>
          <Text style={styles.resultText}>Шарик был под стаканчиком: {session.ballPosition || '—'}</Text>
        </View>
      ) : null}

      {sortedScores.length > 0 ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Результаты</Text>
          {sortedScores.map((score, index) => (
            <Text key={`${score.accountId}_${index}`} style={styles.resultText}>{index + 1}. {score.account?.name || 'Аккаунт'} — {score.score}</Text>
          ))}
        </View>
      ) : null}

      <Pressable accessibilityRole="button" disabled={!canFinish} onPress={onFinish} style={[styles.primaryButton, !canFinish && styles.sendButtonDisabled]}>
        <Text style={styles.primaryButtonText}>{session.resultMessageId ? 'Результат уже в чате' : submitting ? 'Отправляем...' : finished ? 'Отправить результат в чат' : `Сыграйте ${roundsTotal} раундов`}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderRadius: 20,
    flexShrink: 0,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 27
  },
  headerTitleBlock: {
    alignItems: 'center',
    flex: 1
  },
  title: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center'
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  headerSpacer: {
    width: 34
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 14,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 2,
    paddingBottom: 8,
  },
  filterButton: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterButtonActive: {
    backgroundColor: colors.softBlue,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContent: {
    gap: 10,
    paddingBottom: 32,
    paddingTop: 16
  },
  conversationCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12
  },
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  avatarText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800'
  },
  conversationBody: {
    flex: 1
  },
  conversationTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  conversationPreview: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 3
  },
  conversationType: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800'
  },
  loadingBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 20
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 12
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 22,
    textAlign: 'center'
  },
  formBlock: {
    marginTop: 20
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18
  },
  inputSingle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  participantRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12
  },
  participantRowSelected: {
    backgroundColor: colors.softBlue,
    borderColor: colors.primary
  },
  checkMark: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '900'
  },
  checkMarkSelected: {
    color: colors.primary
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    minHeight: 50,
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 8
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  chatList: {
    flex: 1,
    marginTop: 14
  },
  chatContent: {
    gap: 10,
    paddingBottom: 18
  },
  messageBubble: {
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: '86%',
    padding: 12
  },
  messageMine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.softBlue
  },
  messageOther: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface
  },
  messageAuthor: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4
  },
  messageText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 21
  },
  messageMeta: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 6,
    textAlign: 'right'
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
    padding: 10
  },
  contentLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6
  },
  contentImage: {
    backgroundColor: colors.background,
    borderRadius: 12,
    height: 120,
    marginBottom: 8,
    width: 180
  },
  contentTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800'
  },
  contentSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3
  },
  gameSheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    marginTop: 10,
    padding: 14
  },
  gameSheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  gameSheetTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900'
  },
  gameCloseButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28
  },
  gameCloseText: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20
  },
  gameRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12
  },
  gameRowDisabled: {
    opacity: 0.58
  },
  gameIconCircle: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36
  },
  gameIconText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900'
  },
  gameIntroCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 20,
    padding: 16
  },
  gameTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '900'
  },
  gameDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20
  },
  playCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    minHeight: 130,
    justifyContent: 'center',
    padding: 10
  },
  playCardSelected: {
    backgroundColor: colors.softBlue,
    borderColor: colors.primary
  },
  playCardWinner: {
    borderColor: colors.primary,
    borderWidth: 2
  },
  playCardIcon: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '900'
  },
  playCardText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
    textAlign: 'center'
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
    padding: 14
  },
  resultTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 6
  },
  resultText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20
  },
  contentActionButton: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderRadius: 14,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  contentActionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900'
  },
  scoreListCompact: {
    gap: 2,
    marginTop: 8
  },
  scoreCompactText: {
    color: colors.textSecondary,
    fontSize: 12
  },
  chatPlusButton: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  chatPlusText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 27
  },
  composer: {
    alignItems: 'flex-end',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10,
    paddingTop: 10
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.textPrimary,
    flex: 1,
    fontSize: 15,
    maxHeight: 110,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    minWidth: 64,
    paddingHorizontal: 12
  },
  sendButtonDisabled: {
    opacity: 0.45
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  }
});
