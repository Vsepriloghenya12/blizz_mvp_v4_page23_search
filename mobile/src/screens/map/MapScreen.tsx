import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse, MapFilter, MapObjectItem, MapObjectType, SavedTargetType } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { getMapObjects } from '../../features/map/api/mapApi';
import { removeSavedObject, saveObject } from '../../features/saved/api/savedApi';

type MapScreenProps = {
  auth: AuthResponse;
  onOpenOffer: (offerId: string) => void;
  onOpenVideo: (videoId: string) => void;
  onOpenPost: (postId: string) => void;
  onOpenStory: (storyId: string) => void;
  onOpenAccount: (accountId: string) => void;
  onOpenSearch: () => void;
};

type FilterItem = {
  key: MapFilter;
  label: string;
};

const filters: FilterItem[] = [
  { key: 'all', label: 'Все' },
  { key: 'post', label: 'Посты' },
  { key: 'video', label: 'Видео' },
  { key: 'story', label: 'Близзы' },
  { key: 'business', label: 'Бизнес' },
  { key: 'offer', label: 'Предложения' },
  { key: 'saved', label: 'Сохранённое' }
];

const typeLabels: Record<MapObjectType, string> = {
  post: 'Пост',
  video: 'Видео',
  story: 'Близз',
  business: 'Бизнес',
  offer: 'Предложение'
};

export function MapScreen({ auth, onOpenOffer, onOpenVideo, onOpenPost, onOpenStory, onOpenAccount, onOpenSearch }: MapScreenProps) {
  const [activeFilter, setActiveFilter] = useState<MapFilter>('all');
  const [items, setItems] = useState<MapObjectItem[]>([]);
  const [selected, setSelected] = useState<MapObjectItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadObjects(nextFilter = activeFilter, mode: 'initial' | 'refresh' = 'initial') {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    setError(null);
    try {
      const response = await getMapObjects(auth.session.token, nextFilter);
      setItems(response.items);
      setSelected((current) => {
        if (!current) return null;
        return response.items.find((item) => item.id === current.id) || null;
      });
    } catch (_requestError) {
      setError('Не удалось загрузить карту. Проверьте интернет или backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadObjects(activeFilter);
  }, [auth.session.token, auth.activeAccount.id]);

  function changeFilter(filter: MapFilter) {
    setActiveFilter(filter);
    setSelected(null);
    loadObjects(filter);
  }

  function openRoute(item: MapObjectItem) {
    const query = [item.location.title, item.location.address].filter(Boolean).join(', ');
    if (!query) {
      setNotice('Для маршрута нужен адрес или название места.');
      return;
    }
    const url = `https://yandex.ru/maps/?text=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch(() => setNotice('Не удалось открыть внешние карты.'));
  }

  async function saveSelectedObject(item: MapObjectItem) {
    if (!item.actions.canSave) {
      setNotice('Сохранение этого типа объекта будет подключено позже.');
      return;
    }

    const previousItems = items;
    const previousSelected = selected;
    const nextSaved = !item.isSavedByMe;
    const updateItem = (target: MapObjectItem): MapObjectItem => target.id === item.id ? { ...target, isSavedByMe: nextSaved } : target;
    setItems((current) => current.map(updateItem));
    setSelected((current) => current ? updateItem(current) : current);
    setNotice(nextSaved ? 'Сохранено' : 'Удалено из сохранённого');

    try {
      const targetType = item.type as SavedTargetType;
      if (nextSaved) await saveObject(auth.session.token, targetType, item.contentId);
      else await removeSavedObject(auth.session.token, targetType, item.contentId);
    } catch (_error) {
      setItems(previousItems);
      setSelected(previousSelected);
      setNotice('Не удалось сохранить объект. Попробуйте позже.');
    }
  }

  const visibleAreaText = useMemo(() => {
    if (items.length === 0) return 'На карте пока нет объектов для выбранного фильтра.';
    return `Найдено объектов: ${items.length}`;
  }, [items.length]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Карта</Text>
          <Text style={styles.subtitle}>Что интересного рядом?</Text>
        </View>
        <View style={styles.mapHeaderActions}>
          <Pressable accessibilityRole="button" onPress={onOpenSearch} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>⌕</Text>
          </Pressable>
          <Text style={styles.headerHint}>без live tracking</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadObjects(activeFilter, 'refresh')} />}
      >
        <View style={styles.mapArea}>
          <Text style={styles.mapAreaTitle}>Рабочий слой карты</Text>
          <Text style={styles.mapAreaText}>{visibleAreaText}</Text>
          <Text style={styles.mapAreaRule}>Финальный Android-экран будет на Yandex MapKit. Здесь проверяем данные, фильтры и переходы.</Text>
          <View style={styles.fakeMapObjects}>
            {items.slice(0, 12).map((item, index) => (
              <Pressable
                accessibilityRole="button"
                key={item.id}
                onPress={() => setSelected(item)}
                style={[
                  styles.fakePin,
                  selected?.id === item.id && styles.fakePinActive,
                  { left: `${10 + ((index * 23) % 76)}%`, top: `${14 + ((index * 31) % 68)}%` }
                ]}
              >
                <Text style={[styles.fakePinText, selected?.id === item.id && styles.fakePinTextActive]}>{pinLabel(item.type)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={styles.statusBlock}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.statusText}>Загружаем объекты карты</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

        {!loading && !error && items.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyText}>{activeFilter === 'all' ? 'Пока нет объектов на карте' : 'В этом фильтре пока ничего нет'}</Text>
          </View>
        ) : null}

        {!loading && items.length > 0 ? (
          <View style={styles.listBlock}>
            <Text style={styles.sectionTitle}>Объекты</Text>
            {items.map((item) => (
              <MapObjectRow item={item} key={item.id} onPress={() => setSelected(item)} selected={selected?.id === item.id} />
            ))}
          </View>
        ) : null}
      </ScrollView>

      {selected ? (
        <MapObjectSheet
          item={selected}
          onClose={() => setSelected(null)}
          onOpenOffer={onOpenOffer}
          onOpenVideo={onOpenVideo}
          onOpenPost={onOpenPost}
          onOpenStory={onOpenStory}
          onOpenAccount={onOpenAccount}
          onRoute={() => openRoute(selected)}
          onSave={() => saveSelectedObject(selected)}
        />
      ) : null}
    </View>
  );
}

function pinLabel(type: MapObjectType) {
  if (type === 'post') return 'P';
  if (type === 'video') return 'V';
  if (type === 'story') return 'B';
  if (type === 'business') return 'Б';
  return '₽';
}

type MapObjectRowProps = {
  item: MapObjectItem;
  selected: boolean;
  onPress: () => void;
};

function MapObjectRow({ item, selected, onPress }: MapObjectRowProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.objectRow, selected && styles.objectRowSelected]}>
      <View style={styles.objectIcon}>
        <Text style={styles.objectIconText}>{pinLabel(item.type)}</Text>
      </View>
      <View style={styles.objectTextBlock}>
        <Text style={styles.objectType}>{typeLabels[item.type]}</Text>
        <Text numberOfLines={1} style={styles.objectTitle}>{item.title}</Text>
        <Text numberOfLines={1} style={styles.objectSubtitle}>{item.subtitle}</Text>
      </View>
      {item.isSavedByMe ? <Text style={styles.savedMark}>✓</Text> : null}
    </Pressable>
  );
}

type MapObjectSheetProps = {
  item: MapObjectItem;
  onClose: () => void;
  onOpenOffer: (offerId: string) => void;
  onOpenVideo: (videoId: string) => void;
  onOpenPost: (postId: string) => void;
  onOpenStory: (storyId: string) => void;
  onOpenAccount: (accountId: string) => void;
  onRoute: () => void;
  onSave: () => void;
};

function MapObjectSheet({ item, onClose, onOpenOffer, onOpenVideo, onOpenPost, onOpenStory, onOpenAccount, onRoute, onSave }: MapObjectSheetProps) {
  const locationText = [item.location.title, item.location.address].filter(Boolean).join(' · ');
  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      <View style={styles.sheetHeader}>
        <View>
          <Text style={styles.sheetType}>{typeLabels[item.type]}</Text>
          <Text style={styles.sheetTitle}>{item.title}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>×</Text>
        </Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={() => onOpenAccount(item.author.id)}><Text style={styles.sheetSubtitle}>@{item.author.username} · {item.author.name}</Text></Pressable>
      {locationText ? <Text style={styles.sheetLocation}>{locationText}</Text> : null}
      {item.description ? <Text style={styles.sheetDescription}>{item.description}</Text> : null}
      {item.imageUrl ? <Text numberOfLines={1} style={styles.sheetImageUrl}>Медиа: {item.imageUrl}</Text> : null}
      <View style={styles.sheetActions}>
        {item.type === 'business' ? (
          <Pressable accessibilityRole="button" onPress={() => onOpenAccount(item.author.id)} style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Профиль</Text>
          </Pressable>
        ) : null}
        {item.type === 'offer' ? (
          <Pressable accessibilityRole="button" onPress={() => onOpenOffer(item.contentId)} style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Открыть</Text>
          </Pressable>
        ) : null}
        {item.type === 'post' ? (
          <Pressable accessibilityRole="button" onPress={() => onOpenPost(item.contentId)} style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Открыть</Text>
          </Pressable>
        ) : null}
        {item.type === 'video' ? (
          <Pressable accessibilityRole="button" onPress={() => onOpenVideo(item.contentId)} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>К видео</Text>
          </Pressable>
        ) : null}
        {item.type === 'story' ? (
          <Pressable accessibilityRole="button" onPress={() => onOpenStory(item.contentId)} style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Открыть</Text>
          </Pressable>
        ) : null}
        {item.actions.canRoute ? (
          <Pressable accessibilityRole="button" onPress={onRoute} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Маршрут</Text>
          </Pressable>
        ) : null}
        {item.actions.canSave ? (
          <Pressable accessibilityRole="button" onPress={onSave} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>{item.isSavedByMe ? 'Сохранено' : 'Сохранить'}</Text>
          </Pressable>
        ) : null}
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
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700'
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4
  },
  mapHeaderActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 17,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34
  },
  searchButtonText: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800'
  },
  headerHint: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700'
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
    fontWeight: '700'
  },
  filterTextActive: {
    color: '#FFFFFF'
  },
  content: {
    paddingBottom: 220,
    paddingHorizontal: 16
  },
  mapArea: {
    backgroundColor: colors.softBlue,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    minHeight: 260,
    overflow: 'hidden',
    padding: 16
  },
  mapAreaTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800'
  },
  mapAreaText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4
  },
  mapAreaRule: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 8,
    maxWidth: 280
  },
  fakeMapObjects: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  fakePin: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary,
    borderRadius: 16,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    width: 32
  },
  fakePinActive: {
    backgroundColor: colors.primary
  },
  fakePinText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900'
  },
  fakePinTextActive: {
    color: '#FFFFFF'
  },
  statusBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 22
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 14
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 14
  },
  noticeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12
  },
  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 30
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600'
  },
  listBlock: {
    gap: 10,
    paddingTop: 18
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  objectRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12
  },
  objectRowSelected: {
    borderColor: colors.primary
  },
  objectIcon: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34
  },
  objectIconText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900'
  },
  objectTextBlock: {
    flex: 1
  },
  objectType: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  objectTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2
  },
  objectSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2
  },
  savedMark: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900'
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    padding: 16,
    position: 'absolute',
    right: 0
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#D0D5DD',
    borderRadius: 2,
    height: 4,
    marginBottom: 14,
    width: 42
  },
  sheetHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  sheetType: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.softBlue,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36
  },
  closeButtonText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 26
  },
  sheetSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 6
  },
  sheetLocation: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10
  },
  sheetDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  },
  sheetImageUrl: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 8
  },
  sheetActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16
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
