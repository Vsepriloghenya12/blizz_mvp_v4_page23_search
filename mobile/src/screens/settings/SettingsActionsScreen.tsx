import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AccountSettings, AuthResponse, UpdateSettingsInput } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { getSettings, updateSettings } from '../../features/settings/api/settingsApi';

type SettingsActionsScreenProps = {
  auth: AuthResponse;
  onBack: () => void;
  onOpenSaved: () => void;
  onOpenFollowRequests: () => void;
  onOpenFollowers: (mode: 'followers' | 'following') => void;
  onOpenBlockedAccounts: () => void;
  onOpenNotifications: () => void;
  onOpenMetrics: () => void;
  onOpenBusinessDashboard: () => void;
  onOpenReports: () => void;
  onOpenAccountSwitcher: () => void;
  onCreateBusiness: () => void;
  onLogout: () => void;
};

type SettingAction = 'saved' | 'followRequests' | 'followers' | 'following' | 'blockedAccounts' | 'notifications' | 'metrics' | 'businessDashboard' | 'reports' | 'accountSwitcher' | 'createBusiness' | 'logout';

type SettingOption = {
  label: string;
  value: string;
};

type SettingItem = {
  id: string;
  section: string;
  icon: string;
  title: string;
  subtitle?: string;
  value?: string;
  action?: SettingAction;
  detailTitle?: string;
  detailText?: string;
  options?: SettingOption[];
};

type SectionBlock = {
  title: string;
  items: SettingItem[];
};

const defaultSettings: AccountSettings = {
  id: 'local_settings',
  accountId: 'local_account',
  privacy: {
    isPrivateAccount: false,
    defaultStoryVisibility: 'public',
    defaultPostVisibility: 'public',
    defaultVideoVisibility: 'public',
    draftsVisibility: 'only_me',
    closeFriendsCount: 0,
    hiddenAccountsCount: 0,
    blockedAccountsCount: 0,
  },
  map: {
    showLiveLocation: false,
    geotagsVisibility: 'public',
    showPublicationsOnMap: true,
    locationPrecision: 'area',
    placesHistoryEnabled: false,
    myPlacesCount: 0,
    recommendationRadius: '3km',
    savedPlacesCount: 0,
    routesCount: 0,
  },
  messages: {
    allowMessagesFrom: 'everyone',
    allowStoryRepliesFrom: 'everyone',
    allowGroupInvitesFrom: 'followers',
    gamesInMessagesEnabled: true,
    allowGameInvitesFrom: 'followers',
    messageRequestsCount: 0,
    blockedChatsCount: 0,
    autoSaveSharedPlaces: false,
    chatContentPreview: true,
  },
  content: {
    favoritesCount: 0,
    feedMode: 'balanced',
    showcaseMode: 'nearby',
    recommendationsNearby: true,
    showLikeAndShareCounts: true,
    mediaQuality: 'auto',
    recentSearchesCount: 0,
    viewHistoryCount: 0,
  },
  safety: {
    restrictedAccountsCount: 0,
    interactionLimitsEnabled: false,
    suspiciousMessagesFilter: true,
    familySafetyMode: false,
    teenRestrictionsEnabled: false,
    reportsCount: 0,
    moderationItemsCount: 0,
  },
  app: {
    language: 'ru',
    dataSaver: false,
    devicePermissionsStatus: 'not_configured',
    pwaInstallHintShown: false,
  },
  createdAt: '',
  updatedAt: '',
};

const visibilityLabels: Record<string, string> = {
  public: 'Все',
  followers: 'Подписчики',
  close_friends: 'Близкие',
  nobody: 'Никто',
};

const audienceLabels: Record<string, string> = {
  everyone: 'Все',
  followers: 'Подписчики',
  close_friends: 'Близкие',
  nobody: 'Никто',
};

const radiusLabels: Record<string, string> = {
  '1km': '1 км',
  '3km': '3 км',
  '5km': '5 км',
  city: 'Весь город',
};

const visibilityOptions: SettingOption[] = [
  { label: 'Все', value: 'public' },
  { label: 'Подписчики', value: 'followers' },
  { label: 'Близкие', value: 'close_friends' },
];

const audienceOptions: SettingOption[] = [
  { label: 'Все', value: 'everyone' },
  { label: 'Подписчики', value: 'followers' },
  { label: 'Близкие', value: 'close_friends' },
  { label: 'Никто', value: 'nobody' },
];

const inviteOptions: SettingOption[] = [
  { label: 'Все', value: 'everyone' },
  { label: 'Подписчики', value: 'followers' },
  { label: 'Никто', value: 'nobody' },
];

const radiusOptions: SettingOption[] = [
  { label: '1 км', value: '1km' },
  { label: '3 км', value: '3km' },
  { label: '5 км', value: '5km' },
  { label: 'Весь город', value: 'city' },
];

export function SettingsActionsScreen({ auth, onBack, onOpenSaved, onOpenFollowRequests, onOpenFollowers, onOpenBlockedAccounts, onOpenNotifications, onOpenMetrics, onOpenBusinessDashboard, onOpenReports, onOpenAccountSwitcher, onCreateBusiness, onLogout }: SettingsActionsScreenProps) {
  const [settings, setSettings] = useState<AccountSettings>(defaultSettings);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<SettingItem | null>(null);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const response = await getSettings(auth.session.token);
      setSettings(response.settings);
    } catch (_requestError) {
      setError('Не удалось загрузить настройки. Проверьте backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, [auth.session.token, auth.activeAccount.id]);

  const sections = useMemo(() => buildSections(auth, settings), [auth, settings]);
  const filteredSections = useMemo(() => filterSections(sections, query), [sections, query]);

  function runAction(action?: SettingAction) {
    if (action === 'saved') {
      onOpenSaved();
      return;
    }
    if (action === 'followRequests') {
      onOpenFollowRequests();
      return;
    }
    if (action === 'followers') {
      onOpenFollowers('followers');
      return;
    }
    if (action === 'following') {
      onOpenFollowers('following');
      return;
    }
    if (action === 'blockedAccounts') {
      onOpenBlockedAccounts();
      return;
    }
    if (action === 'notifications') {
      onOpenNotifications();
      return;
    }
    if (action === 'metrics') {
      onOpenMetrics();
      return;
    }
    if (action === 'businessDashboard') {
      onOpenBusinessDashboard();
      return;
    }
    if (action === 'reports') {
      onOpenReports();
      return;
    }
    if (action === 'accountSwitcher') {
      onOpenAccountSwitcher();
      return;
    }
    if (action === 'createBusiness') {
      onCreateBusiness();
      return;
    }
    if (action === 'logout') {
      onLogout();
    }
  }

  function openItem(item: SettingItem) {
    if (item.action) {
      runAction(item.action);
      return;
    }
    setDetailItem(item);
    setNotice(null);
  }

  async function selectOption(item: SettingItem, value: string) {
    const patch = buildPatch(item.id, value);
    if (!patch) return;

    setSavingId(item.id);
    setError(null);
    try {
      const response = await updateSettings(auth.session.token, patch);
      setSettings(response.settings);
      const nextSections = buildSections(auth, response.settings);
      const nextItem = nextSections.flatMap((section) => section.items).find((candidate) => candidate.id === item.id) || item;
      setDetailItem(nextItem);
      setNotice('Настройка сохранена');
    } catch (_requestError) {
      setNotice('Не удалось сохранить настройку');
    } finally {
      setSavingId(null);
    }
  }

  if (detailItem) {
    return (
      <SettingDetailView
        item={detailItem}
        saving={savingId === detailItem.id}
        notice={notice}
        currentValue={getCurrentValue(detailItem.id, settings)}
        onBack={() => setDetailItem(null)}
        onSelect={(value) => selectOption(detailItem, value)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Настройки и действия</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          placeholder="Поиск"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <View style={styles.statusBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.statusText}>Загружаем настройки</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!loading && filteredSections.length === 0 ? (
          <Text style={styles.emptyText}>Ничего не найдено</Text>
        ) : null}
        {filteredSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionRows}>
              {section.items.map((item) => (
                <SettingsRow key={item.id} item={item} onPress={() => openItem(item)} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function buildSections(auth: AuthResponse, settings: AccountSettings): SectionBlock[] {
  const isBusiness = auth.activeAccount.type === 'business';
  const businessRows: SettingItem[] = isBusiness
    ? [
        row('business-dashboard', 'Бизнес-инструменты', '▥', 'Управление бизнесом', 'Обзор, метрики, витрина, сообщения, жалобы и сотрудники', undefined, undefined, undefined, 'businessDashboard'),
        row('business-profile', 'Бизнес-инструменты', '▣', 'Профиль бизнеса', 'Описание, категория и публичная карточка', undefined, 'Профиль бизнеса уже открыт во вкладке профиля.'),
        row('business-showcase', 'Бизнес-инструменты', '▤', 'Витрина', 'Предложения и публикации бизнеса'),
        row('business-offers', 'Бизнес-инструменты', '%', 'Предложения', 'Акции, услуги и товары'),
        row('business-actions', 'Бизнес-инструменты', '☎', 'Кнопки действия', 'Написать, маршрут, позвонить, сайт'),
        row('business-messages', 'Бизнес-инструменты', '◌', 'Сообщения бизнеса', 'Клиенты и бизнес-чаты'),
        row('business-staff', 'Бизнес-инструменты', '♙', 'Сотрудники и доступы', 'Owner, admin, smm и сообщения'),
        row('business-metrics', 'Бизнес-инструменты', '▥', 'Метрики бизнеса', 'Просмотры, действия, сохранения', undefined, undefined, undefined, 'metrics'),
        row('business-promos', 'Бизнес-инструменты', '↗', 'Промо-публикации', 'Продвижение согласуем позже'),
        row('business-status', 'Бизнес-инструменты', '✓', 'Статус бизнеса', 'Проверка и ограничения'),
        row('business-hours', 'Бизнес-инструменты', '◷', 'График работы', 'Дни и часы работы'),
        row('business-address', 'Бизнес-инструменты', '⌖', 'Адрес и геометка бизнеса', 'Точка на карте и маршрут'),
        row('business-categories', 'Бизнес-инструменты', '#', 'Категории бизнеса', 'Тип места и витрина'),
      ]
    : [
        row('business-create', 'Бизнес-инструменты', '▣', 'Создать бизнес-аккаунт', 'Отдельный профиль для места, услуг или предложений', undefined, undefined, undefined, 'createBusiness'),
        row('business-tools-info', 'Бизнес-инструменты', '▥', 'Что получит бизнес', 'Витрина, предложения, сообщения, карта и метрики'),
      ];

  return [
    {
      title: 'Ваш аккаунт',
      items: [
        row('account-security', 'Ваш аккаунт', '◎', 'Аккаунт и безопасность', 'Телефон, email, пароль, входы и устройства'),
        row('active-sessions', 'Ваш аккаунт', '◉', 'Активные сеансы', 'Где выполнен вход, выход с устройства'),
        row('account-type', 'Ваш аккаунт', '▥', 'Тип аккаунта и инструменты', auth.activeAccount.type === 'business' ? 'Бизнес' : 'Личный'),
        row('account-switcher', 'Ваш аккаунт', '⇄', 'Переключение аккаунтов', 'Личный и бизнес-аккаунты', String(auth.accounts.length), undefined, undefined, 'accountSwitcher'),
        row('account-verification', 'Ваш аккаунт', '✓', 'Подтвердить профиль', 'Статус проверки', 'Не подтверждён'),
        row('account-management', 'Ваш аккаунт', '⌁', 'Управление аккаунтом', 'Скачать данные, деактивация, удаление глубже'),
      ],
    },
    {
      title: 'Как вы используете Близз',
      items: [
        row('saved', 'Как вы используете Близз', '☆', 'Хочу сходить', 'Сохранённые посты, видео, места, бизнесы и предложения', undefined, undefined, undefined, 'saved'),
        row('archive', 'Как вы используете Близз', '◴', 'Архив', 'Архив постов, видео и Близзов'),
        row('activity', 'Как вы используете Близз', '▱', 'Ваши действия', 'Лайки, комментарии, сохранения, ответы и репосты'),
        row('recent-searches', 'Как вы используете Близз', '⌕', 'Недавние поиски', 'Люди, места, бизнесы и предложения', String(settings.content.recentSearchesCount || 0)),
        row('view-history', 'Как вы используете Близз', '◌', 'История просмотров', 'Посты, видео, Близзы и предложения', String(settings.content.viewHistoryCount || 0)),
        row('notifications', 'Как вы используете Близз', '♢', 'Уведомления', 'Сообщения, Близзы, комментарии, бизнес и карта', undefined, undefined, undefined, 'notifications'),
        row('time-management', 'Как вы используете Близз', '◷', 'Управление временем', 'Перерывы и дневной лимит'),
        row('metrics', 'Как вы используете Близз', '▥', 'Метрики', isBusiness ? 'Бизнес-метрики' : 'Личная активность', undefined, undefined, undefined, 'metrics'),
        row('multi-account-publishing', 'Как вы используете Близз', '▦', 'Публикация в несколько аккаунтов', 'Полезно для нескольких бизнесов, без внешних платформ'),
      ],
    },
    {
      title: 'Кто может видеть ваш контент',
      items: [
        row('private-account', 'Кто может видеть ваш контент', '▢', 'Конфиденциальность аккаунта', 'Закрытый аккаунт не попадает в публичные рекомендации', settings.privacy.isPrivateAccount ? 'Закрытый' : 'Открытый', 'Закрытый аккаунт ограничивает видимость постов, видео, рекомендаций и публичных геометок.', [
          { label: 'Открытый', value: 'false' },
          { label: 'Закрытый', value: 'true' },
        ]),
        row('close-friends', 'Кто может видеть ваш контент', '★', 'Близкие', 'Выбранная аудитория для приватного контента', String(settings.privacy.closeFriendsCount || 0)),
        row('follow-requests', 'Кто может видеть ваш контент', '◎', 'Заявки на подписку', 'Запросы для закрытого аккаунта', undefined, undefined, undefined, 'followRequests'),
        row('followers-list', 'Кто может видеть ваш контент', '♙', 'Подписчики', 'Кто подписан на этот аккаунт', undefined, undefined, undefined, 'followers'),
        row('following-list', 'Кто может видеть ваш контент', '⇄', 'Подписки', 'На кого подписан этот аккаунт', undefined, undefined, undefined, 'following'),
        row('story-visibility', 'Кто может видеть ваш контент', '◌', 'Кто видит мои Близзы', 'Аудитория по умолчанию', visibilityLabels[settings.privacy.defaultStoryVisibility] || 'Все', undefined, visibilityOptions),
        row('post-visibility', 'Кто может видеть ваш контент', '▣', 'Кто видит мои посты', 'Аудитория по умолчанию', visibilityLabels[settings.privacy.defaultPostVisibility] || 'Все', undefined, visibilityOptions),
        row('video-visibility', 'Кто может видеть ваш контент', '▶', 'Кто видит мои видео', 'Аудитория по умолчанию', visibilityLabels[settings.privacy.defaultVideoVisibility] || 'Все', undefined, visibilityOptions),
        row('drafts-visibility', 'Кто может видеть ваш контент', '□', 'Кто видит мои черновики', 'Черновики всегда приватные', 'Только я'),
        row('hidden-accounts', 'Кто может видеть ваш контент', '◍', 'Скрытые аккаунты', 'Кого вы скрыли из ленты и рекомендаций', String(settings.privacy.hiddenAccountsCount || 0)),
        row('blocked-accounts', 'Кто может видеть ваш контент', '⊘', 'Заблокированные', 'Заблокированные аккаунты', String(settings.privacy.blockedAccountsCount || 0), undefined, undefined, 'blockedAccounts'),
      ],
    },
    {
      title: 'Карта и местоположение',
      items: [
        row('live-location', 'Карта и местоположение', '⌖', 'Кто видит меня на карте', 'Близз не показывает live location без явного действия', 'Выкл.', 'Живое местоположение всегда выключено в MVP. Пользователь сам добавляет геометку к контенту.'),
        row('geotags-visibility', 'Карта и местоположение', '◎', 'Кто видит мои геометки', 'Видимость геометок в публикациях', settings.map.geotagsVisibility === 'nobody' ? 'Никто' : visibilityLabels[settings.map.geotagsVisibility] || 'Все', undefined, [
          { label: 'Все', value: 'public' },
          { label: 'Подписчики', value: 'followers' },
          { label: 'Никто', value: 'nobody' },
        ]),
        row('show-publications-map', 'Карта и местоположение', '▦', 'Показывать публикации на карте', 'Посты, видео и Близзы с геометкой', settings.map.showPublicationsOnMap ? 'Вкл.' : 'Выкл.', undefined, [
          { label: 'Вкл.', value: 'true' },
          { label: 'Выкл.', value: 'false' },
        ]),
        row('location-precision', 'Карта и местоположение', '⊙', 'Точность геолокации', 'Точная или примерная точка', settings.map.locationPrecision === 'exact' ? 'Точная' : 'Примерная', undefined, [
          { label: 'Точная', value: 'exact' },
          { label: 'Примерная', value: 'area' },
        ]),
        row('places-history', 'Карта и местоположение', '◴', 'История мест', 'История мест по умолчанию выключена', settings.map.placesHistoryEnabled ? 'Вкл.' : 'Выкл.', undefined, [
          { label: 'Вкл.', value: 'true' },
          { label: 'Выкл.', value: 'false' },
        ]),
        row('my-places', 'Карта и местоположение', '⌂', 'Мои места', 'Дом, работа, любимые районы', String(settings.map.myPlacesCount || 0)),
        row('recommendation-radius', 'Карта и местоположение', '◯', 'Радиус рекомендаций', 'Для карты, мест и витрины', radiusLabels[settings.map.recommendationRadius] || '3 км', undefined, radiusOptions),
        row('saved-places', 'Карта и местоположение', '☆', 'Сохранённые места', 'Объекты из раздела Хочу сходить', String(settings.map.savedPlacesCount || 0), undefined, undefined, 'saved'),
        row('routes', 'Карта и местоположение', '↱', 'Маршруты', 'Подборки маршрутов будут позже', String(settings.map.routesCount || 0)),
      ],
    },
    {
      title: 'Взаимодействие с вами',
      items: [
        row('interaction-messages', 'Взаимодействие с вами', '◌', 'Сообщения и ответы на Близзы', 'Кто может писать и отвечать'),
        row('mentions', 'Взаимодействие с вами', '@', 'Метки и упоминания', 'Кто может отмечать вас'),
        row('comments', 'Взаимодействие с вами', '▱', 'Комментарии', 'Кто может комментировать'),
        row('reposts', 'Взаимодействие с вами', '↻', 'Настройки репостов', 'Репосты и отправка в сообщения'),
        row('share-my-posts', 'Взаимодействие с вами', '↗', 'Кто может делиться моими публикациями', 'Отправка ваших публикаций другим'),
        row('restricted-accounts', 'Взаимодействие с вами', '⊘', 'Аккаунты с ограничениями', 'Ограниченные аккаунты', String(settings.safety.restrictedAccountsCount || 0)),
        row('interaction-limits', 'Взаимодействие с вами', '!', 'Ограничение взаимодействий', 'Временная защита от всплеска активности', settings.safety.interactionLimitsEnabled ? 'Вкл.' : 'Выкл.', undefined, [
          { label: 'Вкл.', value: 'true' },
          { label: 'Выкл.', value: 'false' },
        ]),
        row('hidden-words', 'Взаимодействие с вами', 'Aa', 'Скрытые слова', 'Фильтр слов и фраз'),
        row('suspicious-messages', 'Взаимодействие с вами', '⚠', 'Фильтр подозрительных сообщений', 'Защита от спама и подозрительных сообщений', settings.safety.suspiciousMessagesFilter ? 'Вкл.' : 'Выкл.', undefined, [
          { label: 'Вкл.', value: 'true' },
          { label: 'Выкл.', value: 'false' },
        ]),
        row('invite-friends', 'Взаимодействие с вами', '+', 'Пригласить друзей', 'Поделиться Близз'),
      ],
    },
    {
      title: 'Сообщения, группы и игры',
      items: [
        row('allow-messages', 'Сообщения, группы и игры', '✉', 'Кто может писать мне', 'Личные сообщения', audienceLabels[settings.messages.allowMessagesFrom] || 'Все', undefined, audienceOptions),
        row('allow-story-replies', 'Сообщения, группы и игры', '◌', 'Кто может отвечать на Близзы', 'Ответы из просмотра Близза', audienceLabels[settings.messages.allowStoryRepliesFrom] || 'Все', undefined, audienceOptions),
        row('allow-group-invites', 'Сообщения, группы и игры', '♙', 'Кто может приглашать в группы', 'Групповые чаты', audienceLabels[settings.messages.allowGroupInvitesFrom] || 'Подписчики', undefined, inviteOptions),
        row('games-enabled', 'Сообщения, группы и игры', '♢', 'Игры в сообщениях', 'Угадай карту и Напёрстки', settings.messages.gamesInMessagesEnabled ? 'Вкл.' : 'Выкл.', undefined, [
          { label: 'Вкл.', value: 'true' },
          { label: 'Выкл.', value: 'false' },
        ]),
        row('allow-game-invites', 'Сообщения, группы и игры', '▧', 'Кто может приглашать в игру', 'Игры в личных и групповых чатах', audienceLabels[settings.messages.allowGameInvitesFrom] || 'Подписчики', undefined, inviteOptions),
        row('message-requests', 'Сообщения, группы и игры', '□', 'Запросы сообщений', 'Новые запросы', String(settings.messages.messageRequestsCount || 0)),
        row('blocked-chats', 'Сообщения, группы и игры', '⊘', 'Заблокированные чаты', 'Чаты, которые вы заблокировали', String(settings.messages.blockedChatsCount || 0)),
        row('auto-save-places', 'Сообщения, группы и игры', '☆', 'Автосохранение отправленных мест', 'Сохранять места, отправленные в чат', settings.messages.autoSaveSharedPlaces ? 'Вкл.' : 'Выкл.', undefined, [
          { label: 'Вкл.', value: 'true' },
          { label: 'Выкл.', value: 'false' },
        ]),
        row('chat-preview', 'Сообщения, группы и игры', '▤', 'Предпросмотр контента в чате', 'Карточки постов, Близзов и игр', settings.messages.chatContentPreview ? 'Вкл.' : 'Выкл.', undefined, [
          { label: 'Вкл.', value: 'true' },
          { label: 'Выкл.', value: 'false' },
        ]),
      ],
    },
    {
      title: 'Что вы видите',
      items: [
        row('favorites', 'Что вы видите', '☆', 'Избранное', 'Отдельные избранные публикации', String(settings.content.favoritesCount || 0)),
        row('content-hidden-accounts', 'Что вы видите', '◍', 'Скрытые аккаунты', 'Не показывать в ленте', String(settings.privacy.hiddenAccountsCount || 0)),
        row('feed-settings', 'Что вы видите', '▱', 'Настройки ленты', 'Подписки, рекомендации и повторяющийся контент'),
        row('showcase-settings', 'Что вы видите', '▤', 'Настройки витрины', 'Предложения рядом и категории бизнеса'),
        row('recommendation-topics', 'Что вы видите', '#', 'Темы рекомендаций', 'Места, события, еда, прогулки'),
        row('nearby-recommendations', 'Что вы видите', '⌖', 'Рекомендации рядом', 'Контент и витрина вокруг вас', settings.content.recommendationsNearby ? 'Вкл.' : 'Выкл.', undefined, [
          { label: 'Вкл.', value: 'true' },
          { label: 'Выкл.', value: 'false' },
        ]),
        row('like-share-counts', 'Что вы видите', '♡', 'Число отметок “Нравится” и репостов', 'Показывать счётчики', settings.content.showLikeAndShareCounts ? 'Вкл.' : 'Выкл.', undefined, [
          { label: 'Вкл.', value: 'true' },
          { label: 'Выкл.', value: 'false' },
        ]),
        row('feed-media-quality', 'Что вы видите', '▥', 'Качество медиа в ленте', 'Авто, экономия или высокое качество', 'Авто'),
      ],
    },
    { title: 'Бизнес-инструменты', items: businessRows },
    {
      title: 'Ваше приложение и медиафайлы',
      items: [
        row('device-permissions', 'Ваше приложение и медиафайлы', '▯', 'Разрешения устройства', 'Камера, микрофон, фото и геолокация'),
        row('camera-mic', 'Ваше приложение и медиафайлы', '◉', 'Камера и микрофон', 'Доступ для публикаций и видео'),
        row('photos-videos', 'Ваше приложение и медиафайлы', '▧', 'Фото и видео', 'Доступ к медиафайлам'),
        row('device-location', 'Ваше приложение и медиафайлы', '⌖', 'Геолокация', 'Разрешение устройства, не live tracking'),
        row('download-archive', 'Ваше приложение и медиафайлы', '↓', 'Архивирование и скачивание', 'Сохранение медиа и архива'),
        row('download-data', 'Ваше приложение и медиафайлы', '⇩', 'Скачать мои данные', 'Экспорт данных аккаунта'),
        row('accessibility', 'Ваше приложение и медиафайлы', '◎', 'Специальные возможности', 'Размер текста и доступность'),
        row('language', 'Ваше приложение и медиафайлы', '文', 'Язык', 'Русский', 'RU'),
        row('data-quality', 'Ваше приложение и медиафайлы', '▥', 'Использование данных и качество медиа', 'Качество загрузки и экономия трафика'),
        row('site-permissions', 'Ваше приложение и медиафайлы', '▣', 'Разрешения сайта', 'Web/PWA разрешения'),
        row('pwa-install', 'Ваше приложение и медиафайлы', '+', 'PWA и установка приложения', 'Web/PWA для iPhone, APK/RuStore для Android'),
      ],
    },
    {
      title: 'Безопасность и модерация',
      items: [
        row('reports', 'Безопасность и модерация', '!', 'Жалобы', 'Пожаловаться на контент или аккаунт'),
        row('my-reports', 'Безопасность и модерация', '▱', 'Мои жалобы', 'Отправленные жалобы', String(settings.safety.reportsCount || 0), undefined, undefined, 'reports'),
        row('safety-blocked', 'Безопасность и модерация', '⊘', 'Заблокированные', 'Заблокированные аккаунты', String(settings.privacy.blockedAccountsCount || 0)),
        row('safety-restricted', 'Безопасность и модерация', '◍', 'Аккаунты с ограничениями', 'Ограниченные аккаунты', String(settings.safety.restrictedAccountsCount || 0)),
        row('safety-hidden-words', 'Безопасность и модерация', 'Aa', 'Скрытые слова', 'Слова, фразы и фильтры'),
        row('safety-suspicious', 'Безопасность и модерация', '⚠', 'Подозрительные сообщения', 'Фильтр подозрительных сообщений', settings.safety.suspiciousMessagesFilter ? 'Вкл.' : 'Выкл.'),
        row('security-checkup', 'Безопасность и модерация', '✓', 'Проверка безопасности', 'Сессии, пароль и устройства'),
        row('privacy-center', 'Безопасность и модерация', '◇', 'Центр конфиденциальности', 'Правила приватности Близз'),
        row('publication-rules', 'Безопасность и модерация', '▤', 'Правила публикаций', 'Что можно публиковать'),
        row('my-content-moderation', 'Безопасность и модерация', '▥', 'Модерация моего контента', 'Статус проверок', String(settings.safety.moderationItemsCount || 0)),
      ],
    },
    {
      title: 'Безопасность семьи',
      items: [
        row('family-safe-mode', 'Безопасность семьи', '⌂', 'Безопасный режим', 'Ограничение чувствительного контента', settings.safety.familySafetyMode ? 'Вкл.' : 'Выкл.', undefined, [
          { label: 'Вкл.', value: 'true' },
          { label: 'Выкл.', value: 'false' },
        ]),
        row('teen-restrictions', 'Безопасность семьи', '♙', 'Ограничения для подростков', 'Карта, сообщения и рекомендации', settings.safety.teenRestrictionsEnabled ? 'Вкл.' : 'Выкл.', undefined, [
          { label: 'Вкл.', value: 'true' },
          { label: 'Выкл.', value: 'false' },
        ]),
        row('teen-messages', 'Безопасность семьи', '✉', 'Кто может писать подростку', 'Настройка будет отдельным экраном'),
        row('teen-map', 'Безопасность семьи', '⌖', 'Кто видит подростка на карте', 'Live location выключен всегда'),
        row('sensitive-content', 'Безопасность семьи', '◇', 'Скрытие чувствительного контента', 'Рекомендации и поиск'),
      ],
    },
    {
      title: 'Информация и поддержка',
      items: [
        row('help', 'Информация и поддержка', '?', 'Помощь', 'Ответы и поддержка'),
        row('support-privacy-center', 'Информация и поддержка', '◇', 'Центр конфиденциальности', 'Приватность и безопасность'),
        row('account-status', 'Информация и поддержка', '○', 'Статус аккаунта', 'Ограничения и предупреждения'),
        row('app-status', 'Информация и поддержка', '●', 'Статус приложения', 'Сбои, API и сервисы'),
        row('about', 'Информация и поддержка', 'i', 'Информация', 'Версия и сведения о Близз'),
        row('community-rules', 'Информация и поддержка', '▤', 'Правила сообщества', 'Правила поведения'),
        row('terms', 'Информация и поддержка', '§', 'Условия использования', 'Правила сервиса'),
        row('privacy-policy', 'Информация и поддержка', '◇', 'Политика конфиденциальности', 'Как используются данные'),
        row('feedback', 'Информация и поддержка', '↗', 'Обратная связь', 'Отправить отзыв'),
      ],
    },
    {
      title: 'Вход',
      items: [
        row('add-account', 'Вход', '+', 'Добавить аккаунт', 'Создать или войти в другой аккаунт'),
        row('logout', 'Вход', '←', 'Выйти', 'Сбросить сессию на этом устройстве', undefined, undefined, undefined, 'logout'),
      ],
    },
  ];
}

function row(id: string, section: string, icon: string, title: string, subtitle?: string, value?: string, detailText?: string, options?: SettingOption[], action?: SettingAction): SettingItem {
  return {
    id,
    section,
    icon,
    title,
    subtitle,
    value,
    detailTitle: title,
    detailText: detailText || subtitle || 'Этот раздел будет раскрыт отдельным экраном, чтобы настройки не превращались в одну огромную страницу с переключателями.',
    options,
    action,
  };
}

function filterSections(sections: SectionBlock[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return sections;

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const haystack = [section.title, item.title, item.subtitle, item.value].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(normalized);
      }),
    }))
    .filter((section) => section.items.length > 0);
}

function buildPatch(id: string, value: string): UpdateSettingsInput | null {
  const boolValue = value === 'true';
  switch (id) {
    case 'private-account':
      return { privacy: { isPrivateAccount: boolValue } };
    case 'story-visibility':
      return { privacy: { defaultStoryVisibility: value as any } };
    case 'post-visibility':
      return { privacy: { defaultPostVisibility: value as any } };
    case 'video-visibility':
      return { privacy: { defaultVideoVisibility: value as any } };
    case 'geotags-visibility':
      return { map: { geotagsVisibility: value as any } };
    case 'show-publications-map':
      return { map: { showPublicationsOnMap: boolValue } };
    case 'location-precision':
      return { map: { locationPrecision: value as any } };
    case 'places-history':
      return { map: { placesHistoryEnabled: boolValue } };
    case 'recommendation-radius':
      return { map: { recommendationRadius: value as any } };
    case 'interaction-limits':
      return { safety: { interactionLimitsEnabled: boolValue } };
    case 'suspicious-messages':
      return { safety: { suspiciousMessagesFilter: boolValue } };
    case 'allow-messages':
      return { messages: { allowMessagesFrom: value as any } };
    case 'allow-story-replies':
      return { messages: { allowStoryRepliesFrom: value as any } };
    case 'allow-group-invites':
      return { messages: { allowGroupInvitesFrom: value as any } };
    case 'games-enabled':
      return { messages: { gamesInMessagesEnabled: boolValue } };
    case 'allow-game-invites':
      return { messages: { allowGameInvitesFrom: value as any } };
    case 'auto-save-places':
      return { messages: { autoSaveSharedPlaces: boolValue } };
    case 'chat-preview':
      return { messages: { chatContentPreview: boolValue } };
    case 'nearby-recommendations':
      return { content: { recommendationsNearby: boolValue } };
    case 'like-share-counts':
      return { content: { showLikeAndShareCounts: boolValue } };
    case 'family-safe-mode':
      return { safety: { familySafetyMode: boolValue } };
    case 'teen-restrictions':
      return { safety: { teenRestrictionsEnabled: boolValue } };
    default:
      return null;
  }
}

function getCurrentValue(id: string, settings: AccountSettings): string | null {
  switch (id) {
    case 'private-account':
      return String(settings.privacy.isPrivateAccount);
    case 'story-visibility':
      return settings.privacy.defaultStoryVisibility;
    case 'post-visibility':
      return settings.privacy.defaultPostVisibility;
    case 'video-visibility':
      return settings.privacy.defaultVideoVisibility;
    case 'geotags-visibility':
      return settings.map.geotagsVisibility;
    case 'show-publications-map':
      return String(settings.map.showPublicationsOnMap);
    case 'location-precision':
      return settings.map.locationPrecision;
    case 'places-history':
      return String(settings.map.placesHistoryEnabled);
    case 'recommendation-radius':
      return settings.map.recommendationRadius;
    case 'interaction-limits':
      return String(settings.safety.interactionLimitsEnabled);
    case 'suspicious-messages':
      return String(settings.safety.suspiciousMessagesFilter);
    case 'allow-messages':
      return settings.messages.allowMessagesFrom;
    case 'allow-story-replies':
      return settings.messages.allowStoryRepliesFrom;
    case 'allow-group-invites':
      return settings.messages.allowGroupInvitesFrom;
    case 'games-enabled':
      return String(settings.messages.gamesInMessagesEnabled);
    case 'allow-game-invites':
      return settings.messages.allowGameInvitesFrom;
    case 'auto-save-places':
      return String(settings.messages.autoSaveSharedPlaces);
    case 'chat-preview':
      return String(settings.messages.chatContentPreview);
    case 'nearby-recommendations':
      return String(settings.content.recommendationsNearby);
    case 'like-share-counts':
      return String(settings.content.showLikeAndShareCounts);
    case 'family-safe-mode':
      return String(settings.safety.familySafetyMode);
    case 'teen-restrictions':
      return String(settings.safety.teenRestrictionsEnabled);
    default:
      return null;
  }
}

function SettingsRow({ item, onPress }: { item: SettingItem; onPress: () => void }) {
  const danger = item.id === 'logout';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <Text style={styles.rowIcon}>{item.icon}</Text>
      <View style={styles.rowTextBlock}>
        <Text style={[styles.rowTitle, danger && styles.dangerText]}>{item.title}</Text>
        {item.subtitle ? <Text numberOfLines={2} style={styles.rowSubtitle}>{item.subtitle}</Text> : null}
      </View>
      {item.value ? <Text style={styles.rowValue}>{item.value}</Text> : null}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function SettingDetailView({ item, saving, notice, currentValue, onBack, onSelect }: { item: SettingItem; saving: boolean; notice: string | null; currentValue: string | null; onBack: () => void; onSelect: (value: string) => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title}>{item.detailTitle || item.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.detailContent}>
        <View style={styles.detailHero}>
          <Text style={styles.detailIcon}>{item.icon}</Text>
          <Text style={styles.detailTitle}>{item.title}</Text>
          <Text style={styles.detailText}>{item.detailText}</Text>
        </View>

        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

        {item.options ? (
          <View style={styles.optionsBlock}>
            <Text style={styles.optionsTitle}>Выберите значение</Text>
            {item.options.map((option) => {
              const active = currentValue === option.value;
              return (
                <Pressable
                  accessibilityRole="button"
                  disabled={saving}
                  key={option.value}
                  onPress={() => onSelect(option.value)}
                  style={[styles.optionRow, active && styles.optionRowActive]}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label}</Text>
                  {active ? <Text style={styles.optionCheck}>✓</Text> : null}
                </Pressable>
              );
            })}
            {saving ? <Text style={styles.savingText}>Сохраняем...</Text> : null}
          </View>
        ) : (
          <View style={styles.optionsBlock}>
            <Text style={styles.optionsTitle}>Следующий экран</Text>
            <Text style={styles.detailText}>Для этой настройки заложен отдельный экран. Сейчас она добавлена в структуру, чтобы не потерять её в общей архитектуре.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 16,
  },
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backText: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '600',
  },
  title: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'left',
  },
  headerSpacer: {
    width: 28,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#F1F3F7',
    borderRadius: 12,
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 10,
    minHeight: 54,
    paddingHorizontal: 14,
  },
  searchIcon: {
    color: colors.textSecondary,
    fontSize: 24,
    marginRight: 8,
  },
  searchInput: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 18,
    minHeight: 48,
  },
  statusBlock: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 18,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 19,
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  scrollContent: {
    paddingBottom: 26,
    paddingTop: 22,
  },
  section: {
    backgroundColor: colors.surface,
    borderTopColor: '#F1F3F7',
    borderTopWidth: 8,
    paddingTop: 18,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  sectionRows: {
    backgroundColor: colors.surface,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 68,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  rowIcon: {
    color: colors.textPrimary,
    fontSize: 29,
    fontWeight: '600',
    textAlign: 'center',
    width: 42,
  },
  rowTextBlock: {
    flex: 1,
    paddingLeft: 14,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 22,
  },
  rowSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  rowValue: {
    color: colors.textSecondary,
    fontSize: 16,
    marginLeft: 10,
    maxWidth: 110,
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 30,
    marginLeft: 8,
  },
  dangerText: {
    color: colors.danger,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  detailContent: {
    padding: 24,
    paddingBottom: 32,
  },
  detailHero: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: 20,
  },
  detailIcon: {
    color: colors.textPrimary,
    fontSize: 42,
    fontWeight: '700',
  },
  detailTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
  },
  detailText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  noticeText: {
    color: colors.primary,
    fontSize: 14,
    marginTop: 14,
  },
  optionsBlock: {
    marginTop: 22,
  },
  optionsTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  optionRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
  },
  optionRowActive: {
    backgroundColor: colors.softBlue,
    marginHorizontal: -10,
    paddingHorizontal: 10,
  },
  optionText: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 17,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  optionCheck: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  savingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 12,
  },
});
