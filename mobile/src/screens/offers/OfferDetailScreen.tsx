import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuthResponse, OfferItem } from '../../shared/api/types';
import { colors } from '../../shared/ui/theme';
import { getOffer, toggleOfferSave } from '../../features/offers/api/offersApi';
import { createReport } from '../../features/reports/api/reportsApi';
import { BackButton } from '../../shared/ui/BackButton';

type OfferDetailScreenProps = {
  auth: AuthResponse;
  offerId: string;
  onBack: () => void;
  onOpenMessages: () => void;
  onOpenBusinessChat: (businessAccountId: string) => void;
  onOpenBusinessProfile: (businessAccountId: string) => void;
};

function formatExpiresAt(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function OfferDetailScreen({ auth, offerId, onBack, onOpenMessages: _onOpenMessages, onOpenBusinessChat, onOpenBusinessProfile }: OfferDetailScreenProps) {
  const [offer, setOffer] = useState<OfferItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadOffer() {
      setLoading(true);
      setError(null);
      try {
        const response = await getOffer(auth.session.token, offerId);
        if (mounted) setOffer(response.offer);
      } catch (_requestError) {
        if (mounted) setError('Предложение недоступно');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadOffer();
    return () => {
      mounted = false;
    };
  }, [auth.session.token, offerId]);

  async function handleSave() {
    if (!offer) return;
    const previous = offer;
    const nextSaved = !offer.isSavedByMe;
    setOffer({ ...offer, isSavedByMe: nextSaved, savesCount: Math.max(0, offer.savesCount + (nextSaved ? 1 : -1)) });
    try {
      const response = await toggleOfferSave(auth.session.token, offer.id);
      setOffer((current) => current ? { ...current, isSavedByMe: response.isSavedByMe, savesCount: response.savesCount } : current);
    } catch (_requestError) {
      setOffer(previous);
      setInfo('Не удалось обновить сохранение');
    }
  }

  async function reportOffer() {
    if (!offer) return;
    setInfo(null);
    try {
      await createReport(auth.session.token, { targetType: 'offer', targetId: offer.id, reason: 'other', comment: 'Жалоба на предложение' });
      setInfo('Жалоба отправлена на проверку');
    } catch (_requestError) {
      setInfo('Не удалось отправить жалобу');
    }
  }

  function openRoute() {
    const address = offer?.address || offer?.location?.address;
    if (!address) return;
    Linking.openURL(`https://yandex.ru/maps/?text=${encodeURIComponent(address)}`).catch(() => setInfo('Не удалось открыть маршрут'));
  }

  function openPhone() {
    const phone = offer?.business.phone;
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => setInfo('Не удалось открыть звонок'));
  }

  function openWebsite() {
    const website = offer?.business.website;
    if (!website) return;
    Linking.openURL(website).catch(() => setInfo('Не удалось открыть сайт'));
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} style={styles.container}>
        <BackButton onPress={onBack} />

        {loading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>Загружаем предложение</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {info ? <Text style={styles.infoText}>{info}</Text> : null}

        {offer ? (
          <>
            <Image resizeMode="cover" source={{ uri: offer.coverUrl }} style={styles.cover} />
            <Text style={styles.type}>{offer.typeLabel}</Text>
            <Text style={styles.title}>{offer.title}</Text>
            <Pressable accessibilityRole="button" onPress={() => onOpenBusinessProfile(offer.businessAccountId)}><Text style={styles.business}>{offer.business.name} · @{offer.business.username}</Text></Pressable>
            {offer.description ? <Text style={styles.description}>{offer.description}</Text> : null}
            {offer.priceOrCondition ? <Text style={styles.meta}>Условие: {offer.priceOrCondition}</Text> : null}
            {offer.expiresAt ? <Text style={styles.meta}>Активно до: {formatExpiresAt(offer.expiresAt)}</Text> : null}
            {offer.address ? <Text style={styles.meta}>Адрес: {offer.address}</Text> : null}
            <Pressable accessibilityRole="button" onPress={reportOffer} style={styles.reportButton}>
              <Text style={styles.reportButtonText}>Пожаловаться</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>

      {offer ? (
        <View style={styles.bottomPanel}>
          <PanelButton title="Написать" onPress={() => onOpenBusinessChat(offer.businessAccountId)} />
          {(offer.address || offer.location?.address) ? <PanelButton title="Маршрут" onPress={openRoute} /> : null}
          {offer.business.phone ? <PanelButton title="Позвонить" onPress={openPhone} /> : null}
          {offer.business.website ? <PanelButton title="Сайт" onPress={openWebsite} /> : null}
          <PanelButton title={offer.isSavedByMe ? 'Сохранено' : 'Сохранить'} onPress={handleSave} />
        </View>
      ) : null}
    </View>
  );
}

type PanelButtonProps = {
  title: string;
  onPress: () => void;
};

function PanelButton({ title, onPress }: PanelButtonProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.panelButton}>
      <Text style={styles.panelButtonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1
  },
  container: {
    flex: 1
  },
  content: {
    paddingBottom: 120,
    paddingHorizontal: 16,
    paddingTop: 20
  },
  loadingBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 20
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginTop: 16
  },
  infoText: {
    backgroundColor: colors.softBlue,
    borderRadius: 14,
    color: colors.primary,
    fontSize: 13,
    marginTop: 14,
    padding: 12
  },
  cover: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    height: 260,
    marginTop: 12,
    width: '100%'
  },
  type: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 18,
    textTransform: 'uppercase'
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginTop: 6
  },
  business: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 6
  },
  description: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 23,
    marginTop: 18
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10
  },
  reportButton: {
    alignSelf: 'flex-start',
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  reportButtonText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800'
  },
  bottomPanel: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    gap: 6,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 10,
    position: 'absolute',
    right: 0
  },
  panelButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 4
  },
  panelButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center'
  }
});
