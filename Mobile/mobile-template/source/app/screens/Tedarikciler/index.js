import { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BaseStyle, useTheme } from '@/config';
import { SafeAreaView, Text, Icon, Button } from '@/components';
import { useStore } from '@/context/StoreContext';
import { ScreenHeader, HeaderButton, SearchInput, EmptyState, Sheet, Field, COLORS } from '@/components/Retail';
import { fmt } from '@/components/Retail/format';

const EMPTY = { name: '', contactName: '', phone: '', email: '', taxNumber: '', address: '', note: '' };

export default function Tedarikciler() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { storeId, api, canManage } = useStore();

  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(null); // null | { id?, ...form }
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!storeId || !api) return;
    try {
      setItems(await api.suppliers(storeId, { q: query.trim() || undefined }));
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Tedarikçiler yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId, api, query]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const save = async () => {
    if (!editing.name.trim()) {
      Alert.alert('Eksik bilgi', 'Tedarikçi adı zorunlu.');
      return;
    }
    setSaving(true);
    try {
      const { id, purchaseCount: _count, purchaseTotal: _total, ...body } = editing;
      if (id) await api.updateSupplier(storeId, id, body);
      else await api.createSupplier(storeId, body);
      setEditing(null);
      load();
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const remove = () =>
    Alert.alert('Tedarikçiyi Kaldır', `${editing.name} listeden kaldırılsın mı? Geçmiş stok girişleri korunur.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Kaldır',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteSupplier(storeId, editing.id);
            setEditing(null);
            load();
          } catch (e) {
            Alert.alert('Hata', e.message);
          }
        },
      },
    ]);

  const set = (key) => (value) => setEditing((f) => ({ ...f, [key]: value }));

  const renderItem = ({ item }) => (
    <TouchableOpacity
      disabled={!canManage}
      onPress={() =>
        setEditing({ ...EMPTY, ...Object.fromEntries(Object.entries(item).map(([k, v]) => [k, v ?? ''])) })
      }
      style={[styles.row, { backgroundColor: colors.card }]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text body1 bold whiteColor>
          {item.name.slice(0, 1).toLocaleUpperCase('tr-TR')}
        </Text>
      </View>
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text body2 bold numberOfLines={1}>
          {item.name}
        </Text>
        <Text caption2 grayColor style={{ marginTop: 2 }} numberOfLines={1}>
          {[item.contactName, item.phone].filter(Boolean).join(' · ') || 'İletişim bilgisi yok'}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AlisGecmisi', { supplier: { id: item.id, name: item.name } })}
        >
          <Text caption1 style={{ marginTop: 4, color: colors.primary }}>
            {item.purchaseCount} alış · {fmt(item.purchaseTotal)}
          </Text>
        </TouchableOpacity>
      </View>
      {item.phone ? (
        <TouchableOpacity
          onPress={() => Linking.openURL(`tel:${item.phone.replace(/\s/g, '')}`)}
          style={styles.callButton}
        >
          <Icon name="phone" size={14} color={COLORS.success} />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <ScreenHeader
        title="Tedarikçiler"
        back
        right={canManage ? <HeaderButton icon="plus" label="Ekle" onPress={() => setEditing({ ...EMPTY })} /> : null}
      />
      <SearchInput value={query} onChangeText={setQuery} placeholder="Tedarikçi ara" />
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} />
          ) : (
            <EmptyState
              icon="truck"
              title="Tedarikçi yok"
              message={canManage ? 'Ürün aldığınız firmaları ekleyin; stok girişinde seçebilirsiniz.' : undefined}
            />
          )
        }
      />

      <Sheet
        visible={!!editing}
        title={editing?.id ? 'Tedarikçiyi Düzenle' : 'Yeni Tedarikçi'}
        onClose={() => setEditing(null)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {editing?.id ? (
              <Button outline style={{ flex: 1 }} onPress={remove}>
                Kaldır
              </Button>
            ) : null}
            <Button style={{ flex: 2 }} onPress={save} loading={saving} disabled={saving}>
              Kaydet
            </Button>
          </View>
        }
      >
        {editing && (
          <>
            <Field
              label="Firma adı *"
              value={editing.name}
              onChangeText={set('name')}
              placeholder="Örn. Anadolu Gıda Toptan"
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Field
                style={{ flex: 1 }}
                label="Yetkili"
                value={editing.contactName}
                onChangeText={set('contactName')}
                placeholder="Ad soyad"
              />
              <Field
                style={{ flex: 1 }}
                label="Telefon"
                value={editing.phone}
                onChangeText={set('phone')}
                keyboardType="phone-pad"
                placeholder="05xx"
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Field
                style={{ flex: 1 }}
                label="E-posta"
                value={editing.email}
                onChangeText={set('email')}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="ornek@firma.com"
              />
              <Field
                style={{ flex: 1 }}
                label="Vergi no"
                value={editing.taxNumber}
                onChangeText={set('taxNumber')}
                keyboardType="number-pad"
                placeholder="VKN / TCKN"
              />
            </View>
            <Field label="Adres" value={editing.address} onChangeText={set('address')} placeholder="Adres" />
            <Field
              label="Not"
              value={editing.note}
              onChangeText={set('note')}
              placeholder="Ödeme vadesi, teslim günü vb."
            />
          </>
        )}
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
  },
});
