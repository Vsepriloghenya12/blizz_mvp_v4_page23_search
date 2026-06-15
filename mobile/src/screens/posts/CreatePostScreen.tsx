import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AuthResponse, PostVisibility } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { ApiError } from '../../shared/api/client';
import { createDraft, createPost, type CreatePostInput } from '../../features/posts/api/postsApi';

type CreatePostScreenProps = {
  auth: AuthResponse;
  onBack: () => void;
  onOpenAccountSwitcher: () => void;
  onPostPublished: () => void;
  onDraftSaved: () => void;
};

type SubmitMode = 'publish' | 'draft' | null;

const visibilityOptions: Array<{ value: PostVisibility; label: string; description: string; disabled?: boolean }> = [
  { value: 'public', label: 'Всем', description: 'Пост увидят пользователи по настройкам аккаунта' },
  { value: 'followers', label: 'Подписчикам', description: 'Пост доступен подписчикам' },
  { value: 'close_friends', label: 'Близким', description: 'Для будущего списка близких' },
  { value: 'selected', label: 'Выбранным', description: 'Будет подключено после модуля приватности', disabled: true }
];

export function CreatePostScreen({ auth, onBack, onOpenAccountSwitcher, onPostPublished, onDraftSaved }: CreatePostScreenProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [locationTitle, setLocationTitle] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>(auth.activeAccount.isPrivate ? 'followers' : 'public');
  const [submitMode, setSubmitMode] = useState<SubmitMode>(null);
  const [error, setError] = useState<string | null>(null);

  const canPublish = mediaUrls.length > 0 && !submitMode;
  const canSaveDraft = !submitMode && (mediaUrls.length > 0 || text.trim().length > 0 || locationTitle.trim().length > 0 || locationAddress.trim().length > 0);
  const charactersLeft = 2200 - text.length;

  const location = useMemo<CreatePostInput['location']>(() => {
    const title = locationTitle.trim();
    const address = locationAddress.trim();
    if (!title && !address) return null;
    return { title, address, lat: null, lng: null, precision: 'exact' };
  }, [locationTitle, locationAddress]);

  function addImageUrl() {
    const nextUrl = imageUrl.trim();
    setError(null);

    if (!nextUrl) {
      setError('Вставьте ссылку на фото');
      return;
    }

    if (!/^https?:\/\//i.test(nextUrl)) {
      setError('Ссылка на фото должна начинаться с http:// или https://');
      return;
    }

    if (mediaUrls.length >= 10) {
      setError('В пост можно добавить не больше 10 фото');
      return;
    }

    setMediaUrls((current) => [...current, nextUrl]);
    setImageUrl('');
  }

  function removeImageUrl(index: number) {
    setMediaUrls((current) => current.filter((_item, itemIndex) => itemIndex !== index));
  }

  function buildPayload(): CreatePostInput {
    return {
      media: mediaUrls.map((url) => ({ type: 'image', url })),
      text: text.trim(),
      location,
      visibility
    };
  }

  async function handlePublish() {
    setError(null);

    if (mediaUrls.length === 0) {
      setError('Добавьте хотя бы одно фото');
      return;
    }

    if (text.length > 2200) {
      setError('Текст поста должен быть не длиннее 2200 символов');
      return;
    }

    setSubmitMode('publish');
    try {
      await createPost(auth.session.token, buildPayload());
      onPostPublished();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Не удалось опубликовать пост');
      }
    } finally {
      setSubmitMode(null);
    }
  }

  async function handleSaveDraft() {
    setError(null);

    if (!canSaveDraft) {
      setError('Добавьте текст, фото или место, чтобы сохранить черновик');
      return;
    }

    if (text.length > 2200) {
      setError('Текст поста должен быть не длиннее 2200 символов');
      return;
    }

    setSubmitMode('draft');
    try {
      await createDraft(auth.session.token, buildPayload());
      onDraftSaved();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('Не удалось сохранить черновик');
      }
    } finally {
      setSubmitMode(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Назад</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Создание поста</Text>
      </View>

      <Pressable accessibilityRole="button" onPress={onOpenAccountSwitcher} style={styles.accountButton}>
        <Text style={styles.accountLabel}>Публикуем от имени</Text>
        <Text style={styles.accountText}>{auth.activeAccount.name} @{auth.activeAccount.username} ▼</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Фото</Text>
        <Text style={styles.sectionHint}>Для первой web-проверки фото добавляется ссылкой. Галерею подключим отдельным media-picker модулем.</Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={setImageUrl}
          placeholder="https://example.com/photo.jpg"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={imageUrl}
        />
        <Pressable accessibilityRole="button" onPress={addImageUrl} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Добавить фото</Text>
        </Pressable>
        <Text style={styles.counterText}>{mediaUrls.length}/10 фото</Text>
        {mediaUrls.map((url, index) => (
          <View key={`${url}-${index}`} style={styles.mediaRow}>
            <Text numberOfLines={1} style={styles.mediaText}>{index + 1}. {url}</Text>
            <Pressable accessibilityRole="button" onPress={() => removeImageUrl(index)}>
              <Text style={styles.removeText}>Удалить</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Текст</Text>
        <TextInput
          multiline
          onChangeText={setText}
          placeholder="Что хотите рассказать?"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, styles.textArea]}
          textAlignVertical="top"
          value={text}
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
        {submitMode === 'publish' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Опубликовать</Text>}
      </Pressable>

      <Pressable accessibilityRole="button" disabled={!canSaveDraft} onPress={handleSaveDraft} style={[styles.draftButton, !canSaveDraft && styles.disabledDraftButton]}>
        {submitMode === 'draft' ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.draftButtonText}>Сохранить черновик</Text>}
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
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 34,
    justifyContent: 'center'
  },
  backText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700'
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
    marginTop: 16,
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
    marginTop: 3
  },
  section: {
    marginTop: 22
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800'
  },
  sectionHint: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 48,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  textArea: {
    minHeight: 118
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 10
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700'
  },
  counterText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 8
  },
  mediaRow: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  mediaText: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 13
  },
  removeText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700'
  },
  visibilityRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 10,
    minHeight: 62,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  visibilityRowActive: {
    backgroundColor: colors.softBlue,
    borderColor: colors.primary
  },
  disabledRow: {
    opacity: 0.5
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
  errorInline: {
    color: colors.danger
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    minHeight: 50,
    justifyContent: 'center',
    marginTop: 18
  },
  disabledButton: {
    opacity: 0.45
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800'
  },
  draftButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    minHeight: 50,
    justifyContent: 'center',
    marginTop: 10
  },
  disabledDraftButton: {
    opacity: 0.45
  },
  draftButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800'
  }
});
