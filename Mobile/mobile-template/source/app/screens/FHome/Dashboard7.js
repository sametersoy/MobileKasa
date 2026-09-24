import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Animated, Dimensions, Modal, ScrollView, TouchableOpacity, TouchableWithoutFeedback,
  View, RefreshControl, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { BaseColor, BaseStyle, useTheme } from '@/config';
import { SafeAreaView, Text, Icon, CardReport03, Transaction2Col } from '@/components';
import { mobileApi } from '@/api';
import * as actionTypes from '@/actions/actionTypes';
import HeaderHome from './HeaderHome';
import TitleList from './TitleList';
import styles from './styles';

const SCREEN_W = Dimensions.get('window').width;
const DRAWER_W = Math.min(SCREEN_W * 0.78, 320);

const MENU = [
  { id: 1,  title: 'Binalar',      icon: 'city',                 screen: 'Binalar' },
  { id: 2,  title: 'Daireler',     icon: 'building',             screen: 'CMarket' },
  { id: 3,  title: 'Sakinler',     icon: 'users',                screen: 'CNews' },
  { id: 4,  title: 'Belgeler',     icon: 'folder-open',          screen: 'Belgeler' },
  { id: 5,  title: 'Finans',       icon: 'chart-line',           screen: 'Finans' },
  { id: 6,  title: 'Aidatlar',     icon: 'file-invoice-dollar',  screen: 'Aidatlar' },
  { id: 7,  title: 'Sayaçlar',     icon: 'tachometer-alt',       screen: 'Sayaclar' },
  { id: 8,  title: 'Bildirimler',  icon: 'bell',                 screen: 'Bildirimler' },
  { id: 9,  title: 'Anketler',     icon: 'poll-h',               screen: 'FPost' },
  { id: 10, title: 'İhaleler',     icon: 'gavel',                screen: 'Ihaleler' },
  { id: 11, title: 'Ayarlar',      icon: 'cog',                  screen: 'Profile' },
];

/* ─── Sağdan kayan menü ─────────────────────────────── */
const SideDrawer = ({ visible, onClose, navigation, colors, user, unread }) => {
  const slideX = useRef(new Animated.Value(DRAWER_W)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideX, { toValue: 0, useNativeDriver: true, bounciness: 0 }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, { toValue: DRAWER_W, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const navigate = (screen) => {
    onClose();
    if (!screen) { Alert.alert('Yakında', 'Bu ekran henüz hazır değil.'); return; }
    setTimeout(() => navigation.navigate(screen), 250);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Karanlık arka plan */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', opacity: backdropOpacity }} />
      </TouchableWithoutFeedback>

      {/* Sağdan gelen panel */}
      <Animated.View
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0,
          width: DRAWER_W,
          backgroundColor: colors.background,
          transform: [{ translateX: slideX }],
          shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, elevation: 16,
        }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'bottom']}>
          {/* Üst: kapat butonu + kullanıcı */}
          <View style={{ padding: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <TouchableOpacity onPress={onClose} style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
              <Icon name="times" size={20} color={BaseColor.grayColor} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="user" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text body1 bold numberOfLines={1}>{user?.fullName ?? 'Kullanıcı'}</Text>
                <Text caption1 grayColor numberOfLines={1}>{user?.email ?? ''}</Text>
              </View>
            </View>
            {unread > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: colors.primary, borderRadius: 8, padding: 8 }}>
                <Icon name="bell" size={13} color="#fff" solid />
                <Text caption1 style={{ color: '#fff' }}>{unread} okunmamış bildirim</Text>
              </View>
            )}
          </View>

          {/* Menü öğeleri */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
            {MENU.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => navigate(item.screen)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  paddingHorizontal: 20, paddingVertical: 14,
                }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name={item.icon} size={16} color="#fff" solid />
                </View>
                <Text body2 style={{ flex: 1 }}>{item.title}</Text>
                {!item.screen && (
                  <View style={{ backgroundColor: BaseColor.fieldColor, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text caption2 grayColor>Yakında</Text>
                  </View>
                )}
                {item.screen && <Icon name="angle-right" size={14} color={BaseColor.grayColor} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

/* ─── Bina Seçici Modal ─────────────────────────────── */
const BuildingPickerModal = ({ visible, onClose, buildings, selectedId, onSelect, colors }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <TouchableWithoutFeedback>
          <View style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            paddingBottom: 32,
          }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
            }}>
              <Text title3 bold style={{ flex: 1 }}>Bina Seç</Text>
              <TouchableOpacity onPress={onClose}>
                <Icon name="times" size={20} color={BaseColor.grayColor} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={buildings}
              keyExtractor={(item) => item.id}
              scrollEnabled={buildings.length > 6}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => {
                const active = item.id === selectedId;
                return (
                  <TouchableOpacity
                    onPress={() => { onSelect(item.id); onClose(); }}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 20, paddingVertical: 14,
                      backgroundColor: active ? colors.primaryLight : 'transparent',
                    }}
                  >
                    <View style={{
                      width: 40, height: 40, borderRadius: 10, marginRight: 14,
                      backgroundColor: active ? colors.primary : BaseColor.fieldColor,
                      justifyContent: 'center', alignItems: 'center',
                    }}>
                      <Icon name="city" size={18} color={active ? '#fff' : BaseColor.grayColor} solid />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text body2 bold={active}>{item.name}</Text>
                      <Text caption2 grayColor numberOfLines={1}>{item.address}</Text>
                    </View>
                    {active && <Icon name="check-circle" size={18} color={colors.primary} solid />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

/* ─── Ana ekran ─────────────────────────────────────── */
const Dashboard7 = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth?.token);
  const user  = useSelector((state) => state.auth?.user);
  const buildingList = useSelector((state) => state.building?.list ?? []);
  const selectedBuildingId = useSelector((state) => state.building?.selectedId);

  const [dashboard, setDashboard] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Dashboard özeti + bina listesini yükler (token değişince)
  const load = useCallback(async () => {
    if (!token) return;
    try {
      const dash = await mobileApi(token).dashboard();
      setDashboard(dash);
      if (dash.buildings?.length > 0) {
        dispatch({ type: actionTypes.SET_BUILDINGS, buildings: dash.buildings });
      }
    } catch (e) {
      console.warn('[Home] load error:', e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Bina değişince bildirim + son finansal hareketleri yeniden çeker
  const loadBuildingData = useCallback(async () => {
    if (!token || !selectedBuildingId) return;
    const api = mobileApi(token);
    const [notifRes, txRes] = await Promise.allSettled([
      api.notifications(selectedBuildingId, { pageSize: 5 }),
      api.get(`/buildings/${selectedBuildingId}/financial`),
    ]);
    if (notifRes.status === 'fulfilled') setNotifications(notifRes.value?.data ?? []);
    if (txRes.status === 'fulfilled') {
      const all = Array.isArray(txRes.value) ? txRes.value : (txRes.value?.data ?? []);
      setTransactions(all.slice(0, 5));
    }
  }, [token, selectedBuildingId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadBuildingData(); }, [loadBuildingData]);

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([load(), loadBuildingData()]).finally(() => setRefreshing(false));
  };

  const selectedBuilding = buildingList.find((b) => b.id === selectedBuildingId)
    ?? dashboard?.buildings?.[0]
    ?? null;
  const firstBuilding = selectedBuilding;

  // Seçili binaya ait stats — bina değişince otomatik güncellenir
  const activeBuildingData = dashboard?.buildings?.find((b) => b.id === selectedBuildingId)
    ?? dashboard?.buildings?.[0]
    ?? null;
  const unread   = activeBuildingData?.unreadNotificationCount ?? 0;
  const unpaid   = activeBuildingData?.unpaidDuesCount ?? 0;
  const polls    = activeBuildingData?.activePollsCount ?? 0;

  const stats = [
    {
      id: 1, icon: 'bell',
      title: String(unread), subTitle: 'Bildirim',
      colorIcon: '#fff', backgroundIcon: '#6366F1', isUp: false, screen: 'Bildirimler',
    },
    {
      id: 2, icon: 'file-invoice-dollar',
      title: String(unpaid), subTitle: 'Bekleyen Aidat',
      colorIcon: '#fff', backgroundIcon: colors.primary,
      isUp: unpaid === 0, screen: 'Aidatlar',
    },
    {
      id: 3, icon: 'poll-h',
      title: String(polls), subTitle: 'Aktif Anket',
      colorIcon: '#fff', backgroundIcon: '#10B981',
      isUp: polls > 0, screen: 'FPost',
    },
  ];

  return (
    <SafeAreaView style={[BaseStyle.safeAreaView, { flex: 1 }]} edges={['right', 'top', 'left']}>
      <HeaderHome
        style={{ marginBottom: 8 }}
        ComponentRight={
          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={{ padding: 4 }}>
            <Icon name="bars" size={20} color={BaseColor.grayColor} />
            {unread > 0 && (
              <View style={[styles.notyHeader, { borderColor: BaseColor.whiteColor, backgroundColor: colors.primary, bottom: 0 }]} />
            )}
          </TouchableOpacity>
        }
      />

      <SideDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navigation={navigation}
        colors={colors}
        user={user}
        unread={unread}
      />

      <BuildingPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        buildings={buildingList.length > 0 ? buildingList : (dashboard?.buildings ?? [])}
        selectedId={selectedBuildingId}
        onSelect={(id) => dispatch({ type: actionTypes.SELECT_BUILDING, id })}
        colors={colors}
      />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl colors={[colors.primary]} tintColor={colors.primary} refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.paddingContent}>
            {/* Bina özet kartı — tıkla bina değiştir */}
            <TouchableOpacity
              onPress={() => setPickerOpen(true)}
              style={[styles.headerCard, { backgroundColor: colors.primary }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text subhead style={{ color: 'rgba(255,255,255,0.75)', flex: 1 }}>Aktif Bina</Text>
                {buildingList.length > 1 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text caption2 style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {buildingList.length} bina
                    </Text>
                    <Icon name="chevron-down" size={11} color="rgba(255,255,255,0.7)" />
                  </View>
                )}
              </View>
              <Text title2 bold style={{ marginTop: 4, color: '#fff' }}>
                {firstBuilding?.name ?? 'Bina bulunamadı'}
              </Text>
              {firstBuilding && (
                <Text caption1 style={{ marginTop: 4, color: 'rgba(255,255,255,0.8)' }}>
                  {firstBuilding.unitCount} daire • {firstBuilding.address}
                </Text>
              )}
            </TouchableOpacity>

            {/* Hızlı menü (yatay kaydırma) */}
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              style={{ marginVertical: 10 }}
              contentContainerStyle={{ paddingRight: 8 }}
            >
              {MENU.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={{ width: 72, alignItems: 'center', marginRight: 6 }}
                  onPress={item.screen ? () => navigation.navigate(item.screen) : () => Alert.alert('Yakında', 'Bu ekran henüz hazır değil.')}
                >
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                    <Icon name={item.icon} size={20} color="#fff" solid />
                  </View>
                  <Text caption2 style={{ textAlign: 'center', color: BaseColor.grayColor }} numberOfLines={1}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Yatay istatistik kartları */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
            {stats.map((item, index) => (
              <CardReport03
                key={item.id}
                isUp={item.isUp}
                style={{
                  width: 150,
                  marginLeft: index === 0 ? 20 : 10,
                  marginRight: index === stats.length - 1 ? 20 : 0,
                }}
                icon={item.icon}
                title={item.title}
                subTitle={item.subTitle}
                percent={0}
                colorIcon={item.colorIcon}
                backgroundIcon={item.backgroundIcon}
                onPress={() => item.screen && navigation.navigate(item.screen)}
              />
            ))}
          </ScrollView>

          {/* Son finansal hareketler */}
          <View style={styles.paddingContent}>
            <TitleList
              title="Son Finansal Hareketler"
              textMore="Tümü"
              onPress={() => navigation.navigate('Finans')}
            />
            {transactions.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Icon name="chart-line" size={32} color={BaseColor.grayColor} />
                <Text caption1 grayColor style={{ marginTop: 8 }}>Finansal hareket yok</Text>
              </View>
            ) : (
              transactions.map((t) => {
                const isIncome = t.type === 'Income';
                const [y, m, d] = (t.date ?? '').split('-');
                const dateStr = y ? `${d}.${m}.${y}` : '';
                return (
                  <Transaction2Col
                    key={t.id}
                    icon={isIncome ? 'arrow-up' : 'arrow-down'}
                    name={t.category || (isIncome ? 'Gelir' : 'Gider')}
                    date={t.description || dateStr}
                    status={dateStr}
                    price={`${isIncome ? '+' : '-'}${Number(t.amount).toLocaleString('tr-TR')} ₺`}
                    isUp={isIncome}
                    backgroundIcon={isIncome ? '#10B981' : '#EF4444'}
                    onPress={() => {}}
                  />
                );
              })
            )}
          </View>

          {/* Son bildirimler */}
          <View style={styles.paddingContent}>
            <TitleList
              title="Son Bildirimler"
              textMore="Tümü"
              onPress={() => navigation.navigate('Bildirimler')}
            />
            {notifications.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Icon name="bell-slash" size={32} color={BaseColor.grayColor} />
                <Text caption1 grayColor style={{ marginTop: 8 }}>Bildirim yok</Text>
              </View>
            ) : (
              notifications.map((n) => (
                <Transaction2Col
                  key={n.id}
                  icon="bell"
                  name={n.title}
                  date={n.createdAt ? new Date(n.createdAt).toLocaleDateString('tr-TR') : ''}
                  status={n.isRead ? 'Okundu' : 'Yeni'}
                  price=""
                  isUp={!n.isRead}
                  backgroundIcon={n.isRead ? '#374151' : colors.primary}
                  onPress={() => {}}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Dashboard7;
