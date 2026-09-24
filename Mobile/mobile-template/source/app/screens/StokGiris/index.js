import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  TextInput as RNTextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BaseStyle, BaseColor, useTheme } from '@/config';
import { SafeAreaView, Text, Icon, Button } from '@/components';
import { useStore } from '@/context/StoreContext';
import {
  ScreenHeader,
  HeaderButton,
  EmptyState,
  ProductThumb,
  BarcodeScanner,
  Sheet,
  SearchInput,
  Field,
  COLORS,
} from '@/components/Retail';
import { fmt, fmtQty, parseAmount, toInput } from '@/components/Retail/format';

const toLine = (p) => ({
  productId: p.productId,
  name: p.name,
  barcode: p.barcode,
  imageUrl: p.imageUrl,
  currentStock: p.stockQuantity,
  quantity: '1',
  unitCost: toInput(p.purchasePrice),
  salePrice: toInput(p.salePrice),
  originalSalePrice: p.salePrice,
});

export default function StokGiris() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { store, storeId, api, canManage } = useStore();

  const [lines, setLines] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [documentNo, setDocumentNo] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [supplierSheet, setSupplierSheet] = useState(false);
  const [searchSheet, setSearchSheet] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [newProduct, setNewProduct] = useState(null); // { barcode, name }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLines([]);
    setSupplier(null);
    setDocumentNo('');
  }, [storeId]);

  // Tedarikçiler ekranında yapılan değişiklikler geri dönünce görünsün
  useFocusEffect(
    useCallback(() => {
      if (storeId && api)
        api
          .suppliers(storeId)
          .then(setSuppliers)
          .catch(() => {});
    }, [storeId, api])
  );

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + (parseAmount(l.quantity) ?? 0) * (parseAmount(l.unitCost) ?? 0), 0),
    [lines]
  );

  const addProduct = (product) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === product.productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === product.productId
            ? { ...l, quantity: String((parseAmount(l.quantity) ?? 0) + 1).replace('.', ',') }
            : l
        );
      }
      return [toLine(product), ...prev];
    });
  };

  const updateLine = (productId, key, value) =>
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, [key]: value } : l)));

  const removeLine = (productId) => setLines((prev) => prev.filter((l) => l.productId !== productId));

  const handleScanned = async (barcode) => {
    setScannerVisible(false);
    try {
      addProduct(await api.byBarcode(storeId, barcode));
    } catch (e) {
      if (e.status === 404) setTimeout(() => setNewProduct({ barcode, name: '' }), 400);
      else Alert.alert('Hata', e.message);
    }
  };

  const createProduct = async () => {
    if (newProduct.name.trim().length < 2) {
      Alert.alert('Hata', 'Ürün adını girin.');
      return;
    }
    try {
      const product = await api.createProduct(storeId, { barcode: newProduct.barcode, name: newProduct.name.trim() });
      addProduct(product);
      setNewProduct(null);
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Ürün eklenemedi.');
    }
  };

  const save = async () => {
    const items = [];
    for (const l of lines) {
      const quantity = parseAmount(l.quantity);
      const unitCost = parseAmount(l.unitCost);
      const salePrice = l.salePrice ? parseAmount(l.salePrice) : null;
      if (!quantity || quantity <= 0) {
        Alert.alert('Eksik bilgi', `${l.name}: miktar girin.`);
        return;
      }
      if (unitCost == null) {
        Alert.alert('Eksik bilgi', `${l.name}: alış fiyatı girin.`);
        return;
      }
      if (l.salePrice && salePrice == null) {
        Alert.alert('Hata', `${l.name}: satış fiyatı geçersiz.`);
        return;
      }
      items.push({
        productId: l.productId,
        quantity,
        unitCost,
        salePrice: salePrice === l.originalSalePrice ? null : salePrice,
      });
    }
    setSaving(true);
    try {
      const purchase = await api.createPurchase(storeId, {
        supplierId: supplier?.id ?? null,
        documentNo: documentNo.trim() || null,
        items,
      });
      setLines([]);
      setDocumentNo('');
      setSupplier(null);
      Alert.alert('Stok Girişi Kaydedildi', `${purchase.itemCount} kalem · ${fmt(purchase.totalAmount)}`);
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
        <ScreenHeader title="Stok Girişi" />
        <EmptyState
          icon="lock"
          title="Yetkiniz yok"
          message={`Stok girişini ${store?.name ?? 'şube'} sahibi veya yöneticisi yapabilir.`}
        />
      </SafeAreaView>
    );
  }

  const renderLine = ({ item: l }) => {
    const qty = parseAmount(l.quantity) ?? 0;
    const cost = parseAmount(l.unitCost) ?? 0;
    return (
      <View style={[styles.line, { backgroundColor: colors.card }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ProductThumb uri={l.imageUrl} size={44} />
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text body2 bold numberOfLines={2}>
              {l.name}
            </Text>
            <Text caption2 grayColor>
              {l.barcode} · Mevcut stok {fmtQty(l.currentStock)}
            </Text>
          </View>
          <TouchableOpacity onPress={() => removeLine(l.productId)} style={{ padding: 6 }}>
            <Icon name="trash-alt" size={14} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
        <View style={styles.inputs}>
          <LineInput label="Miktar" value={l.quantity} onChangeText={(v) => updateLine(l.productId, 'quantity', v)} />
          <LineInput label="Alış ₺" value={l.unitCost} onChangeText={(v) => updateLine(l.productId, 'unitCost', v)} />
          <LineInput
            label="Satış ₺"
            value={l.salePrice}
            onChangeText={(v) => updateLine(l.productId, 'salePrice', v)}
          />
        </View>
        <Text caption1 bold style={{ textAlign: 'right', marginTop: 6 }}>
          {fmt(qty * cost)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <ScreenHeader
        title="Stok Girişi"
        right={<HeaderButton icon="history" label="Geçmiş" onPress={() => navigation.navigate('AlisGecmisi')} />}
      />

      <View style={styles.meta}>
        <TouchableOpacity
          onPress={() => setSupplierSheet(true)}
          style={[styles.metaBox, { backgroundColor: colors.card, flex: 1.3 }]}
        >
          <Icon name="truck" size={13} color={colors.primary} />
          <Text body2 numberOfLines={1} style={{ flex: 1, marginLeft: 8 }}>
            {supplier?.name ?? 'Tedarikçi seç'}
          </Text>
          <Icon name="chevron-down" size={10} color={BaseColor.grayColor} />
        </TouchableOpacity>
        <View style={[styles.metaBox, { backgroundColor: colors.card, flex: 1 }]}>
          <Icon name="file-alt" size={13} color={colors.primary} />
          <RNTextInput
            value={documentNo}
            onChangeText={setDocumentNo}
            placeholder="İrsaliye / fatura no"
            placeholderTextColor={BaseColor.grayColor}
            style={[styles.metaInput, { color: colors.text }]}
          />
        </View>
      </View>

      <View style={styles.addRow}>
        <Button style={{ flex: 1 }} onPress={() => setScannerVisible(true)}>
          Barkod Okut
        </Button>
        <Button outline style={{ flex: 1 }} onPress={() => setSearchSheet(true)}>
          Ürün Ara
        </Button>
      </View>

      <FlatList
        data={lines}
        keyExtractor={(l) => l.productId}
        renderItem={renderLine}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: lines.length ? 140 : 24, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon="dolly"
            title="Gelen ürünleri ekleyin"
            message="Tedarikçiden gelen ürünlerin barkodunu okutun, miktar ve alış fiyatını girin. Kaydettiğinizde stok artar ve fiyat geçmişi güncellenir."
          />
        }
      />

      {lines.length > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <View style={styles.totalRow}>
            <Text body2 grayColor>
              {lines.length} kalem
            </Text>
            <Text title2 bold>
              {fmt(total)}
            </Text>
          </View>
          <Button full onPress={save} loading={saving} disabled={saving}>
            Stok Girişini Kaydet
          </Button>
        </View>
      )}

      <BarcodeScanner visible={scannerVisible} onClose={() => setScannerVisible(false)} onScanned={handleScanned} />

      <Sheet visible={supplierSheet} title="Tedarikçi" onClose={() => setSupplierSheet(false)}>
        <TouchableOpacity
          onPress={() => {
            setSupplier(null);
            setSupplierSheet(false);
          }}
          style={[styles.option, { borderColor: colors.border }]}
        >
          <Text body1 grayColor>
            Tedarikçisiz
          </Text>
        </TouchableOpacity>
        {suppliers.map((s) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => {
              setSupplier(s);
              setSupplierSheet(false);
            }}
            style={[styles.option, { borderColor: supplier?.id === s.id ? colors.primary : colors.border }]}
          >
            <Text body1 bold>
              {s.name}
            </Text>
            {s.contactName || s.phone ? (
              <Text caption1 grayColor>
                {[s.contactName, s.phone].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
        <Button
          outline
          style={{ marginTop: 14 }}
          onPress={() => {
            setSupplierSheet(false);
            navigation.navigate('Tedarikciler');
          }}
        >
          Tedarikçileri Yönet
        </Button>
      </Sheet>

      <ProductSearchSheet
        visible={searchSheet}
        onClose={() => setSearchSheet(false)}
        onSelect={(p) => {
          addProduct(p);
          setSearchSheet(false);
        }}
      />

      <Sheet
        visible={!!newProduct}
        title="Katalogda yok"
        onClose={() => setNewProduct(null)}
        footer={
          <Button full onPress={createProduct}>
            Ürünü Oluştur ve Ekle
          </Button>
        }
      >
        <Text body2 grayColor style={{ marginTop: 6 }}>
          {newProduct?.barcode} barkodu katalogda bulunamadı.
        </Text>
        <Field
          label="Ürün adı"
          value={newProduct?.name ?? ''}
          onChangeText={(name) => setNewProduct((p) => ({ ...p, name }))}
          placeholder="Örn. Eti Burçak 131 g"
        />
      </Sheet>
    </SafeAreaView>
  );
}

function LineInput({ label, value, onChangeText }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text caption2 grayColor style={{ marginBottom: 4 }}>
        {label}
      </Text>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={BaseColor.grayColor}
        style={[styles.lineInput, { backgroundColor: colors.background, color: colors.text }]}
      />
    </View>
  );
}

// Katalogda ada/markaya/barkoda göre arayıp ürün seçer
export function ProductSearchSheet({ visible, onClose, onSelect }) {
  const { colors } = useTheme();
  const { storeId, api } = useStore();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setItems([]);
    }
  }, [visible]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setItems([]);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.products(storeId, { q: query.trim(), scope: 'catalog', pageSize: 20 });
        if (!cancelled) setItems(res.items);
      } catch (e) {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, api, storeId]);

  return (
    <Sheet visible={visible} title="Ürün Ara" onClose={onClose}>
      <View style={{ marginHorizontal: -16, marginTop: 8 }}>
        <SearchInput value={query} onChangeText={setQuery} placeholder="Ürün adı, marka veya barkod" />
      </View>
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
      {!loading && query.trim().length >= 2 && items.length === 0 && (
        <Text body2 grayColor style={{ textAlign: 'center', marginTop: 16 }}>
          Sonuç yok.
        </Text>
      )}
      {items.map((p) => (
        <TouchableOpacity
          key={p.productId}
          onPress={() => onSelect(p)}
          style={[styles.searchRow, { borderBottomColor: colors.border }]}
        >
          <ProductThumb uri={p.imageUrl} size={40} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text body2 bold numberOfLines={1}>
              {p.name}
            </Text>
            <Text caption2 grayColor>
              {[p.brand, p.barcode].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <Text caption1 bold>
            {p.salePrice != null ? fmt(p.salePrice) : ''}
          </Text>
        </TouchableOpacity>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  metaBox: { flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 10, paddingHorizontal: 12 },
  metaInput: { flex: 1, marginLeft: 8, fontSize: 14, paddingVertical: 0 },
  addRow: { flexDirection: 'row', gap: 10, padding: 16 },
  line: { borderRadius: 12, padding: 12 },
  inputs: { flexDirection: 'row', gap: 8, marginTop: 10 },
  lineInput: { height: 40, borderRadius: 8, paddingHorizontal: 10, fontSize: 15, fontWeight: '600' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  option: { padding: 14, borderRadius: 12, borderWidth: 1.5, marginTop: 10 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
