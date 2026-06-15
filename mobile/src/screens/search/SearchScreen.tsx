import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AuthResponse, RecentSearchItem, SearchResultItem, SearchResultType, SearchType } from '../../shared/api/types';
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
  person: 'Люди',
  business: 'Бизнес',
  place: 'Место',
  offer: 'Предложение',
  post: 'Пост',
  video: 'Видео'
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
        if (!cancelled) setError('Не удалось выполнить поиск. Проверьте подключение и backend.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const timer = setTimeout(runSearch, 260);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [auth.session.token, cleanQuery, activeType]);

  const showRecent = cleanQuery.length < 2;
  const headerSubtitle = useMemo(() => {
    if (activeType === 'all') return 'Люди, бизнесы, места, предложения, посты и видео';
    return tabs.find((tab) => tab.key === activeType)?.label || 'Поиск';
  }, [activeType]);

  async function saveRecentAndOpen(result: SearchResultItem) {
    try {
      await addRecentSearch(auth.session.token, cleanQuery || result.title, result);
      loadRecent();
    } catch (_error) {
      // Недавний поиск не должен блокировать переход к объекту.
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
      setNotice('Не удалось удалить недавний поиск.');
    }
  }

  async function clearAllRecent() {
    const previous = recent;
    setRecent([]);
    try {
      await clearRecentSearches(auth.session.token);
    } catch (_error) {
      setRecent(previous);
      setNotice('Не удалось очистить недавние поиски.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerTextBlock}>
          <Text style={styles.title}>Поиск</Text>
          <Text style={styles.subtitle}>{headerSubtitle}</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={setQuery}
          placeholder="Найти людей, места, бизнесы..."
          placeholderTextColor={colors.textSecondary}
          style={styles.searchInput}
          value={query}
        />
        {query ? (
          <Pressable accessibilityRole="button" onPress={() => setQuery('')} style={styles.clearQueryButton}>
            <Text style={styles.clearQueryText}>×</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {tabs.map((tab) => (
          <Pressable accessibilityRole="button" key={tab.key} onPress={() => setActiveType(tab.key)} style={[styles.tabButton, activeType === tab.key && styles.tabButtonActive]}>
            <Text style={[styles.tabText, activeType === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ScrollView contentContainerStyle={styles.content}>
        {showRecent ? (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Недавние поиски</Text>
              {recent.length > 0 ? (
                <Pressable accessibilityRole="button" onPress={clearAllRecent}>
                  <Text style={styles.clearAllText}>Очистить</Text>
                </Pressable>
              ) : null}
            </View>
            {recentLoading ? (
              <View style={styles.statusBlock}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.statusText}>Загружаем недавние поиски</Text>
              </View>
            ) : null}
            {!recentLoading && recent.length === 0 ? <Text style={styles.emptyText}>Пока нет недавних поисков</Text> : null}
            {!recentLoading && recent.map((item) => (
              <RecentRow item={item} key={item.id} onOpen={() => openRecent(item)} onRemove={() => removeRecent(item.id)} />
            ))}
          </View>
        ) : (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Результаты</Text>
            {loading ? (
              <View style={styles.statusBlock}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.statusText}>Ищем</Text>
              </View>
            ) : null}
            {!loading && results.length === 0 && !error ? <Text style={styles.emptyText}>Ничего не найдено</Text> : null}
            {!loading && results.map((item) => (
              <SearchResultRow item={item} key={item.id} onOpen={() => saveRecentAndOpen(item)} />
            ))}
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
  return (
    <Pressable accessibilityRole="button" onPress={onOpen} style={styles.resultRow}>
      {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.resultImage} /> : <View style={styles.resultIcon}><Text style={styles.resultIconText}>{label.slice(0, 1)}</Text></View>}
      <View style={styles.resultTextBlock}>
        <Text style={styles.resultType}>{label}</Text>
        <Text numberOfLines={1} style={styles.resultTitle}>{item.title}</Text>
        {item.subtitle ? <Text numberOfLines={1} style={styles.resultSubtitle}>{item.subtitle}</Text> : null}
        {item.description ? <Text numberOfLines={2} style={styles.resultDescription}>{item.description}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
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
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.recentOpenArea}>
        <View style={styles.recentIcon}><Text style={styles.recentIconText}>⌕</Text></View>
        <View style={styles.resultTextBlock}>
          <Text numberOfLines={1} style={styles.resultTitle}>{item.title || item.query}</Text>
          {item.subtitle ? <Text numberOfLines={1} style={styles.resultSubtitle}>{item.subtitle}</Text> : null}
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onRemove} style={styles.removeRecentButton}>
        <Text style={styles.removeRecentText}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 18 },
  backButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  backText: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', lineHeight: 24 },
  headerTextBlock: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  searchBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 16, paddingHorizontal: 12 },
  searchIcon: { color: colors.textSecondary, fontSize: 18, fontWeight: '800' },
  searchInput: { color: colors.textPrimary, flex: 1, fontSize: 15, minHeight: 44 },
  clearQueryButton: { alignItems: 'center', borderRadius: 14, height: 28, justifyContent: 'center', width: 28 },
  clearQueryText: { color: colors.textSecondary, fontSize: 22, fontWeight: '700', lineHeight: 24 },
  tabs: { gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  tabButton: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  tabButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#FFFFFF' },
  content: { paddingBottom: 30, paddingHorizontal: 16 },
  sectionBlock: { gap: 10 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  clearAllText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  statusBlock: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'center', paddingVertical: 20 },
  statusText: { color: colors.textSecondary, fontSize: 14 },
  emptyText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600', paddingVertical: 22, textAlign: 'center' },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '700', marginHorizontal: 16, marginTop: 8 },
  noticeText: { color: colors.primary, fontSize: 13, fontWeight: '700', marginHorizontal: 16, marginTop: 8 },
  resultRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 12 },
  resultImage: { backgroundColor: colors.softBlue, borderRadius: 22, height: 44, width: 44 },
  resultIcon: { alignItems: 'center', backgroundColor: colors.softBlue, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  resultIconText: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  resultTextBlock: { flex: 1 },
  resultType: { color: colors.primary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  resultTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 2 },
  resultSubtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  resultDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 },
  chevron: { color: colors.textSecondary, fontSize: 26, lineHeight: 28 },
  recentRow: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  recentOpenArea: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 12 },
  recentIcon: { alignItems: 'center', backgroundColor: colors.softBlue, borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  recentIconText: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  removeRecentButton: { alignItems: 'center', borderRadius: 15, height: 30, justifyContent: 'center', width: 30 },
  removeRecentText: { color: colors.textSecondary, fontSize: 22, fontWeight: '700', lineHeight: 24 }
});
