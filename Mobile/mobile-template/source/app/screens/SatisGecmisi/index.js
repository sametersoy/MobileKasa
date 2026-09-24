import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BaseStyle, BaseColor, useTheme } from '@/config';
import { SafeAreaView, Text, Icon } from '@/components';
import { useStore } from '@/context/StoreContext';
import { ScreenHeader, Chip, EmptyState, StatCard, Sheet, StoreSwitcher, COLORS } from '@/components/Retail';
import { fmt, fmtQty, fmtTime, fmtDay, fmtDateTime, PAYMENT_LABELS } from '@/components/Retail/format';

const startOfDay = (offsetDays = 0) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
};

const RANGES = [
  { key: 'today', label: 'Bugün', from: () => startOfDay(0), to: () => startOfDay(1) },
  { key: 'yesterday', label: 'Dün', from: () => startOfDay(-1), to: () => startOfDay(0) },
  { key: 'week', label: '7 gün', from: () => startOfDay(-6), to: () => startOfDay(1) },
  { key: 'month', label: '30 gün', from: () => startOfDay(-29), to: () => startOfDay(1) },
];

const PAGE_SIZE = 30;

export default function SatisGecmisi() {
  const { colors } = useTheme();
  const { storeId, api, stores, selectStore } = useStore();

  const [range, setRange] = useState('today');
  const [allStores, setAllStores] = useState(false); // tüm şubelerin satışları
  useEffect(() => {
    if (stores.length < 2) setAllStores(false);
  }, [stores.length]);
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);

  const params = useMemo(() => {
    const r = RANGES.find((x) => x.key === range);
    return { from: r.from().toISOString(), to: r.to().toISOString() };
  }, [range]);

  const load = useCallback(
    async (nextPage = 1) => {
      if (!storeId || !api) return;
      setLoading(true);
      try {
        const listParams = { ...params, page: nextPage, pageSize: PAGE_SIZE };
        const [list, sum] = await Promise.all([
          allStores ? api.allSales(listParams) : api.sales(storeId, listParams),
          nextPage === 1
            ? allStores
              ? api.allSalesSummary(params)
              : api.salesSummary(storeId, params)
            : Promise.resolve(null),
        ]);
        setSales((prev) => (nextPage === 1 ? list.items : [...prev, ...list.items]));
        setTotal(list.total);
        setPage(nextPage);
        if (sum) setSummary(sum);
      } catch (e) {
        Alert.alert('Hata', e.message ?? 'Satışlar yüklenemedi.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [storeId, api, params, allStores]
  );

  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    load(1);
  }, [load]);
  // Satış ekranında yapılan yeni satışlar sekmeye dönünce görünsün
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) loadRef.current(1);
      focusedOnce.current = true;
    }, [])
  );

  const sections = useMemo(() => {
    const groups = new Map();
    sales.forEach((s) => {
      const key = new Date(s.createdAt).toDateString();
      if (!groups.has(key)) groups.set(key, { title: fmtDay(s.createdAt), total: 0, data: [] });
      const g = groups.get(key);
      g.data.push(s);
      g.total += s.totalAmount;
    });
    return [...groups.values()];
  }, [sales]);

  const renderSale = ({ item }) => (
    <TouchableOpacity onPress={() => setSelected(item)} style={[styles.row, { backgroundColor: colors.card }]}>
      <View style={[styles.payIcon, { backgroundColor: item.paymentMethod === 1 ? '#DBEAFE' : '#D1FAE5' }]}>
        <Icon
          name={item.paymentMethod === 1 ? 'credit-card' : 'money-bill-wave'}
          size={14}
          color={item.paymentMethod === 1 ? COLORS.info : COLORS.success}
        />
      </View>
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text body2 bold numberOfLines={1}>
          {item.items.map((i) => i.productName).join(', ')}
        </Text>
        <Text caption2 grayColor style={{ marginTop: 2 }}>
          {allStores && item.storeName ? `${item.storeName} · ` : ''}
          {fmtTime(item.createdAt)} · {item.itemCount} kalem · {PAYMENT_LABELS[item.paymentMethod]}
        </Text>
      </View>
      <Text body1 bold>
        {fmt(item.totalAmount)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <ScreenHeader
        title="Satışlar"
        showStore={false}
        right={<StoreSwitcher allowAll allSelected={allStores} onAllChange={setAllStores} />}
      />
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {RANGES.map((r) => (
            <Chip key={r.key} label={r.label} active={range === r.key} onPress={() => setRange(r.key)} />
          ))}
        </ScrollView>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(s) => s.id}
        renderItem={renderSale}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListHeaderComponent={
          summary && (
            <View style={{ marginTop: 12 }}>
              <View style={styles.statRow}>
                <StatCard label="Ciro" value={fmt(summary.totalAmount)} icon="chart-line" color={colors.primary} />
                <StatCard label="Satış" value={`${summary.saleCount} adet`} icon="receipt" />
              </View>
              <View style={styles.statRow}>
                <StatCard label="Nakit" value={fmt(summary.cashAmount)} icon="money-bill-wave" color={COLORS.success} />
                <StatCard label="Kart" value={fmt(summary.cardAmount)} icon="credit-card" color={COLORS.info} />
              </View>
              <Text caption1 grayColor style={{ marginTop: 8 }}>
                İçindeki KDV: {fmt(summary.vatAmount)}
              </Text>
              {allStores && summary.byStore?.length > 0 && (
                <View style={[styles.byStore, { backgroundColor: colors.card }]}>
                  <Text body2 bold style={{ marginBottom: 4 }}>
                    Şubelere göre
                  </Text>
                  {summary.byStore.map((b) => (
                    <TouchableOpacity
                      key={b.storeId}
                      onPress={() => {
                        selectStore(b.storeId);
                        setAllStores(false);
                      }}
                      style={{ marginTop: 10 }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text body2 style={{ flex: 1 }} numberOfLines={1}>
                          {b.storeName}
                        </Text>
                        <Text caption1 grayColor style={{ marginRight: 10 }}>
                          {b.saleCount} satış
                        </Text>
                        <Text body2 bold>
                          {fmt(b.totalAmount)}
                        </Text>
                      </View>
                      <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              backgroundColor: colors.primary,
                              width: `${summary.totalAmount > 0 ? (b.totalAmount / summary.totalAmount) * 100 : 0}%`,
                            },
                          ]}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text body2 bold>
              {section.title}
            </Text>
            <Text caption1 grayColor>
              {fmt(section.total)}
            </Text>
          </View>
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (!loading && sales.length < total) load(page + 1);
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(1);
            }}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} />
          ) : (
            <EmptyState icon="receipt" title="Satış yok" message="Seçilen tarih aralığında satış bulunmuyor." />
          )
        }
        ListFooterComponent={loading && sales.length > 0 ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}
      />

      <SaleDetailSheet sale={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

export function SaleDetailSheet({ sale, onClose }) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  return (
    <Sheet visible={!!sale} title="Satış Fişi" onClose={onClose}>
      {sale && (
        <>
          <Text caption1 grayColor style={{ marginTop: 4 }}>
            {sale.storeName ? `${sale.storeName} · ` : ''}
            {fmtDateTime(sale.createdAt)} · {PAYMENT_LABELS[sale.paymentMethod]}
          </Text>
          {sale.items.map((i, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                onClose();
                navigation.navigate('UrunDetay', { productId: i.productId });
              }}
              style={[styles.itemRow, { borderBottomColor: colors.border }]}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text body2 bold numberOfLines={2}>
                  {i.productName}
                </Text>
                <Text caption2 grayColor style={{ marginTop: 2 }}>
                  {i.barcode} · {fmtQty(i.quantity)} × {fmt(i.unitPrice)}
                </Text>
              </View>
              <Text body2 bold>
                {fmt(i.lineTotal)}
              </Text>
              <Icon name="chevron-right" size={10} color={BaseColor.grayColor} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ))}
          <View style={styles.totals}>
            <Text body2 grayColor>
              KDV (dahil)
            </Text>
            <Text body2 grayColor>
              {fmt(sale.vatAmount)}
            </Text>
          </View>
          <View style={styles.totals}>
            <Text title3 bold>
              Toplam
            </Text>
            <Text title3 bold>
              {fmt(sale.totalAmount)}
            </Text>
          </View>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  byStore: { borderRadius: 12, padding: 12, marginTop: 12 },
  barTrack: { height: 6, borderRadius: 3, marginTop: 6, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 18,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12 },
  payIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  totals: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
});
