import { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { BaseStyle, BaseColor, useTheme } from '@/config';
import { SafeAreaView, Text, Icon, Button } from '@/components';
import { useStore } from '@/context/StoreContext';
import { ScreenHeader, ProductThumb, StatCard, Chip, Sheet, Field, COLORS, stockColor } from '@/components/Retail';
import { fmt, fmtQty, fmtDateTime, parseAmount, toInput, MOVEMENT_LABELS } from '@/components/Retail/format';

const ADJUST_TYPES = [
  {
    type: 4,
    label: 'Sayım',
    icon: 'clipboard-check',
    hint: 'Raftaki gerçek miktarı girin; fark stok hareketi olarak kaydedilir.',
  },
  { type: 5, label: 'Fire', icon: 'trash-alt', hint: 'Bozulan, kırılan veya kaybolan miktar stoktan düşülür.' },
  { type: 3, label: 'İade', icon: 'undo', hint: 'Müşteriden geri alınan miktar stoğa eklenir.' },
];

export default function UrunDetay() {
  const { colors } = useTheme();
  const { productId } = useRoute().params;
  const { storeId, api, canManage, stores, selectStore } = useStore();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('prices');
  const [editVisible, setEditVisible] = useState(false);
  const [adjustVisible, setAdjustVisible] = useState(false);
  const [branches, setBranches] = useState(null);
  const multiStore = stores.length > 1;

  const load = useCallback(async () => {
    try {
      const [detail, perStore] = await Promise.all([
        api.productDetail(storeId, productId),
        multiStore ? api.productBranches(productId) : Promise.resolve(null),
      ]);
      setData(detail);
      setBranches(perStore);
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Ürün yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, storeId, productId, multiStore]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
        <ScreenHeader title="Ürün" back />
        {loading ? <ActivityIndicator style={{ marginTop: 40 }} /> : null}
      </SafeAreaView>
    );
  }

  const p = data.product;
  const margin = p.salePrice && p.purchasePrice ? ((p.salePrice - p.purchasePrice) / p.salePrice) * 100 : null;

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <ScreenHeader title="Ürün Detayı" back />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        <View style={[styles.card, { backgroundColor: colors.card, flexDirection: 'row' }]}>
          <ProductThumb uri={p.imageUrl} size={96} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text title3 bold>
              {p.name}
            </Text>
            {p.brand ? (
              <Text body2 grayColor style={{ marginTop: 2 }}>
                {p.brand}
              </Text>
            ) : null}
            <View style={styles.metaRow}>
              <Icon name="barcode" size={12} color={BaseColor.grayColor} />
              <Text caption1 grayColor style={{ marginLeft: 6 }}>
                {p.barcode}
              </Text>
            </View>
            {p.category || p.quantity ? (
              <Text caption1 grayColor style={{ marginTop: 4 }}>
                {[p.category, p.quantity].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.statRow}>
          <StatCard label="Satış fiyatı" value={p.salePrice != null ? fmt(p.salePrice) : '—'} icon="tag" />
          <StatCard label="Alış fiyatı" value={p.purchasePrice != null ? fmt(p.purchasePrice) : '—'} icon="truck" />
        </View>
        <View style={styles.statRow}>
          <StatCard label="Stok" value={fmtQty(p.stockQuantity)} icon="boxes" color={stockColor(p)} />
          <StatCard
            label="Kâr marjı"
            value={margin != null ? `%${margin.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}` : '—'}
            icon="percentage"
            color={margin == null ? undefined : margin >= 0 ? COLORS.success : COLORS.danger}
          />
        </View>
        <View style={styles.statRow}>
          <StatCard label="KDV" value={`%${fmtQty(p.vatRate)}`} icon="receipt" />
          <StatCard label="Min. stok" value={p.minStockLevel != null ? fmtQty(p.minStockLevel) : '—'} icon="bell" />
        </View>
        <View style={styles.statRow}>
          <StatCard
            label={`Son ${data.sales.days} gün satış`}
            value={`${fmtQty(data.sales.quantity)} adet`}
            icon="shopping-basket"
          />
          <StatCard label={`Son ${data.sales.days} gün ciro`} value={fmt(data.sales.revenue)} icon="chart-line" />
        </View>

        {branches && (
          <View style={[styles.card, { backgroundColor: colors.card, marginTop: 10 }]}>
            <View style={styles.branchHeader}>
              <Text body2 bold style={{ flex: 1 }}>
                Şubelere göre
              </Text>
              <Text caption1 grayColor>
                Toplam stok {fmtQty(branches.reduce((sum, b) => sum + b.stockQuantity, 0))}
              </Text>
            </View>
            {branches.map((b) => {
              const current = b.storeId === storeId;
              return (
                <TouchableOpacity
                  key={b.storeId}
                  disabled={current}
                  onPress={() => selectStore(b.storeId)}
                  style={[styles.branchRow, { borderTopColor: colors.border }]}
                >
                  <Icon name="store" size={12} color={current ? colors.primary : BaseColor.grayColor} />
                  <Text body2 bold={current} style={{ flex: 1, marginLeft: 8 }} numberOfLines={1}>
                    {b.storeName}
                    {current ? '  ·  aktif' : ''}
                  </Text>
                  <Text body2 style={{ width: 90, textAlign: 'right' }}>
                    {b.salePrice != null ? fmt(b.salePrice) : '—'}
                  </Text>
                  <Text body2 bold style={{ width: 64, textAlign: 'right', color: stockColor(b) }}>
                    {fmtQty(b.stockQuantity)}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <Text caption2 grayColor style={{ marginTop: 8 }}>
              Bir şubeye dokunarak o şubenin fiyat ve stoğunu yönetebilirsiniz.
            </Text>
          </View>
        )}

        {canManage && (
          <View style={[styles.statRow, { marginTop: 16 }]}>
            <Button outline style={{ flex: 1 }} onPress={() => setAdjustVisible(true)}>
              Stok Düzelt
            </Button>
            <Button style={{ flex: 1 }} onPress={() => setEditVisible(true)}>
              Fiyat & Ayarlar
            </Button>
          </View>
        )}

        <View style={[styles.statRow, { marginTop: 20 }]}>
          <Chip label="Fiyat geçmişi" icon="history" active={tab === 'prices'} onPress={() => setTab('prices')} />
          <Chip label="Stok hareketleri" icon="exchange-alt" active={tab === 'stock'} onPress={() => setTab('stock')} />
        </View>

        {tab === 'prices' ? (
          data.priceHistory.length === 0 ? (
            <Text body2 grayColor style={styles.emptyText}>
              Henüz fiyat değişikliği yok.
            </Text>
          ) : (
            data.priceHistory.map((h, i) => (
              <View key={i} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.badge, { backgroundColor: h.type === 1 ? '#DBEAFE' : '#FEF3C7' }]}>
                  <Text caption2 bold style={{ color: h.type === 1 ? COLORS.info : '#B45309' }}>
                    {h.type === 1 ? 'SATIŞ' : 'ALIŞ'}
                  </Text>
                </View>
                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Text body2>
                    {h.oldPrice != null ? `${fmt(h.oldPrice)} → ` : ''}
                    <Text body2 bold>
                      {fmt(h.newPrice)}
                    </Text>
                  </Text>
                  <Text caption2 grayColor style={{ marginTop: 2 }}>
                    {fmtDateTime(h.changedAt)}
                    {h.note ? ` · ${h.note}` : ''}
                  </Text>
                </View>
                {h.oldPrice != null && (
                  <Icon
                    name={h.newPrice > h.oldPrice ? 'arrow-up' : 'arrow-down'}
                    size={12}
                    color={h.newPrice > h.oldPrice ? COLORS.danger : COLORS.success}
                  />
                )}
              </View>
            ))
          )
        ) : data.stockMovements.length === 0 ? (
          <Text body2 grayColor style={styles.emptyText}>
            Henüz stok hareketi yok.
          </Text>
        ) : (
          data.stockMovements.map((m, i) => (
            <View key={i} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
              <Icon
                name={m.quantity >= 0 ? 'arrow-circle-down' : 'arrow-circle-up'}
                size={20}
                color={m.quantity >= 0 ? COLORS.success : COLORS.danger}
              />
              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <Text body2 bold>
                  {MOVEMENT_LABELS[m.type] ?? 'Hareket'}
                </Text>
                <Text caption2 grayColor style={{ marginTop: 2 }}>
                  {fmtDateTime(m.createdAt)}
                  {m.unitPrice != null ? ` · ${fmt(m.unitPrice)}` : ''}
                  {m.note ? ` · ${m.note}` : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text body2 bold style={{ color: m.quantity >= 0 ? COLORS.success : COLORS.danger }}>
                  {m.quantity >= 0 ? '+' : ''}
                  {fmtQty(m.quantity)}
                </Text>
                <Text caption2 grayColor>
                  Kalan {fmtQty(m.balanceAfter)}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <EditSheet
        visible={editVisible}
        product={p}
        onClose={() => setEditVisible(false)}
        onSave={async (body) => {
          await api.updateProduct(storeId, productId, body);
          setEditVisible(false);
          load();
        }}
      />
      <AdjustSheet
        visible={adjustVisible}
        product={p}
        onClose={() => setAdjustVisible(false)}
        onSave={async (body) => {
          await api.adjustStock(storeId, productId, body);
          setAdjustVisible(false);
          load();
        }}
      />
    </SafeAreaView>
  );
}

function EditSheet({ visible, product, onClose, onSave }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setForm({
      salePrice: toInput(product.salePrice),
      purchasePrice: toInput(product.purchasePrice),
      vatRate: String(product.vatRate ?? 20),
      minStockLevel: product.minStockLevel != null ? String(product.minStockLevel) : '',
    });
  }, [visible, product]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    const body = {
      salePrice: parseAmount(form.salePrice),
      purchasePrice: parseAmount(form.purchasePrice),
      vatRate: parseAmount(form.vatRate),
      minStockLevel: parseAmount(form.minStockLevel),
    };
    if (form.salePrice && body.salePrice == null) {
      Alert.alert('Hata', 'Satış fiyatı geçersiz.');
      return;
    }
    if (form.purchasePrice && body.purchasePrice == null) {
      Alert.alert('Hata', 'Alış fiyatı geçersiz.');
      return;
    }
    setSaving(true);
    try {
      await onSave(body);
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      title="Fiyat & Ayarlar"
      onClose={onClose}
      footer={
        <Button full onPress={save} loading={saving} disabled={saving}>
          Kaydet
        </Button>
      }
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Field
          style={{ flex: 1 }}
          label="Satış fiyatı (₺)"
          value={form.salePrice}
          onChangeText={set('salePrice')}
          keyboardType="decimal-pad"
          placeholder="0,00"
        />
        <Field
          style={{ flex: 1 }}
          label="Alış fiyatı (₺)"
          value={form.purchasePrice}
          onChangeText={set('purchasePrice')}
          keyboardType="decimal-pad"
          placeholder="0,00"
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Field
          style={{ flex: 1 }}
          label="KDV oranı (%)"
          value={form.vatRate}
          onChangeText={set('vatRate')}
          keyboardType="decimal-pad"
          placeholder="20"
        />
        <Field
          style={{ flex: 1 }}
          label="Minimum stok"
          value={form.minStockLevel}
          onChangeText={set('minStockLevel')}
          keyboardType="decimal-pad"
          placeholder="Uyarı seviyesi"
        />
      </View>
      <Text caption1 grayColor style={{ marginTop: 10 }}>
        Fiyat değişiklikleri fiyat geçmişine kaydedilir.
      </Text>
    </Sheet>
  );
}

function AdjustSheet({ visible, product, onClose, onSave }) {
  const { colors } = useTheme();
  const [type, setType] = useState(4);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setType(4);
      setAmount('');
      setNote('');
    }
  }, [visible]);

  const selected = ADJUST_TYPES.find((t) => t.type === type);
  const value = parseAmount(amount);
  const preview =
    value == null
      ? null
      : type === 4
      ? value
      : type === 5
      ? product.stockQuantity - value
      : product.stockQuantity + value;

  const save = async () => {
    if (value == null || value < 0 || (type !== 4 && value === 0)) {
      Alert.alert('Hata', 'Geçerli bir miktar girin.');
      return;
    }
    setSaving(true);
    try {
      await onSave(
        type === 4
          ? { type, countedQuantity: value, note: note.trim() || null }
          : { type, quantity: value, note: note.trim() || null }
      );
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      title="Stok Düzelt"
      onClose={onClose}
      footer={
        <Button full onPress={save} loading={saving} disabled={saving}>
          Kaydet
        </Button>
      }
    >
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        {ADJUST_TYPES.map((t) => (
          <Chip key={t.type} label={t.label} icon={t.icon} active={type === t.type} onPress={() => setType(t.type)} />
        ))}
      </View>
      <Text caption1 grayColor style={{ marginTop: 10 }}>
        {selected.hint}
      </Text>
      <Field
        label={type === 4 ? 'Sayılan miktar' : 'Miktar'}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0"
      />
      <Field label="Not (isteğe bağlı)" value={note} onChangeText={setNote} placeholder="Örn. Ay sonu sayımı" />
      <View style={[styles.previewBox, { backgroundColor: colors.card }]}>
        <Text body2 grayColor>
          Mevcut stok: {fmtQty(product.stockQuantity)}
        </Text>
        {preview != null && (
          <Text body2 bold>
            Yeni stok: {fmtQty(preview)}
          </Text>
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 14 },
  branchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  emptyText: { textAlign: 'center', marginTop: 24 },
  previewBox: { flexDirection: 'row', justifyContent: 'space-between', borderRadius: 10, padding: 12, marginTop: 14 },
});
