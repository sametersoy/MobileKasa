import { useCallback, useEffect, useRef, useState } from 'react';
import { View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BaseStyle, useTheme } from '@/config';
import { SafeAreaView, Text } from '@/components';
import { useStore } from '@/context/StoreContext';
import {
  ScreenHeader,
  SearchInput,
  Chip,
  EmptyState,
  ProductThumb,
  BarcodeScanner,
  StoreSwitcher,
  stockColor,
} from '@/components/Retail';
import { fmt, fmtQty } from '@/components/Retail/format';

const PAGE_SIZE = 30;

// Tek şubede satış fiyatı; tüm şubeler görünümünde şubeler arası fiyat aralığı
const priceText = (item) => {
  if (item.minSalePrice === undefined) return item.salePrice != null ? fmt(item.salePrice) : '—';
  if (item.minSalePrice == null) return '—';
  return item.minSalePrice === item.maxSalePrice
    ? fmt(item.minSalePrice)
    : `${fmt(item.minSalePrice)} – ${fmt(item.maxSalePrice)}`;
};

export default function Urunler() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { storeId, api, stores } = useStore();

  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('store'); // 'store' | 'catalog'
  const [lowStock, setLowStock] = useState(false);
  const [allStores, setAllStores] = useState(false); // tüm şubelerin birleşik stoğu
  useEffect(() => {
    if (stores.length < 2) setAllStores(false);
  }, [stores.length]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(
    async (nextPage = 1) => {
      if (!storeId || !api) return;
      if (scope === 'catalog' && query.trim().length < 2) {
        setItems([]);
        setTotal(0);
        setPage(1);
        return;
      }
      const id = ++requestId.current;
      setLoading(true);
      try {
        const params = {
          q: query.trim() || undefined,
          lowStock: scope === 'store' && lowStock ? true : undefined,
          page: nextPage,
          pageSize: PAGE_SIZE,
        };
        const res =
          scope === 'store' && allStores
            ? await api.allProducts(params)
            : await api.products(storeId, { ...params, scope });
        if (id !== requestId.current) return; // daha yeni bir arama başladıysa sonucu yok say
        setItems((prev) => (nextPage === 1 ? res.items : [...prev, ...res.items]));
        setTotal(res.total);
        setPage(nextPage);
      } catch (e) {
        if (id === requestId.current) Alert.alert('Hata', e.message ?? 'Ürünler yüklenemedi.');
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [storeId, api, query, scope, lowStock, allStores]
  );

  // Yazarken her tuşta değil, kısa bir duraksamadan sonra ara
  useEffect(() => {
    const timer = setTimeout(() => load(1), 300);
    return () => clearTimeout(timer);
  }, [load]);

  // Detaydan dönünce fiyat/stok değişmiş olabilir; ilk odaklanmada yukarıdaki arama zaten yükler
  const loadRef = useRef(load);
  loadRef.current = load;
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) loadRef.current(1);
      focusedOnce.current = true;
    }, [])
  );

  const handleScanned = async (barcode) => {
    setScannerVisible(false);
    try {
      const product = await api.byBarcode(storeId, barcode);
      navigation.navigate('UrunDetay', { productId: product.productId });
    } catch (e) {
      Alert.alert(
        e.status === 404 ? 'Bulunamadı' : 'Hata',
        e.status === 404 ? `${barcode} barkodlu ürün katalogda yok. Satış ekranından ekleyebilirsiniz.` : e.message
      );
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('UrunDetay', { productId: item.productId })}
      style={[styles.row, { backgroundColor: colors.card }]}
    >
      <ProductThumb uri={item.imageUrl} />
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text body2 bold numberOfLines={2}>
          {item.name}
        </Text>
        <Text caption2 grayColor style={{ marginTop: 2 }} numberOfLines={1}>
          {[item.brand, item.barcode, item.storeCount ? `${item.storeCount} şube` : null].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text body1 bold>
          {priceText(item)}
        </Text>
        <Text caption1 bold style={{ marginTop: 4, color: stockColor(item) }}>
          Stok {fmtQty(item.stockQuantity)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const emptyText =
    scope === 'catalog'
      ? {
          icon: 'search',
          title: query.trim().length < 2 ? 'Katalogda ara' : 'Sonuç yok',
          message:
            query.trim().length < 2
              ? 'Ürün adı, marka ya da barkod yazın (en az 2 karakter).'
              : 'Aramanızı değiştirip tekrar deneyin.',
        }
      : {
          icon: 'boxes',
          title: query || lowStock ? 'Sonuç yok' : allStores ? 'Şubelerinizde ürün yok' : 'Mağazanızda ürün yok',
          message:
            query || lowStock
              ? undefined
              : 'Satış yaptığınız veya stok girdiğiniz ürünler burada listelenir. Tüm kataloğa "Katalog" sekmesinden bakabilirsiniz.',
        };

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <ScreenHeader
        title="Ürünler"
        showStore={false}
        right={<StoreSwitcher allowAll allSelected={allStores} onAllChange={setAllStores} />}
      />
      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder="Ürün adı, marka veya barkod"
        onScan={() => setScannerVisible(true)}
      />
      <View style={styles.filters}>
        <Chip
          label={allStores ? 'Şubelerim' : 'Mağazam'}
          active={scope === 'store'}
          onPress={() => setScope('store')}
          icon={allStores ? 'layer-group' : 'store'}
        />
        <Chip label="Katalog" active={scope === 'catalog'} onPress={() => setScope('catalog')} icon="book" />
        {scope === 'store' && (
          <Chip
            label="Düşük stok"
            active={lowStock}
            onPress={() => setLowStock((v) => !v)}
            icon="exclamation-triangle"
          />
        )}
      </View>
      {total > 0 && (
        <Text caption1 grayColor style={styles.count}>
          {total.toLocaleString('tr-TR')} ürün
        </Text>
      )}

      <FlatList
        data={items}
        keyExtractor={(i) => i.productId}
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
        ListEmptyComponent={loading ? <ActivityIndicator style={{ marginTop: 40 }} /> : <EmptyState {...emptyText} />}
        ListFooterComponent={loading && items.length > 0 ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}
        keyboardShouldPersistTaps="handled"
      />

      <BarcodeScanner visible={scannerVisible} onClose={() => setScannerVisible(false)} onScanned={handleScanned} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  count: { paddingHorizontal: 20, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 10 },
});
