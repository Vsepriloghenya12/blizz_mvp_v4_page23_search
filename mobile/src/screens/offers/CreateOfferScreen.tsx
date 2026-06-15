import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AuthResponse, OfferType } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { createOffer } from '../../features/offers/api/offersApi';

const OFFER_TYPES: Array<{ type: OfferType; label: string }> = [
  { type: 'promo', label: 'Акция' },
  { type: 'product', label: 'Товар' },
  { type: 'service', label: 'Услуга' },
  { type: 'event', label: 'Событие' }
];

const CREATOR_ROLES = new Set(['owner', 'admin', 'smm']);

type CreateOfferScreenProps = {
  auth: AuthResponse;
  onBack: () => void;
  onOfferPublished: () => void;
  onOpenAccountSwitcher: () => void;
};

function canCreateOffer(auth: AuthResponse) {
  return auth.activeAccount.type === 'business' && CREATOR_ROLES.has(String(auth.activeAccount.role || ''));
}

export function CreateOfferScreen({ auth, onBack, onOfferPublished, onOpenAccountSwitcher }: CreateOfferScreenProps) {
  const [type, setType] = useState<OfferType>('promo');
  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [description, setDescription] = useState('');
  const [priceOrCondition, setPriceOrCondition] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [address, setAddress] = useState(auth.activeAccount.businessProfile?.address || '');
  const [locationTitle, setLocationTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = useMemo(() => canCreateOffer(auth), [auth]);

  async function handlePublish() {
    if (!allowed) {
      setError('Нет доступа к созданию предложений');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createOffer(auth.session.token, {
        type,
        title,
        coverUrl,
        description,
        priceOrCondition,
        expiresAt,
        address,
        location: locationTitle || address ? {
          title: locationTitle,
          address,
          lat: null,
          lng: null,
          precision: 'exact'
        } : null
      });
      onOfferPublished();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Не удалось опубликовать предложение';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← Назад</Text>
      </Pressable>
      <Text style={styles.title}>Создать предложение</Text>
      <Pressable accessibilityRole="button" onPress={onOpenAccountSwitcher} style={styles.accountButton}>
        <Text style={styles.accountLabel}>Бизнес-аккаунт</Text>
        <Text style={styles.accountText}>{auth.activeAccount.name} @{auth.activeAccount.username} ▼</Text>
      </Pressable>

      {!allowed ? (
        <View style={styles.lockedBlock}>
          <Text style={styles.lockedTitle}>Нет доступа</Text>
          <Text style={styles.lockedText}>Предложения может создавать только бизнес-аккаунт с ролью owner, admin или smm.</Text>
        </View>
      ) : null}

      <Text style={styles.fieldLabel}>Тип предложения</Text>
      <View style={styles.typeRow}>
        {OFFER_TYPES.map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item.type}
            onPress={() => setType(item.type)}
            style={[styles.typeChip, type === item.type && styles.typeChipActive]}
          >
            <Text style={[styles.typeChipText, type === item.type && styles.typeChipTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Название</Text>
      <TextInput onChangeText={setTitle} placeholder="Например: Завтрак -20%" placeholderTextColor={colors.textSecondary} style={styles.input} value={title} />

      <Text style={styles.fieldLabel}>Фото / обложка URL</Text>
      <TextInput autoCapitalize="none" onChangeText={setCoverUrl} placeholder="https://example.com/offer.jpg" placeholderTextColor={colors.textSecondary} style={styles.input} value={coverUrl} />

      <Text style={styles.fieldLabel}>Описание</Text>
      <TextInput multiline onChangeText={setDescription} placeholder="Коротко об условиях" placeholderTextColor={colors.textSecondary} style={[styles.input, styles.textarea]} value={description} />

      <Text style={styles.fieldLabel}>Цена / условие</Text>
      <TextInput onChangeText={setPriceOrCondition} placeholder="390 ₽ или -20%" placeholderTextColor={colors.textSecondary} style={styles.input} value={priceOrCondition} />

      <Text style={styles.fieldLabel}>Срок действия</Text>
      <TextInput onChangeText={setExpiresAt} placeholder="2026-06-20T12:00:00" placeholderTextColor={colors.textSecondary} style={styles.input} value={expiresAt} />

      <Text style={styles.fieldLabel}>Адрес</Text>
      <TextInput onChangeText={setAddress} placeholder="Сочи, ул. Морская, 10" placeholderTextColor={colors.textSecondary} style={styles.input} value={address} />

      <Text style={styles.fieldLabel}>Название места</Text>
      <TextInput onChangeText={setLocationTitle} placeholder="Кофейня на Морской" placeholderTextColor={colors.textSecondary} style={styles.input} value={locationTitle} />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable accessibilityRole="button" disabled={submitting || !allowed} onPress={handlePublish} style={[styles.primaryButton, (submitting || !allowed) && styles.buttonDisabled]}>
        <Text style={styles.primaryButtonText}>{submitting ? 'Публикуем...' : 'Опубликовать предложение'}</Text>
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
    paddingBottom: 32,
    paddingHorizontal: 16,
    paddingTop: 20
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8
  },
  backText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700'
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 8
  },
  accountButton: {
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  accountLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  accountText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4
  },
  lockedBlock: {
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 16,
    padding: 14
  },
  lockedTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800'
  },
  lockedText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 18
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  typeChip: {
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  typeChipActive: {
    backgroundColor: colors.softBlue,
    borderColor: colors.primary
  },
  typeChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700'
  },
  typeChipTextActive: {
    color: colors.primary
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 15,
    minHeight: 50,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: 'top'
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 14
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    marginTop: 22,
    minHeight: 50,
    justifyContent: 'center'
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  buttonDisabled: {
    opacity: 0.55
  }
});
