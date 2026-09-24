import { useCallback, useEffect, useState } from 'react';
import { FlatList, View, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { BaseColor, BaseStyle, useTheme } from '@/config';
import { SafeAreaView, Text, Icon, TextInput, Button, Transaction2Col } from '@/components';
import { mobileApi, webApi } from '@/api';

const METER_TYPES = [
  { label: 'Elektrik', icon: 'bolt', color: '#F59E0B' },
  { label: 'Doğalgaz', icon: 'fire', color: '#EF4444' },
  { label: 'Su', icon: 'tint', color: '#06B6D4' },
];

export default function Sayaclar() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const token = useSelector((s) => s.auth?.token);
  const selectedBuildingId = useSelector((s) => s.building?.selectedId);
  const buildingList = useSelector((s) => s.building?.list ?? []);
  const buildingId = selectedBuildingId;
  const buildingName = buildingList.find((b) => b.id === selectedBuildingId)?.name ?? '';

  const [meters, setMeters] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedMeter, setSelectedMeter] = useState(null);
  const [readings, setReadings] = useState([]);
  const [readingsLoading, setReadingsLoading] = useState(false);

  const [meterVisible, setMeterVisible] = useState(false);
  const [meterForm, setMeterForm] = useState({ unitId: '', type: 0, serialNumber: '' });
  const [meterSaving, setMeterSaving] = useState(false);

  const [readingVisible, setReadingVisible] = useState(false);
  const [readingForm, setReadingForm] = useState({ readingDate: '', value: '', unitPrice: '' });
  const [readingSaving, setReadingSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token || !buildingId) { setLoading(false); setRefreshing(false); return; }
    try {
      const api = webApi(token);
      const mApi = mobileApi(token);
      const [mRes, uRes] = await Promise.allSettled([api.meters(buildingId), mApi.units(buildingId)]);
      if (mRes.status === 'fulfilled') setMeters(mRes.value ?? []);
      if (uRes.status === 'fulfilled') setUnits(uRes.value?.data ?? []);
    } catch (e) {
      console.warn('[Sayaclar] load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, buildingId]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const loadReadings = async (meter) => {
    setSelectedMeter(meter);
    setReadingsLoading(true);
    try {
      const res = await webApi(token).readings(buildingId, meter.id);
      setReadings(res ?? []);
    } catch {
      setReadings([]);
    } finally {
      setReadingsLoading(false);
    }
  };

  const handleSaveMeter = async () => {
    if (!meterForm.unitId || !meterForm.serialNumber.trim()) { Alert.alert('Hata', 'Daire ve seri no zorunlu.'); return; }
    setMeterSaving(true);
    try {
      await webApi(token).addMeter(buildingId, { ...meterForm, type: Number(meterForm.type) });
      setMeterVisible(false);
      setMeterForm({ unitId: '', type: 0, serialNumber: '' });
      load();
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Kaydedilemedi.');
    } finally {
      setMeterSaving(false);
    }
  };

  const handleSaveReading = async () => {
    if (!readingForm.readingDate || !readingForm.value) { Alert.alert('Hata', 'Tarih ve değer zorunlu.'); return; }
    setReadingSaving(true);
    try {
      await webApi(token).addReading(buildingId, selectedMeter.id, { ...readingForm, value: Number(readingForm.value), unitPrice: Number(readingForm.unitPrice) });
      setReadingVisible(false);
      setReadingForm({ readingDate: '', value: '', unitPrice: '' });
      loadReadings(selectedMeter);
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Kaydedilemedi.');
    } finally {
      setReadingSaving(false);
    }
  };

  const handleDelMeter = (meter) => {
    Alert.alert('Sil', 'Bu sayaç silinsin mi?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        try { await webApi(token).delMeter(buildingId, meter.id); if (selectedMeter?.id === meter.id) setSelectedMeter(null); load(); }
        catch (e) { Alert.alert('Hata', e.message); }
      }},
    ]);
  };

  const sheetInput = (label, key, obj, setObj, opts = {}) => (
    <View key={key} style={{ marginBottom: 14 }}>
      <Text caption1 grayColor style={{ marginBottom: 6 }}>{label}</Text>
      <TextInput style={{ height: 44, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, backgroundColor: colors.card }} value={obj[key]} onChangeText={(v) => setObj((f) => ({ ...f, [key]: v }))} {...opts} />
    </View>
  );

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Icon name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text header bold>Sayaçlar</Text>
          {buildingName ? <Text caption1 grayColor style={{ marginTop: 2 }}>{buildingName}</Text> : null}
        </View>
        <TouchableOpacity onPress={() => { setMeterForm({ unitId: units[0]?.id ?? '', type: 0, serialNumber: '' }); setMeterVisible(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
          <Icon name="plus" size={13} color="white" />
          <Text caption1 whiteColor bold>Sayaç Ekle</Text>
        </TouchableOpacity>
      </View>

      {selectedMeter && (
        <View style={{ marginHorizontal: 20, marginBottom: 8, backgroundColor: colors.card, borderRadius: 12, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Icon name={METER_TYPES[selectedMeter.type]?.icon ?? 'tachometer-alt'} size={16} color={METER_TYPES[selectedMeter.type]?.color ?? colors.primary} />
            <Text body2 bold style={{ flex: 1, marginLeft: 8 }}>{METER_TYPES[selectedMeter.type]?.label} — D.{selectedMeter.unitNumber}</Text>
            <TouchableOpacity onPress={() => { setReadingForm({ readingDate: '', value: '', unitPrice: '' }); setReadingVisible(true); }} style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.primary, borderRadius: 16 }}>
              <Text caption2 whiteColor>Okuma +</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedMeter(null)} style={{ marginLeft: 8 }}>
              <Icon name="times" size={16} color={BaseColor.grayColor} />
            </TouchableOpacity>
          </View>
          {readingsLoading ? <ActivityIndicator size="small" color={colors.primary} /> : readings.length === 0 ? (
            <Text caption1 grayColor>Okuma kaydı yok.</Text>
          ) : readings.slice(0, 5).map((r) => (
            <View key={r.id} style={{ flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text caption1 style={{ flex: 1 }}>{r.readingDate}</Text>
              <Text caption1 style={{ flex: 1, textAlign: 'center' }}>{r.value}</Text>
              <Text caption1 bold style={{ color: colors.primary }}>₺{Number(r.amount).toLocaleString('tr-TR')}</Text>
            </View>
          ))}
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={meters}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl colors={[colors.primary]} tintColor={colors.primary} refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 60 }}><Icon name="tachometer-alt" size={48} color={BaseColor.grayColor} /><Text body1 grayColor style={{ marginTop: 12 }}>Sayaç kaydı yok.</Text></View>}
          renderItem={({ item }) => {
            const mt = METER_TYPES[item.type] ?? { label: 'Diğer', icon: 'tachometer-alt', color: BaseColor.grayColor };
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Transaction2Col
                    icon={mt.icon}
                    name={`${mt.label} — D.${item.unitNumber}`}
                    date={`Seri: ${item.serialNumber}`}
                    status=""
                    price="Okumalar"
                    isUp={true}
                    backgroundIcon={mt.color}
                    style={{ paddingHorizontal: 20 }}
                    onPress={() => loadReadings(item)}
                  />
                </View>
                <TouchableOpacity onPress={() => handleDelMeter(item)} style={{ paddingHorizontal: 14, paddingVertical: 20 }}>
                  <Icon name="trash" size={15} color={BaseColor.grayColor} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Sayaç Ekle Modal */}
      <Modal visible={meterVisible} animationType="slide" transparent onRequestClose={() => setMeterVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Text title3 bold style={{ flex: 1 }}>Yeni Sayaç</Text>
                <TouchableOpacity onPress={() => setMeterVisible(false)}><Icon name="times" size={20} color={BaseColor.grayColor} /></TouchableOpacity>
              </View>
              <Text caption1 grayColor style={{ marginBottom: 8 }}>Daire</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {units.map((u) => (
                  <TouchableOpacity key={u.id} onPress={() => setMeterForm((f) => ({ ...f, unitId: u.id }))} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, marginRight: 8, borderColor: meterForm.unitId === u.id ? colors.primary : colors.border, backgroundColor: meterForm.unitId === u.id ? colors.primaryLight : 'transparent' }}>
                    <Text caption1 style={{ color: meterForm.unitId === u.id ? colors.primary : BaseColor.grayColor }}>D.{u.number}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text caption1 grayColor style={{ marginBottom: 8 }}>Sayaç Tipi</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {METER_TYPES.map((mt, i) => (
                  <TouchableOpacity key={i} onPress={() => setMeterForm((f) => ({ ...f, type: i }))} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: meterForm.type === i ? mt.color : colors.border, backgroundColor: meterForm.type === i ? mt.color + '20' : 'transparent' }}>
                    <Icon name={mt.icon} size={16} color={meterForm.type === i ? mt.color : BaseColor.grayColor} />
                    <Text caption2 style={{ color: meterForm.type === i ? mt.color : BaseColor.grayColor, marginTop: 4 }}>{mt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {sheetInput('Seri No *', 'serialNumber', meterForm, setMeterForm, { placeholder: '12345678' })}
              <Button full loading={meterSaving} onPress={handleSaveMeter}>Kaydet</Button>
              <View style={{ height: 16 }} />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Okuma Ekle Modal */}
      <Modal visible={readingVisible} animationType="slide" transparent onRequestClose={() => setReadingVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Text title3 bold style={{ flex: 1 }}>Okuma Ekle</Text>
                <TouchableOpacity onPress={() => setReadingVisible(false)}><Icon name="times" size={20} color={BaseColor.grayColor} /></TouchableOpacity>
              </View>
              {sheetInput('Tarih * (YYYY-AA-GG)', 'readingDate', readingForm, setReadingForm, { placeholder: '2026-05-01' })}
              {sheetInput('Değer *', 'value', readingForm, setReadingForm, { keyboardType: 'decimal-pad', placeholder: '1234' })}
              {sheetInput('Birim Fiyat (₺)', 'unitPrice', readingForm, setReadingForm, { keyboardType: 'decimal-pad', placeholder: '4.50' })}
              <Button full loading={readingSaving} onPress={handleSaveReading}>Kaydet</Button>
              <View style={{ height: 16 }} />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
