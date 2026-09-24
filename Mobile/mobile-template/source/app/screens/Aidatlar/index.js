import { useCallback, useEffect, useState } from 'react';
import { FlatList, View, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { BaseColor, BaseStyle, useTheme } from '@/config';
import { SafeAreaView, Text, Icon, TextInput, Button, Transaction2Col } from '@/components';
import { mobileApi, webApi } from '@/api';

const fmt = (n) => '₺' + Number(n).toLocaleString('tr-TR');
const today = () => new Date().toISOString().split('T')[0];

export default function Aidatlar() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const token = useSelector((s) => s.auth?.token);
  const selectedBuildingId = useSelector((s) => s.building?.selectedId);
  const buildingList = useSelector((s) => s.building?.list ?? []);
  const buildingId = selectedBuildingId;
  const buildingName = buildingList.find((b) => b.id === selectedBuildingId)?.name ?? '';

  const [dues, setDues] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('dues'); // 'dues' | 'rules'

  // Pay modal
  const [payTarget, setPayTarget] = useState(null);
  const [payForm, setPayForm] = useState({ paidDate: today(), note: '' });
  const [paying, setPaying] = useState(false);

  // Rule modal
  const [ruleVisible, setRuleVisible] = useState(false);
  const [ruleForm, setRuleForm] = useState({ name: '', calculationType: 0, amount: '', dayOfMonth: '1' });
  const [ruleSaving, setRuleSaving] = useState(false);

  // Generate modal
  const [genVisible, setGenVisible] = useState(false);
  const [genForm, setGenForm] = useState({ period: '', dueDate: '' });
  const [genSaving, setGenSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token || !buildingId) { setLoading(false); setRefreshing(false); return; }
    try {
      const [dRes, rRes] = await Promise.allSettled([
        mobileApi(token).dues(buildingId),
        webApi(token).duesRules(buildingId),
      ]);
      if (dRes.status === 'fulfilled') setDues(dRes.value?.data ?? dRes.value ?? []);
      if (rRes.status === 'fulfilled') setRules(rRes.value ?? []);
    } catch (e) {
      console.warn('[Aidatlar] load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, buildingId]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handlePay = async () => {
    if (!payForm.paidDate) return;
    setPaying(true);
    try {
      await mobileApi(token).payDue(buildingId, payTarget.id, payForm);
      setPayTarget(null);
      load();
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Ödeme kaydedilemedi.');
    } finally {
      setPaying(false);
    }
  };

  const handleUnpay = (due) => {
    Alert.alert('Geri Al', 'Bu ödeme geri alınsın mı?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Geri Al', style: 'destructive', onPress: async () => {
        try { await mobileApi(token).unpayDue(buildingId, due.id); load(); }
        catch (e) { Alert.alert('Hata', e.message); }
      }},
    ]);
  };

  const handleSaveRule = async () => {
    if (!ruleForm.name.trim() || !ruleForm.amount) { Alert.alert('Hata', 'Kural adı ve miktar zorunlu.'); return; }
    setRuleSaving(true);
    try {
      await webApi(token).addDuesRule(buildingId, { ...ruleForm, amount: Number(ruleForm.amount), dayOfMonth: Number(ruleForm.dayOfMonth) });
      setRuleVisible(false);
      setRuleForm({ name: '', calculationType: 0, amount: '', dayOfMonth: '1' });
      load();
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Kaydedilemedi.');
    } finally {
      setRuleSaving(false);
    }
  };

  const handleDelRule = (rule) => {
    Alert.alert('Sil', `"${rule.name}" kuralı silinsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        try { await webApi(token).delDuesRule(buildingId, rule.id); load(); }
        catch (e) { Alert.alert('Hata', e.message); }
      }},
    ]);
  };

  const handleGenerate = async () => {
    if (!genForm.period || !genForm.dueDate) { Alert.alert('Hata', 'Dönem ve son ödeme tarihi zorunlu.'); return; }
    setGenSaving(true);
    try {
      await webApi(token).generateDues(buildingId, genForm);
      setGenVisible(false);
      setGenForm({ period: '', dueDate: '' });
      load();
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Oluşturulamadı.');
    } finally {
      setGenSaving(false);
    }
  };

  const unpaidCount = dues.filter((d) => !d.isPaid).length;
  const paidTotal = dues.filter((d) => d.isPaid).reduce((s, d) => s + d.amount, 0);
  const pendingTotal = dues.filter((d) => !d.isPaid).reduce((s, d) => s + d.amount, 0);

  const sheetInput = (label, key, obj, setObj, opts = {}) => (
    <View key={key} style={{ marginBottom: 14 }}>
      <Text caption1 grayColor style={{ marginBottom: 6 }}>{label}</Text>
      <TextInput style={{ height: 44, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, backgroundColor: colors.card }} value={obj[key]} onChangeText={(v) => setObj((f) => ({ ...f, [key]: v }))} {...opts} />
    </View>
  );

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      {/* Başlık */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Icon name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text header bold>Aidatlar</Text>
          {buildingName ? <Text caption1 grayColor style={{ marginTop: 2 }}>{buildingName}</Text> : null}
        </View>
      </View>

      {/* Tab + Aksiyonlar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, gap: 8 }}>
        {[{ key: 'dues', label: 'Aidatlar' }, { key: 'rules', label: 'Kurallar' }].map(({ key, label }) => (
          <TouchableOpacity key={key} onPress={() => setTab(key)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: tab === key ? colors.primary : colors.card }}>
            <Text caption1 bold style={{ color: tab === key ? 'white' : BaseColor.grayColor }}>{label}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => setGenVisible(true)} style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.primary }}>
          <Text caption1 style={{ color: colors.primary }}>Oluştur</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRuleVisible(true)} style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.primary }}>
          <Text caption1 whiteColor>Kural +</Text>
        </TouchableOpacity>
      </View>

      {/* Özet şerit */}
      {dues.length > 0 && (
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 8 }}>
          <View style={{ flex: 1, backgroundColor: '#ECFDF5', borderRadius: 8, padding: 10, alignItems: 'center' }}>
            <Text caption2 style={{ color: '#10B981' }}>Tahsil</Text>
            <Text body2 bold style={{ color: '#10B981' }}>{fmt(paidTotal)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10, alignItems: 'center' }}>
            <Text caption2 style={{ color: '#EF4444' }}>Bekleyen</Text>
            <Text body2 bold style={{ color: '#EF4444' }}>{fmt(pendingTotal)} ({unpaidCount})</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : tab === 'dues' ? (
        <FlatList
          data={dues}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl colors={[colors.primary]} tintColor={colors.primary} refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 60 }}><Icon name="file-invoice-dollar" size={48} color={BaseColor.grayColor} /><Text body1 grayColor style={{ marginTop: 12 }}>Aidat kaydı yok.</Text></View>}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Transaction2Col
                  icon="file-invoice-dollar"
                  name={`D.${item.unitNumber} — ${item.period}`}
                  date={`Son: ${item.dueDate}${item.paidDate ? ' · Ödendi: ' + item.paidDate : ''}`}
                  status={item.note ?? ''}
                  price={fmt(item.amount)}
                  isUp={item.isPaid}
                  backgroundIcon={item.isPaid ? '#10B981' : '#EF4444'}
                  style={{ paddingHorizontal: 20 }}
                  onPress={() => {}}
                />
              </View>
              <TouchableOpacity
                onPress={() => item.isPaid ? handleUnpay(item) : (setPayTarget(item), setPayForm({ paidDate: today(), note: '' }))}
                style={{ paddingHorizontal: 14, paddingVertical: 20 }}
              >
                <Icon name={item.isPaid ? 'undo' : 'check-circle'} size={18} color={item.isPaid ? BaseColor.grayColor : '#10B981'} />
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={rules}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl colors={[colors.primary]} tintColor={colors.primary} refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 60 }}><Text body1 grayColor>Kural tanımlanmamış.</Text></View>}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Transaction2Col
                  icon="receipt"
                  name={item.name}
                  date={item.calculationType === 0 ? 'Sabit / Daire' : 'M² Başına'}
                  status={`Her ayın ${item.dayOfMonth}. günü`}
                  price={fmt(item.amount)}
                  isUp={item.isActive}
                  backgroundIcon={item.isActive ? colors.primary : BaseColor.grayColor}
                  style={{ paddingHorizontal: 20 }}
                  onPress={() => {}}
                />
              </View>
              <TouchableOpacity onPress={() => handleDelRule(item)} style={{ paddingHorizontal: 14, paddingVertical: 20 }}>
                <Icon name="trash" size={15} color={BaseColor.grayColor} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Ödeme Modal */}
      <Modal visible={!!payTarget} animationType="slide" transparent onRequestClose={() => setPayTarget(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text title3 bold style={{ flex: 1 }}>Ödeme Al</Text>
                <TouchableOpacity onPress={() => setPayTarget(null)}><Icon name="times" size={20} color={BaseColor.grayColor} /></TouchableOpacity>
              </View>
              <Text body2 grayColor style={{ marginBottom: 16 }}>D.{payTarget?.unitNumber} · {payTarget?.period} · {fmt(payTarget?.amount ?? 0)}</Text>
              {sheetInput('Ödeme Tarihi *', 'paidDate', payForm, setPayForm, { placeholder: 'YYYY-AA-GG' })}
              {sheetInput('Not (isteğe bağlı)', 'note', payForm, setPayForm, { placeholder: 'Nakit, havale vb.' })}
              <Button full loading={paying} onPress={handlePay}>Ödemeyi Kaydet</Button>
              <View style={{ height: 16 }} />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Kural Ekle Modal */}
      <Modal visible={ruleVisible} animationType="slide" transparent onRequestClose={() => setRuleVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Text title3 bold style={{ flex: 1 }}>Yeni Kural</Text>
                <TouchableOpacity onPress={() => setRuleVisible(false)}><Icon name="times" size={20} color={BaseColor.grayColor} /></TouchableOpacity>
              </View>
              {sheetInput('Kural Adı *', 'name', ruleForm, setRuleForm, { placeholder: 'Aylık Aidat' })}
              <Text caption1 grayColor style={{ marginBottom: 8 }}>Hesaplama</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                {[{ label: 'Sabit / Daire', value: 0 }, { label: 'M² Başına', value: 1 }].map(({ label, value }) => (
                  <TouchableOpacity key={value} onPress={() => setRuleForm((f) => ({ ...f, calculationType: value }))} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: ruleForm.calculationType === value ? colors.primary : colors.border, backgroundColor: ruleForm.calculationType === value ? colors.primaryLight : 'transparent' }}>
                    <Text caption1 bold style={{ color: ruleForm.calculationType === value ? colors.primary : BaseColor.grayColor }}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {sheetInput('Miktar (₺) *', 'amount', ruleForm, setRuleForm, { keyboardType: 'decimal-pad', placeholder: '500' })}
              {sheetInput('Ay Günü', 'dayOfMonth', ruleForm, setRuleForm, { keyboardType: 'number-pad', placeholder: '1' })}
              <Button full loading={ruleSaving} onPress={handleSaveRule}>Kaydet</Button>
              <View style={{ height: 16 }} />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Aidat Oluştur Modal */}
      <Modal visible={genVisible} animationType="slide" transparent onRequestClose={() => setGenVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Text title3 bold style={{ flex: 1 }}>Aidat Oluştur</Text>
                <TouchableOpacity onPress={() => setGenVisible(false)}><Icon name="times" size={20} color={BaseColor.grayColor} /></TouchableOpacity>
              </View>
              {sheetInput('Dönem * (örn: 2026-05)', 'period', genForm, setGenForm, { placeholder: '2026-05' })}
              {sheetInput('Son Ödeme Tarihi *', 'dueDate', genForm, setGenForm, { placeholder: 'YYYY-AA-GG' })}
              <Button full loading={genSaving} onPress={handleGenerate}>Oluştur</Button>
              <View style={{ height: 16 }} />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
