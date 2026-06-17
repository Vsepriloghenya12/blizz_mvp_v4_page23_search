import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AuthResponse, RecentSearchItem, SearchResultItem, SearchResultType, SearchType } from '../../shared/api/types';
import { BlizzIcon } from '../../shared/ui/BlizzIcon';
import { colors } from '../../shared/ui/theme';
import { addRecentSearch, clearRecentSearches, deleteRecentSearch, getRecentSearches, searchAll } from '../../features/search/api/searchApi';

type SearchScreenProps = {
  auth: AuthResponse;
  initialType?: SearchType;
  onBack: () => void;
  onOpenAccount: (accountId: string) => void;
  onOpenOffer: (offerId: string) => void;
  onOpenPost: (postId: string) => void;
  onOpenMap: () => void;
  onOpenVideo: (videoId?: string | null) => void;
};

type SearchTab = {
  key: SearchType;
  label: string;
};

const tabs: SearchTab[] = [
  { key: 'all', label: 'Все' },
  { key: 'people', label: 'Люди' },
  { key: 'business', label: 'Бизнес' },
  { key: 'places', label: 'Места' },
  { key: 'offers', label: 'Предложения' },
  { key: 'posts', label: 'Посты' },
  { key: 'videos', label: 'Видео' }
];

const resultLabels: Record<SearchResultType, string> = {
  person: 'Человек',
  business: 'Бизнес',
  place: 'Место',
  offer: 'Предложение',
  post: 'Пост',
  video: 'Видео'
};

const resultTypeColors: Record<SearchResultType, string> = {
  person: '#0B3D99',
  business: '#12B76A',
  place: '#0B3D99',
  offer: '#E48A3F',
  post: '#0B3D99',
  video: '#D92D20'
};

export function SearchScreen({ auth, initialType = 'all', onBack, onOpenAccount, onOpenOffer, onOpenPost, onOpenMap, onOpenVideo }: SearchScreenProps) {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<SearchType>(initialType);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [recent, setRecent] = useState<RecentSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentLoading, setRecentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const cleanQuery = query.trim();

  const headerSubtitle = useMemo(() => {
    const name = auth.activeAccount.name || auth.activeAccount.username;
    return `@${auth.activeAccount.username}`;
  }, [auth.activeAccount]);

  const showRecent = cleanQuery.length < 2;

  async function loadRecent() {
    setRecentLoading(true);
    try {
      const response = await getRecentSearches(auth.session.token);
      setRecent(response.items);
    } catch (_error) {
      setRecent([]);
    } finally {
      setRecentLoading(false);
    }
  }

  useEffect(() => {
    loadRecent();
  }, [auth.session.token, auth.activeAccount.id]);

  useEffect(() => {
    let cancelled = false;
    async function runSearch() {
      if (cleanQuery.length < 2) {
        setResults([]);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await searchAll(auth.session.token, cleanQuery, activeType);
        if (!cancelled) setResults(response.results);
      } catch (_error) {
        if (!cancelled) setError('Не удалось выполнить поиск. Проверьте подключение.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timer = setTimeout(runSearch, 260);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cleanQuery, activeType, auth.session.token]);

  async function saveRecentAndOpen(result: SearchResultItem) {
    try {
      await addRecentSearch(auth.session.token, result.title, result);
      await loadRecent();
    } catch (_error) {
      // продолжаем без сохранения
    }

    if ((result.type === 'person' || result.type === 'business') && result.accountId) {
      onOpenAccount(result.accountId);
      return;
    }
    if (result.type === 'offer' && result.offerId) {
      onOpenOffer(result.offerId);
      return;
    }
    if (result.type === 'post' && result.postId) {
      onOpenPost(result.postId);
      return;
    }
    if (result.type === 'video') {
      onOpenVideo(result.videoId);
      return;
    }
    if (result.type === 'place') {
      onOpenMap();
      return;
    }
    if (result.accountId) {
      onOpenAccount(result.accountId);
      return;
    }
    setNotice('Открытие этого результата будет подключено позже.');
  }

  async function openRecent(item: RecentSearchItem) {
    if (item.targetType === 'person' || item.targetType === 'business') {
      if (item.targetId) onOpenAccount(item.targetId);
      return;
    }
    if (item.targetType === 'offer') {
      if (item.targetId) onOpenOffer(item.targetId);
      return;
    }
    if (item.targetType === 'post') {
      if (item.targetId) onOpenPost(item.targetId);
      return;
    }
    if (item.targetType === 'video') {
      onOpenVideo(item.targetId);
      return;
    }
    if (item.targetType === 'place') {
      onOpenMap();
      return;
    }
    setQuery(item.query || item.title);
  }

  async function removeRecent(id: string) {
    const previous = recent;
    setRecent((current) => current.filter((item) => item.id !== id));
    try {
      await deleteRecentSearch(auth.session.token, id);
    } catch (_error) {
      setRecent(previous);
      setNotice('Не удалось удалить.');
    }
  }

  async function clearAllRecent() {
    const previous = recent;
    setRecent([]);
    try {
      await clearRecentSearches(auth.session.token);
    } catch (_error) {
      setRecent(previous);
      setNotice('Не удалось очистить.');
    }
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <BlizzIcon color={colors.textPrimary} name="chevronLeft" size={22} strokeWidth={2.4} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Поиск</Text>
          <Text style={styles.headerSub}>{headerSubtitle}</Text>
        </View>
      </View>

      {/* Search box */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <BlizzIcon color={colors.textSecondary} name="search" size={20} strokeWidth={2.2} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Люди, места, бизнесы, посты..."
            placeholderTextColor="#98A2B3"
            style={styles.searchInput}
            value={query}
          />
          {query ? (
            <Pressable accessibilityRole="button" onPress={() => setQuery('')} style={styles.clearButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <BlizzIcon color={colors.textSecondary} name="x" size={16} strokeWidth={2.4} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsScroll}
      >
        {tabs.map((tab) => {
          const active = activeType === tab.key;
          return (
            <Pressable
              accessibilityRole="button"
              key={tab.key}
              onPress={() => setActiveType(tab.key)}
              style={[styles.tabChip, active && styles.tabChipActive]}
            >
              <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Notices */}
      {notice ? (
        <View style={styles.noticeBar}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}
      {error ? (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {showRecent ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Недавние поиски</Text>
              {recent.length > 0 ? (
                <Pressable accessibilityRole="button" onPress={clearAllRecent}>
                  <Text style={styles.clearAllText}>Очистить</Text>
                </Pressable>
              ) : null}
            </View>

            {recentLoading ? (
              <View style={styles.statusRow}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.statusText}>Загружаем</Text>
              </View>
            ) : null}

            {!recentLoading && recent.length === 0 ? (
              <View style={styles.emptyBlock}>
                <Text style={styles.emptyText}>Ещё нет недавних поисков</Text>
                <Text style={styles.emptyHint}>Начните вводить запрос выше</Text>
              </View>
            ) : null}

            {!recentLoading ? (
              <View style={styles.list}>
                {recent.map((item) => (
                  <RecentRow
                    item={item}
                    key={item.id}
                    onOpen={() => openRecent(item)}
                    onRemove={() => removeRecent(item.id)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Результаты</Text>
              {!loading && results.length > 0 ? (
                <Text style={styles.resultCount}>{results.length}</Text>
              ) : null}
            </View>

            {loading ? (
              <View style={styles.statusRow}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.statusText}>Ищем...</Text>
              </View>
            ) : null}

            {!loading && results.length === 0 && !error ? (
              <View style={styles.emptyBlock}>
                <Text style={styles.emptyText}>Ничего не найдено</Text>
                <Text style={styles.emptyHint}>Попробуйте другой запрос</Text>
              </View>
            ) : null}

            {!loading ? (
              <View style={styles.list}>
                {results.map((item) => (
                  <SearchResultRow
                    item={item}
                    key={item.id}
                    onOpen={() => saveRecentAndOpen(item)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

type SearchResultRowProps = {
  item: SearchResultItem;
  onOpen: () => void;
};

function SearchResultRow({ item, onOpen }: SearchResultRowProps) {
  const label = resultLabels[item.type] || 'Результат';
  const badgeColor = resultTypeColors[item.type] || colors.primary;

  return (
    <Pressable accessibilityRole="button" onPress={onOpen} style={styles.resultRow}>
      <View style={styles.resultAvatarWrap}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.resultAvatar} />
        ) : (
          <View style={[styles.resultAvatarFallback, { backgroundColor: badgeColor + '18' }]}>
            <Text style={[styles.resultAvatarInitial, { color: badgeColor }]}>
              {(item.title || label).slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.resultBody}>
        <View style={[styles.typeBadge, { backgroundColor: badgeColor + '18' }]}>
          <Text style={[styles.typeBadgeText, { color: badgeColor }]}>{label}</Text>
        </View>
        <Text numberOfLines={1} style={styles.resultTitle}>{item.title}</Text>
        {item.subtitle ? (
          <Text numberOfLines={1} style={styles.resultSubtitle}>{item.subtitle}</Text>
        ) : null}
        {item.description ? (
          <Text numberOfLines={2} style={styles.resultDescription}>{item.description}</Text>
        ) : null}
      </View>
      <BlizzIcon color={colors.textSecondary} name="chevronLeft" size={18} strokeWidth={2} />
    </Pressable>
  );
}

type RecentRowProps = {
  item: RecentSearchItem;
  onOpen: () => void;
  onRemove: () => void;
};

function RecentRow({ item, onOpen, onRemove }: RecentRowProps) {
  return (
    <View style={styles.recentRow}>
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.recentMain}>
        <View style={styles.recentIconWrap}>
          <BlizzIcon color={colors.primary} name="search" size={18} strokeWidth={2.2} />
        </View>
        <View style={styles.recentTextBlock}>
          <Text numberOfLines={1} style={styles.recentTitle}>{item.title || item.query}</Text>
          {item.subtitle ? (
            <Text numberOfLines={1} style={styles.recentSubtitle}>{item.subtitle}</Text>
          ) : null}
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onRemove} style={styles.removeButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <BlizzIcon color={colors.textSecondary} name="x" size={16} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1
  },

  // Header
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 18
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  headerCenter: {
    flex: 1
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4
  },
  headerSub: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 1
  },

  // Search box
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 4
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14
  },
  searchInput: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    paddingVertical: 14
  },
  clearButton: {
    alignItems: 'center',
    backgroundColor: '#F4F6F9',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24
  },

  // Filter tabs
  tabsScroll: {
    flexGrow: 0
  },
  tabsRow: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  tabChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 7
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  tabChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700'
  },
  tabChipTextActive: {
    color: '#FFFFFF'
  },

  // Notices
  noticeBar: {
    backgroundColor: '#EAF1FF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  noticeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600'
  },
  errorBar: {
    backgroundColor: '#FEE4E2',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  errorText: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '600'
  },

  // Content
  content: {
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 4
  },
  section: {
    gap: 12
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  clearAllText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700'
  },
  resultCount: {
    backgroundColor: colors.softBlue,
    borderRadius: 10,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2
  },

  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 24
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 14
  },

  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 32
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700'
  },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4
  },

  list: {
    gap: 10
  },

  // Result row
  resultRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    shadowColor: colors.primary,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 6
  },
  resultAvatarWrap: {
    flexShrink: 0
  },
  resultAvatar: {
    borderRadius: 24,
    height: 48,
    width: 48
  },
  resultAvatarFallback: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  resultAvatarInitial: {
    fontSize: 18,
    fontWeight: '800'
  },
  resultBody: {
    flex: 1,
    gap: 3
  },
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2
  },
  resultTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.1
  },
  resultSubtitle: {
    color: colors.textSecondary,
    fontSize: 13
  },
  resultDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17
  },

  // Recent row
  recentRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  recentMain: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12
  },
  recentIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderRadius: 16,
    height: 36,
    justifyContent: 'center',
    width: 36
  },
  recentTextBlock: {
    flex: 1
  },
  recentTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700'
  },
  recentSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  removeButton: {
    alignItems: 'center',
    borderRadius: 12,
    height: 28,
    justifyContent: 'center',
    width: 28
  }
});
