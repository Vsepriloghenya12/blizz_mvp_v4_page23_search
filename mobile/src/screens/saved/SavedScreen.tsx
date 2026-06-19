import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse, SavedFilter, SavedObjectItem, SavedTargetType } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { getSavedItems, removeSavedObject } from '../../features/saved/api/savedApi';
import { BackButton } from '../../shared/ui/BackButton';

type SavedScreenProps = {
  auth: AuthResponse;
  onBack: () => void;
  onOpenOffer: (offerId: string) => void;
  onOpenVideo: (videoId: string) => void;
  onOpenPost: (postId: string) => void;
  onOpenAccount: (accountId: string) => void;
};

type FilterItem = {
  key: SavedFilter;
  label: string;
};

const filters: FilterItem[] = [
  { key: 'all', label: 'Все' },
  { key: 'post', label: 'Посты' },
  { key: 'video', label: 'Видео' },
  { key: 'offer', label: 'Предложения' },
  { key: 'business', label: 'Бизнес' }
];

const typeLabels: Record<SavedTargetType, string> = {
  post: 'Пост',
  video: 'Видео',
  offer: 'Предложение',
  business: 'Бизнес'
};

export function SavedScreen({ auth, onBack, onOpenOffer, onOpenVideo, onOpenPost, onOpenAccount }: SavedScreenProps) {
  const [activeFilter, setActiveFilter] = useState<SavedFilter>('all');
  const [items, setItems] = useState<SavedObjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadSaved(filter = activeFilter, mode: 'initial' | 'refresh' = 'initial') {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    setError(null);
    try {
      const response = await getSavedItems(auth.session.token, filter);
      setItems(response.items);
    } catch (_requestError) {
      setError('Не удалось загрузить сохранённое. Проверьте интернет или backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSaved(activeFilter);
  }, [auth.session.token, auth.activeAccount.id]);

  function changeFilter(filter: SavedFilter) {
    setActiveFilter(filter);
    loadSaved(filter);
  }

  function openRoute(item: SavedObjectItem) {
    const query = [item.location?.title, item.location?.address].filter(Boolean).join(', ');
    if (!query) {
      setNotice('Для маршрута нужен адрес или геометка.');
      return;
    }
    const url = `https://yandex.ru/maps/?text=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch(() => setNotice('Не удалось открыть внешние карты.'));
  }

  async function removeItem(item: SavedObjectItem) {
    const previous = items;
    setItems((current) => current.filter((candidate) => candidate.id !== item.id));
    setNotice('Удалено из сохранённого');
    try {
      await removeSavedObject(auth.session.token, item.targetType, item.targetId);
    } catch (_error) {
      setItems(previous);
      setNotice('Не удалось удалить объект. Попробуйте позже.');
    }
  }

  function openItem(item: SavedObjectItem) {
    if (item.targetType === 'offer') {
      onOpenOffer(item.targetId);
      return;
    }
    if (item.targetType === 'video') {
      onOpenVideo(item.targetId);
      return;
    }
    if (item.targetType === 'post') {
      onOpenPost(item.targetId);
      return;
    }
    if (item.targetType === 'business') {
      onOpenAccount(item.targetId);
      return;
    }
    setNotice('Открытие объекта будет согласовано позже.');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <View style={styles.headerTitleBlock}>
          <Text style={styles.title}>Хочу сходить</Text>
          <Text style={styles.subtitle}>Сохранённые места, посты, видео и предложения</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((filter) => (
          <Pressable
            accessibilityRole="button"
            key={filter.key}
            onPress={() => changeFilter(filter.key)}
            style={[styles.filterButton, activeFilter === filter.key && styles.filterButtonActive]}
          >
            <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>{filter.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadSaved(activeFilter, 'refresh')} />}
      >
        {loading ? (
          <View style={styles.statusBlock}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.statusText}>Загружаем сохранённое</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

        {!loading && !error && items.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyText}>Пока ничего не сохранено</Text>
          </View>
        ) : null}

        {!loading && items.length > 0 ? (
          <View style={styles.listBlock}>
            {items.map((item) => (
              <SavedCard
                item={item}
                key={item.id}
                onOpen={() => openItem(item)}
                onRemove={() => removeItem(item)}
                onRoute={() => openRoute(item)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

type SavedCardProps = {
  item: SavedObjectItem;
  onOpen: () => void;
  onRemove: () => void;
  onRoute: () => void;
};

function SavedCard({ item, onOpen, onRemove, onRoute }: SavedCardProps) {
  const locationText = [item.location?.title, item.location?.address].filter(Boolean).join(' · ');
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{typeLabels[item.targetType]}</Text>
        </View>
        <Text style={styles.savedAt}>Сохранено</Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
      {item.description ? <Text numberOfLines={2} style={styles.cardDescription}>{item.description}</Text> : null}
      {item.imageUrl ? <Text numberOfLines={1} style={styles.mediaUrl}>Медиа: {item.imageUrl}</Text> : null}
      {locationText ? <Text style={styles.locationText}>Геометка: {locationText}</Text> : null}
      <View style={styles.actions}>
        {item.actions.canOpen ? (
          <Pressable accessibilityRole="button" onPress={onOpen} style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Открыть</Text>
          </Pressable>
        ) : null}
        {item.actions.canRoute ? (
          <Pressable accessibilityRole="button" onPress={onRoute} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Маршрут</Text>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" onPress={onRemove} style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>Убрать</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 18
  },
  headerTitleBlock: {
    flex: 1
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800'
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 3
  },
  filters: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  filterButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800'
  },
  filterTextActive: {
    color: '#FFFFFF'
  },
  content: {
    paddingBottom: 34,
    paddingHorizontal: 16
  },
  statusBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 26
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 14
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12
  },
  noticeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10
  },
  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 42
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700'
  },
  listBlock: {
    gap: 12
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  typeBadge: {
    backgroundColor: colors.softBlue,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  typeBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900'
  },
  savedAt: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12
  },
  cardSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4
  },
  cardDescription: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  },
  mediaUrl: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 8
  },
  locationText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 8
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14
  },
  primaryAction: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  secondaryAction: {
    backgroundColor: colors.softBlue,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  secondaryActionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800'
  }
});
