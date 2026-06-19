import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AuthResponse, VideoVisibility } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { ApiError } from '../../shared/api/client';
import { BackButton } from '../../shared/ui/BackButton';
import { createVideo, type CreateVideoInput } from '../../features/videos/api/videosApi';

type CreateVideoScreenProps = {
  auth: AuthResponse;
  onBack: () => void;
  onOpenAccountSwitcher: () => void;
  onVideoPublished: () => void;
};

const visibilityOptions: Array<{ value: VideoVisibility; label: string; description: string; disabled?: boolean }> = [
  { value: 'public', label: 'Всем', description: 'Видео увидят пользователи по настройкам аккаунта' },
  { value: 'followers', label: 'Подписчикам', description: 'Видео доступно подписчикам' },
  { value: 'close_friends', label: 'Близким', description: 'Для будущего списка близких' },
  { value: 'selected', label: 'Выбранным', description: 'Будет подключено после модуля приватности', disabled: true }
];

export function CreateVideoScreen({ auth, onBack, onOpenAccountSwitcher, onVideoPublished }: CreateVideoScreenProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [description, setDescription] = useState('');
  const [locationTitle, setLocationTitle] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [visibility, setVisibility] = useState<VideoVisibility>(auth.activeAccount.isPrivate ? 'followers' : 'public');
  const [soundTitle, setSoundTitle] = useState('Оригинальный звук');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charactersLeft = 2200 - description.length;
  const canPublish = Boolean(videoUrl.trim()) && Boolean(coverUrl.trim()) && !publishing;

  const location = useMemo<CreateVideoInput['location']>(() => {
    const title = locationTitle.trim();
    const address = locationAddress.trim();
    if (!title && !address) return null;
    return { title, address, lat: null, lng: null, precision: 'exact' };
  }, [locationTitle, locationAddress]);

  function isHttpUrl(value: string) {
    return /^https?:\/\//i.test(value.trim());
  }

  function buildPayload(): CreateVideoInput {
    return {
      videoUrl: videoUrl.trim(),
      coverUrl: coverUrl.trim(),
      description: description.trim(),
      location,
      visibility,
      soundTitle: soundTitle.trim() || 'Оригинальный звук'
    };
  }

  async function handlePublish() {
    setError(null);

    if (!isHttpUrl(videoUrl)) {
      setError('Ссылка на видео должна начинаться с http:// или https://');
      return;
    }

    if (!isHttpUrl(coverUrl)) {
      setError('Ссылка на обложку должна начинаться с http:// или https://');
      return;
    }

    if (description.length > 2200) {
      setError('Описание видео должно быть не длиннее 2200 символов');
      return;
    }

    setPublishing(true);
    try {
      await createVideo(auth.session.token, buildPayload());
      onVideoPublished();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Не удалось опубликовать видео');
      }
    } finally {
      setPublishing(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={styles.headerTitle}>Создание видео</Text>
      </View>

      <Pressable accessibilityRole="button" onPress={onOpenAccountSwitcher} style={styles.accountButton}>
        <Text style={styles.accountLabel}>Публикуем от имени</Text>
        <Text style={styles.accountText}>{auth.activeAccount.name} @{auth.activeAccount.username} ▼</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Видео</Text>
        <Text style={styles.sectionHint}>Для первой web-проверки видео добавляется ссылкой. Галерею, обрезку 9:16 и выбор первого кадра подключим отдельным media-picker модулем.</Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={setVideoUrl}
          placeholder="https://example.com/video.mp4"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={videoUrl}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Обложка</Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={setCoverUrl}
          placeholder="https://example.com/cover.jpg"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={coverUrl}
        />
        {isHttpUrl(coverUrl) ? <Image resizeMode="cover" source={{ uri: coverUrl }} style={styles.coverPreview} /> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Описание</Text>
        <TextInput
          multiline
          onChangeText={setDescription}
          placeholder="Описание видео"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, styles.textArea]}
          textAlignVertical="top"
          value={description}
        />
        <Text style={[styles.counterText, charactersLeft < 0 && styles.errorInline]}>{charactersLeft} символов осталось</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Геометка</Text>
        <Text style={styles.sectionHint}>Пока без карты: можно указать название места и адрес. Точку на карте подключим позже.</Text>
        <TextInput
          onChangeText={setLocationTitle}
          placeholder="Название места"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={locationTitle}
        />
        <TextInput
          onChangeText={setLocationAddress}
          placeholder="Адрес или описание"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={locationAddress}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Звук</Text>
        <TextInput
          onChangeText={setSoundTitle}
          placeholder="Оригинальный звук"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={soundTitle}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Видимость</Text>
        {visibilityOptions.map((option) => {
          const active = visibility === option.value;
          return (
            <Pressable
              accessibilityRole="button"
              disabled={option.disabled}
              key={option.value}
              onPress={() => setVisibility(option.value)}
              style={[styles.visibilityRow, active && styles.visibilityRowActive, option.disabled && styles.disabledRow]}
            >
              <View style={styles.visibilityTextBlock}>
                <Text style={[styles.visibilityLabel, active && styles.visibilityLabelActive]}>{option.label}</Text>
                <Text style={styles.visibilityDescription}>{option.description}</Text>
              </View>
              <Text style={[styles.visibilityMark, active && styles.visibilityLabelActive]}>{active ? '✓' : ''}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable accessibilityRole="button" disabled={!canPublish} onPress={handlePublish} style={[styles.primaryButton, !canPublish && styles.disabledButton]}>
        {publishing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Опубликовать видео</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    paddingBottom: 30,
    paddingHorizontal: 16,
    paddingTop: 20
  },
  header: {
    gap: 12
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800'
  },
  accountButton: {
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  accountLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600'
  },
  accountText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 3
  },
  section: {
    marginTop: 22
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8
  },
  sectionHint: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  textArea: {
    minHeight: 110
  },
  coverPreview: {
    backgroundColor: colors.softBlue,
    borderRadius: 20,
    height: 220,
    marginTop: 12,
    width: '100%'
  },
  counterText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 6
  },
  errorInline: {
    color: colors.danger
  },
  visibilityRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  visibilityRowActive: {
    backgroundColor: colors.softBlue,
    borderColor: colors.primary
  },
  disabledRow: {
    opacity: 0.45
  },
  visibilityTextBlock: {
    flex: 1
  },
  visibilityLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  visibilityLabelActive: {
    color: colors.primary
  },
  visibilityDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2
  },
  visibilityMark: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 18
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 24,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 52
  },
  disabledButton: {
    opacity: 0.45
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  }
});
