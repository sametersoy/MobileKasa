import { View, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { BaseStyle, BaseColor, useTheme } from '@/config';
import { SafeAreaView, Text, Icon } from '@/components';
import { AuthActions } from '@/actions';
import { useStore, ROLE_LABELS } from '@/context/StoreContext';
import { COLORS } from '@/components/Retail';

export default function MagazaMenu() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth?.user);
  const { store, stores, canManage } = useStore();

  const logout = () =>
    Alert.alert('Çıkış', 'Oturumu kapatmak istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: () => {
          dispatch(AuthActions.logout());
          navigation.replace('SignIn');
        },
      },
    ]);

  const items = [
    { icon: 'store', label: 'Şubeler', hint: `${stores.length} şube`, route: 'Subeler' },
    canManage && { icon: 'truck', label: 'Tedarikçiler', hint: 'Firmalar ve alışlar', route: 'Tedarikciler' },
    { icon: 'dolly', label: 'Stok Girişleri', hint: 'Mal kabul geçmişi', route: 'AlisGecmisi' },
    { icon: 'user-circle', label: 'Hesabım', hint: 'Profil, şifre, geri bildirim', route: 'Hesabim' },
  ].filter(Boolean);

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text header bold style={{ marginBottom: 12, marginTop: -4 }}>
          Mağaza
        </Text>

        {store && (
          <View style={[styles.storeCard, { backgroundColor: colors.primary }]}>
            <Icon name="store" size={22} color="#fff" />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text caption1 style={{ color: 'rgba(255,255,255,0.8)' }}>
                Aktif şube · {ROLE_LABELS[store.role]}
              </Text>
              <Text title3 bold whiteColor style={{ marginTop: 2 }}>
                {store.name}
              </Text>
              {store.address ? (
                <Text caption1 style={{ color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                  {store.address}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        <View style={[styles.group, { backgroundColor: colors.card }]}>
          {items.map((item, i) => (
            <TouchableOpacity
              key={item.route}
              onPress={() => navigation.navigate(item.route)}
              style={[
                styles.item,
                i < items.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={[styles.itemIcon, { backgroundColor: colors.background }]}>
                <Icon name={item.icon} size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text body1 bold>
                  {item.label}
                </Text>
                <Text caption2 grayColor>
                  {item.hint}
                </Text>
              </View>
              <Icon name="chevron-right" size={12} color={BaseColor.grayColor} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={logout} style={[styles.group, styles.item, { backgroundColor: colors.card }]}>
          <View style={[styles.itemIcon, { backgroundColor: '#FEE2E2' }]}>
            <Icon name="sign-out-alt" size={15} color={COLORS.danger} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text body1 bold style={{ color: COLORS.danger }}>
              Çıkış Yap
            </Text>
            {user?.email ? (
              <Text caption2 grayColor>
                {user.email}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <Text caption2 grayColor style={styles.attribution}>
          Ürün verileri: Open Food Facts katkıcıları (ODbL)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  storeCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 18 },
  group: { borderRadius: 14, marginTop: 16, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  itemIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  attribution: { textAlign: 'center', marginTop: 24 },
});
