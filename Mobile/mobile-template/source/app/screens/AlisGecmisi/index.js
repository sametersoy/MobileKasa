import { useCallback, useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BaseStyle, BaseColor, useTheme } from '@/config';
import { SafeAreaView, Text, Icon } from '@/components';
import { useStore } from '@/context/StoreContext';
import { ScreenHeader, EmptyState, Sheet } from '@/components/Retail';
import { fmt, fmtQty, fmtDateTime } from '@/components/Retail/format';

const PAGE_SIZE = 30;

// Stok girişi (mal kabul) geçmişi; route.params.supplier verilirse o tedarikçiye filtreler
export default function AlisGecmisi() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const supplier = useRoute().params?.supplier;
  const { storeId, api } = useStore();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(
    async (nextPage = 1) => {
      if (!storeId || !api) return;
      setLoading(true);
      try {
        const res = await api.purchases(storeId, { supplierId: supplier?.id, page: nextPage, pageSize: PAGE_SIZE });
        setItems((prev) => (nextPage === 1 ? res.items : [...prev, ...res.items]));
        setTotal(res.total);
        setPage(nextPage);
      } catch (e) {
        Alert.alert('Hata', e.message ?? 'Stok girişleri yüklenemedi.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [storeId, api, supplier?.id]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => setSelected(item)} style={[styles.row, { backgroundColor: colors.card }]}>
      <View style={[styles.icon, { backgroundColor: '#FEF3C7' }]}>
        <Icon name="dolly" size={14} color="#B45309" />
      </View>
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text body2 bold numberOfLines={1}>
          {item.supplierName ?? 'Tedarikçisiz'}
        </Text>
        <Text caption2 grayColor style={{ marginTop: 2 }} numberOfLines={1}>
          {fmtDateTime(item.createdAt)} · {item.itemCount} kalem{item.documentNo ? ` · ${item.documentNo}` : ''}
        </Text>
      </View>
      <Text body1 bold>
        {fmt(item.totalAmount)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <ScreenHeader title="Stok Girişleri" subtitle={supplier?.name} back />
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (!loading && items.length < total) load(page + 1);
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
            <EmptyState
              icon="dolly"
              title="Stok girişi yok"
              message="Stok Girişi ekranından kaydettiğiniz alışlar burada listelenir."
            />
          )
        }
      />

      <Sheet visible={!!selected} title="Stok Girişi" onClose={() => setSelected(null)}>
        {selected && (
          <>
            <Text body2 bold style={{ marginTop: 4 }}>
              {selected.supplierName ?? 'Tedarikçisiz'}
            </Text>
            <Text caption1 grayColor style={{ marginTop: 2 }}>
              {fmtDateTime(selected.createdAt)}
              {selected.documentNo ? ` · Belge: ${selected.documentNo}` : ''}
            </Text>
            {selected.items.map((i, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  setSelected(null);
                  navigation.navigate('UrunDetay', { productId: i.productId });
                }}
                style={[styles.itemRow, { borderBottomColor: colors.border }]}
              >
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text body2 bold numberOfLines={2}>
                    {i.productName}
                  </Text>
                  <Text caption2 grayColor style={{ marginTop: 2 }}>
                    {i.barcode} · {fmtQty(i.quantity)} × {fmt(i.unitCost)}
                  </Text>
                </View>
                <Text body2 bold>
                  {fmt(i.lineTotal)}
                </Text>
                <Icon name="chevron-right" size={10} color={BaseColor.grayColor} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            ))}
            <View style={styles.totals}>
              <Text title3 bold>
                Toplam
              </Text>
              <Text title3 bold>
                {fmt(selected.totalAmount)}
              </Text>
            </View>
          </>
        )}
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  totals: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
});
