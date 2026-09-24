import { useEffect, useMemo, useState } from 'react';
import { View, FlatList, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { BaseColor, BaseStyle, useTheme } from '@/config';
import { SafeAreaView, Text, Icon, Button } from '@/components';
import { useStore } from '@/context/StoreContext';
import { BarcodeScanner, ProductThumb, StoreSwitcher } from '@/components/Retail';
import { fmt } from '@/components/Retail/format';
import ProductSheet from './ProductSheet';

const PAYMENT_METHODS = [
  { value: 0, label: 'Nakit', icon: 'money-bill-wave' },
  { value: 1, label: 'Kart', icon: 'credit-card' },
];

export default function Satis() {
  const { colors } = useTheme();
  const { store, api } = useStore();

  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(0);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [lookup, setLookup] = useState(null); // { barcode, product | null }
  const [looking, setLooking] = useState(false);
  const [saving, setSaving] = useState(false);

  // Şube değişince sepet o şubenin fiyat/stoğuna ait olmadığı için temizlenir
  useEffect(() => {
    setCart([]);
  }, [store?.id]);

  const total = useMemo(() => cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [cart]);
  const itemCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);

  const handleScanned = async (barcode) => {
    setScannerVisible(false);
    if (!store) return;
    setLooking(true);
    // Tarayıcı modalının kapanma animasyonu bitmeden ikinci modal açılırsa iOS onu göstermiyor
    const modalClosed = new Promise((resolve) => setTimeout(resolve, 400));
    try {
      const product = await api.byBarcode(store.id, barcode);
      await modalClosed;
      setLookup({ barcode, product });
    } catch (e) {
      await modalClosed;
      if (e.status === 404) setLookup({ barcode, product: null });
      else Alert.alert('Hata', e.message ?? 'Ürün sorgulanamadı.');
    } finally {
      setLooking(false);
    }
  };

  const addToCart = ({ product, unitPrice, quantity }) => {
    setCart((items) => {
      const existing = items.find((i) => i.productId === product.productId);
      if (existing) {
        return items.map((i) =>
          i.productId === product.productId ? { ...i, unitPrice, quantity: i.quantity + quantity } : i
        );
      }
      return [{ ...product, unitPrice, quantity }, ...items];
    });
    setLookup(null);
  };

  const createAndAdd = async ({ barcode, name, salePrice, quantity }) => {
    setSaving(true);
    try {
      const product = await api.createProduct(store.id, { barcode, name, salePrice });
      addToCart({ product, unitPrice: salePrice, quantity });
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Ürün eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const changeQuantity = (productId, delta) =>
    setCart((items) =>
      items
        .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );

  const clearCart = () =>
    Alert.alert('Sepeti Temizle', 'Sepetteki tüm ürünler silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Temizle', style: 'destructive', onPress: () => setCart([]) },
    ]);

  const completeSale = async () => {
    if (cart.length === 0 || !store) return;
    setSaving(true);
    try {
      const sale = await api.createSale(store.id, {
        paymentMethod,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
      });
      setCart([]);
      setPaymentMethod(0);
      Alert.alert(
        'Satış Tamamlandı',
        `${sale.items.length} kalem · ${fmt(sale.totalAmount)}\nKDV: ${fmt(sale.vatAmount)} · ${
          PAYMENT_METHODS[sale.paymentMethod].label
        }`
      );
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Satış kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const confirmSale = () =>
    Alert.alert('Satışı Onayla', `${itemCount} ürün · ${fmt(total)} · ${PAYMENT_METHODS[paymentMethod].label}`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Onayla', onPress: completeSale },
    ]);

  const renderItem = ({ item }) => (
    <View style={[styles.item, { backgroundColor: colors.card }]}>
      <ProductThumb uri={item.imageUrl} />
      <View style={{ flex: 1, marginHorizontal: 10 }}>
        <Text body2 bold numberOfLines={2}>
          {item.name}
        </Text>
        <Text caption2 grayColor style={{ marginTop: 2 }}>
          {item.barcode}
        </Text>
        <Text caption1 style={{ marginTop: 4 }}>
          {fmt(item.unitPrice)} × {item.quantity}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text body1 bold>
          {fmt(item.unitPrice * item.quantity)}
        </Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            onPress={() => changeQuantity(item.productId, -1)}
            style={[styles.qtyButton, { borderColor: colors.border }]}
          >
            <Icon
              name={item.quantity === 1 ? 'trash-alt' : 'minus'}
              size={12}
              color={item.quantity === 1 ? '#EF4444' : colors.text}
            />
          </TouchableOpacity>
          <Text body2 bold style={{ minWidth: 26, textAlign: 'center' }}>
            {item.quantity}
          </Text>
          <TouchableOpacity
            onPress={() => changeQuantity(item.productId, 1)}
            style={[styles.qtyButton, { borderColor: colors.border }]}
          >
            <Icon name="plus" size={12} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <View style={styles.header}>
        <Text header bold style={{ flex: 1 }}>
          Satış
        </Text>
        {cart.length > 0 ? (
          <TouchableOpacity onPress={clearCart} style={styles.headerAction}>
            <Icon name="trash-alt" size={16} color="#EF4444" />
            <Text caption1 style={{ color: '#EF4444', marginLeft: 6 }}>
              Temizle
            </Text>
          </TouchableOpacity>
        ) : (
          <StoreSwitcher />
        )}
      </View>

      <FlatList
        data={cart}
        keyExtractor={(i) => i.productId}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: cart.length ? 270 : 120, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={[styles.center, { flex: 1, paddingHorizontal: 40 }]}>
            <Icon name="barcode" size={56} color={BaseColor.grayColor} />
            <Text title3 bold style={{ marginTop: 16 }}>
              Sepet boş
            </Text>
            <Text body2 grayColor style={{ marginTop: 6, textAlign: 'center' }}>
              Ürün eklemek için + düğmesine basıp barkodu okutun.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        onPress={() => setScannerVisible(true)}
        disabled={!store || looking}
        style={[styles.fab, { backgroundColor: colors.primary, bottom: cart.length ? 176 : 24 }]}
      >
        {looking ? <ActivityIndicator color="#fff" /> : <Icon name="plus" size={26} color="#fff" />}
      </TouchableOpacity>

      {cart.length > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <View style={styles.totalRow}>
            <Text body2 grayColor>
              {itemCount} ürün
            </Text>
            <Text title2 bold>
              {fmt(total)}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            {PAYMENT_METHODS.map((m) => {
              const active = m.value === paymentMethod;
              return (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => setPaymentMethod(m.value)}
                  style={[
                    styles.paymentOption,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                    },
                  ]}
                >
                  <Icon name={m.icon} size={14} color={active ? '#fff' : colors.text} />
                  <Text body2 bold style={{ marginLeft: 8, color: active ? '#fff' : colors.text }}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Button full onPress={confirmSale} loading={saving} disabled={saving}>
            Satışı Onayla
          </Button>
        </View>
      )}

      <BarcodeScanner visible={scannerVisible} onClose={() => setScannerVisible(false)} onScanned={handleScanned} />
      <ProductSheet
        visible={!!lookup}
        barcode={lookup?.barcode}
        product={lookup?.product}
        saving={saving}
        onAdd={addToCart}
        onCreate={createAndAdd}
        onRescan={() => {
          setLookup(null);
          setScannerVisible(true);
        }}
        onClose={() => setLookup(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  headerAction: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  center: { alignItems: 'center', justifyContent: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 10 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  paymentRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 10,
  },
});
