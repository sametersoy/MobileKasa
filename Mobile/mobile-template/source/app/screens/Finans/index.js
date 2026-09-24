import { useCallback, useEffect, useState } from 'react';
import { FlatList, View, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { BaseColor, BaseStyle, useTheme } from '@/config';
import { SafeAreaView, Text, Icon, TextInput, Button, Transaction2Col } from '@/components';
import { webApi } from '@/api';

const today = () => new Date().toISOString().split('T')[0];
const fmt = (n) => '₺' + Number(n).toLocaleString('tr-TR');

const EMPTY = { type: 0, amount: '', category: '', description: '', date: today() };

export default function Finans() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const token = useSelector((s) => s.auth?.token);
  const selectedBuildingId = useSelector((s) => s.building?.selectedId);
  const buildingList = useSelector((s) => s.building?.list ?? []);
  const buildingId = selectedBuildingId;
  const buildingName = buildingList.find((b) => b.id === selectedBuildingId)?.name ?? '';

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'income' | 'expense'
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token || !buildingId) { setLoading(false); setRefreshing(false); return; }
    try {
      const api = webApi(token);
      const [txRes, sumRes] = await Promise.allSettled([api.financial(buildingId), api.financialSummary(buildingId)]);
      if (txRes.status === 'fulfilled') setItems(txRes.value ?? []);
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
    } catch (e) {
      console.warn('[Finans] load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, buildingId]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleSave = async () => {
    if (!form.amount || !form.category.trim()) { Alert.alert('Hata', 'Tutar ve kategori zorunlu.'); return; }
    setSaving(true);
    try {
      await webApi(token).addTransaction(buildingId, { ...form, amount: Number(form.amount) });
      setModalVisible(false);
      setForm(EMPTY);
      load();
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    Alert.alert('Sil', `Bu kaydı silmek istediğinizden emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        try { await webApi(token).delTransaction(buildingId, item.id); load(); }
        catch (e) { Alert.alert('Hata', e.message); }
      }},
    ]);
  };

  const filteredItems = filter === 'income'
    ? items.filter((i) => i.type === 0)
    : filter === 'expense'
    ? items.filter((i) => i.type === 1)
    : items;

  const SummaryCard = ({ label, value, icon, positive, filterKey }) => {
    const accent = positive ? '#10B981' : positive === false ? '#EF4444' : colors.primary;
    const active = filter === filterKey;
    return (
      <TouchableOpacity
        onPress={() => setFilter(active ? 'all' : filterKey)}
        style={{
          flex: 1, borderRadius: 10, padding: 12, alignItems: 'center',
          backgroundColor: active ? accent : colors.card,
          borderWidth: active ? 0 : 1.5,
          borderColor: 'transparent',
        }}
      >
        <Icon name={icon} size={18} color={active ? '#fff' : accent} />
        <Text caption1 style={{ marginTop: 4, textAlign: 'center', color: active ? '#fff' : BaseColor.grayColor }}>{label}</Text>
        <Text body2 bold style={{ color: active ? '#fff' : accent, marginTop: 2 }}>{fmt(value ?? 0)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Icon name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text header bold>Gelir / Gider</Text>
          {buildingName ? <Text caption1 grayColor style={{ marginTop: 2 }}>{buildingName}</Text> : null}
        </View>
        <TouchableOpacity
          onPress={() => { setForm(EMPTY); setModalVisible(true); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}
        >
          <Icon name="plus" size={13} color="white" />
          <Text caption1 whiteColor bold>İşlem Ekle</Text>
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 }}>
          <SummaryCard label="Gelir" value={summary.totalIncome} icon="arrow-up" positive={true} filterKey="income" />
          <SummaryCard label="Gider" value={summary.totalExpense} icon="arrow-down" positive={false} filterKey="expense" />
          <SummaryCard label="Bakiye" value={summary.balance} icon="wallet" positive={summary?.balance >= 0 ? true : null} filterKey="all" />
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl colors={[colors.primary]} tintColor={colors.primary} refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Icon name="chart-line" size={48} color={BaseColor.grayColor} />
              <Text body1 grayColor style={{ marginTop: 12 }}>Kayıtlı işlem yok.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Transaction2Col
                  icon={item.type === 0 ? 'arrow-up' : 'arrow-down'}
                  name={item.category || (item.type === 0 ? 'Gelir' : 'Gider')}
                  date={`${item.date}${item.unitNumber ? ' · D.' + item.unitNumber : ''}`}
                  status={item.description ?? ''}
                  price={`${item.type === 0 ? '+' : '-'}${fmt(item.amount)}`}
                  isUp={item.type === 0}
                  backgroundIcon={item.type === 0 ? '#10B981' : '#EF4444'}
                  style={{ paddingHorizontal: 20 }}
                  onPress={() => {}}
                />
              </View>
              <TouchableOpacity onPress={() => handleDelete(item)} style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
                <Icon name="trash" size={15} color={BaseColor.grayColor} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Text title3 bold style={{ flex: 1 }}>Yeni İşlem</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Icon name="times" size={20} color={BaseColor.grayColor} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text caption1 grayColor style={{ marginBottom: 8 }}>Tür</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  {[{ label: 'Gelir', value: 0, color: '#10B981' }, { label: 'Gider', value: 1, color: '#EF4444' }].map(({ label, value, color }) => (
                    <TouchableOpacity key={value} onPress={() => setForm((f) => ({ ...f, type: value }))} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: form.type === value ? color : colors.border, backgroundColor: form.type === value ? color + '20' : 'transparent' }}>
                      <Text caption1 bold style={{ color: form.type === value ? color : BaseColor.grayColor }}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {[
                  { label: 'Tutar (₺) *', key: 'amount', keyboard: 'decimal-pad', placeholder: '0.00' },
                  { label: 'Kategori *', key: 'category', placeholder: 'Aidat, Temizlik...' },
                  { label: 'Tarih', key: 'date', placeholder: 'YYYY-AA-GG' },
                  { label: 'Açıklama', key: 'description', placeholder: 'İsteğe bağlı' },
                ].map(({ label, key, keyboard, placeholder }) => (
                  <View key={key} style={{ marginBottom: 14 }}>
                    <Text caption1 grayColor style={{ marginBottom: 6 }}>{label}</Text>
                    <TextInput style={{ height: 44, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, backgroundColor: colors.card }} value={form[key]} onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))} keyboardType={keyboard ?? 'default'} placeholder={placeholder} />
                  </View>
                ))}

                <Button full loading={saving} onPress={handleSave}>Kaydet</Button>
                <View style={{ height: 16 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
