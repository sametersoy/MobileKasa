import { useCallback, useEffect, useState } from 'react';
import {
  FlatList, View, TouchableOpacity, RefreshControl, ActivityIndicator,
  Modal, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { BaseColor, BaseStyle, useTheme } from '@/config';
import { SafeAreaView, Text, Icon, TextInput, Button, Transaction2Col } from '@/components';
import { mobileApi } from '@/api';

const UnitTypeLabel = { Residential: 'Konut', Commercial: 'İşyeri', Parking: 'Otopark' };
const UnitTypes = [
  { value: 'Residential', label: 'Konut' },
  { value: 'Commercial', label: 'İşyeri' },
  { value: 'Parking', label: 'Otopark' },
];

const UnitItem = ({ item, colors, onPress }) => (
  <Transaction2Col
    onPress={onPress}
    icon="home"
    name={`Daire ${item.number}`}
    date={`${item.floor}. Kat · ${UnitTypeLabel[item.type] ?? item.type} · ${item.areaM2} m²`}
    price={item.isOccupied ? 'Dolu' : 'Boş'}
    status=""
    isUp={item.isOccupied}
    backgroundIcon={item.isOccupied ? colors.primary : BaseColor.grayColor}
    style={{ paddingHorizontal: 20 }}
  />
);

const EMPTY_FORM = { number: '', floor: '', areaM2: '', type: 'Residential', isOccupied: false };

export default function FCryptol01({ navigation }) {
  const { colors } = useTheme();
  const token = useSelector((state) => state.auth?.token);
  const selectedBuildingId = useSelector((state) => state.building?.selectedId);
  const buildingList = useSelector((state) => state.building?.list ?? []);
  const selectedBuilding = buildingList.find((b) => b.id === selectedBuildingId);

  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const buildingId = selectedBuildingId;
  const buildingName = selectedBuilding?.name ?? '';

  const load = useCallback(async () => {
    if (!token || !buildingId) { setLoading(false); setRefreshing(false); return; }
    const api = mobileApi(token);
    try {
      const res = await api.units(buildingId);
      setUnits(res.data ?? []);
    } catch (e) {
      console.warn('[Daireler] load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, buildingId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const openModal = () => { setForm(EMPTY_FORM); setModalVisible(true); };
  const closeModal = () => setModalVisible(false);

  const onSave = async () => {
    if (!form.number.trim()) { Alert.alert('Hata', 'Daire numarası gerekli.'); return; }
    const floor = parseInt(form.floor, 10);
    if (isNaN(floor)) { Alert.alert('Hata', 'Geçerli bir kat numarası girin.'); return; }
    const areaM2 = parseFloat(form.areaM2);
    if (isNaN(areaM2) || areaM2 <= 0) { Alert.alert('Hata', 'Geçerli bir metrekare girin.'); return; }

    setSaving(true);
    try {
      const newUnit = await mobileApi(token).createUnit(buildingId, {
        number: form.number.trim(),
        floor,
        type: form.type,
        areaM2,
        isOccupied: form.isOccupied,
      });
      setUnits((prev) => [...prev, newUnit].sort((a, b) => a.floor - b.floor || a.number.localeCompare(b.number)));
      closeModal();
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Daire eklenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const occupied = units.filter((u) => u.isOccupied).length;
  const empty = units.length - occupied;

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      {/* Başlık */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <Text header bold>Daireler</Text>
          {buildingName ? <Text caption1 grayColor style={{ marginTop: 2 }}>{buildingName}</Text> : null}
        </View>
        <TouchableOpacity
          onPress={openModal}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: colors.primary,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
          }}
        >
          <Icon name="plus" size={13} color="white" />
          <Text caption1 whiteColor bold>Daire Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Özet */}
      {!loading && units.length > 0 && (
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 12 }}>
          {[
            { label: 'Toplam', value: units.length },
            { label: 'Dolu', value: occupied },
            { label: 'Boş', value: empty },
          ].map(({ label, value }) => (
            <View key={label} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 10, padding: 10, alignItems: 'center' }}>
              <Text title3 bold style={{ color: colors.primary }}>{value}</Text>
              <Text caption1 grayColor>{label}</Text>
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
          data={units}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl colors={[colors.primary]} tintColor={colors.primary} refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Icon name="building" size={48} color={BaseColor.grayColor} />
              <Text body1 grayColor style={{ marginTop: 12 }}>Henüz daire eklenmedi.</Text>
              <TouchableOpacity onPress={openModal} style={{ marginTop: 16 }}>
                <Text body2 style={{ color: colors.primary }}>İlk daireyi ekle</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
              <UnitItem
                item={item}
                colors={colors}
                onPress={() => navigation.navigate('UnitDetail', { unit: item, buildingId })}
              />
            )}
        />
      )}

      {/* Daire Ekle Modalı */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
              {/* Modal Başlık */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Text title3 bold style={{ flex: 1 }}>Yeni Daire Ekle</Text>
                <TouchableOpacity onPress={closeModal}>
                  <Icon name="times" size={20} color={BaseColor.grayColor} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Daire No */}
                <Text caption1 grayColor style={{ marginBottom: 6 }}>Daire Numarası *</Text>
                <TextInput
                  style={[BaseStyle.textInput, { marginBottom: 14 }]}
                  placeholder="örn. 1, 2A, Zemin"
                  value={form.number}
                  onChangeText={(v) => setForm((f) => ({ ...f, number: v }))}
                  autoCapitalize="characters"
                />

                {/* Kat */}
                <Text caption1 grayColor style={{ marginBottom: 6 }}>Kat *</Text>
                <TextInput
                  style={[BaseStyle.textInput, { marginBottom: 14 }]}
                  placeholder="örn. 1"
                  value={form.floor}
                  onChangeText={(v) => setForm((f) => ({ ...f, floor: v }))}
                  keyboardType="number-pad"
                />

                {/* Metrekare */}
                <Text caption1 grayColor style={{ marginBottom: 6 }}>Alan (m²) *</Text>
                <TextInput
                  style={[BaseStyle.textInput, { marginBottom: 14 }]}
                  placeholder="örn. 90"
                  value={form.areaM2}
                  onChangeText={(v) => setForm((f) => ({ ...f, areaM2: v }))}
                  keyboardType="decimal-pad"
                />

                {/* Tür */}
                <Text caption1 grayColor style={{ marginBottom: 10 }}>Daire Türü</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
                  {UnitTypes.map(({ value, label }) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() => setForm((f) => ({ ...f, type: value }))}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: 'center',
                        borderWidth: 1.5,
                        borderColor: form.type === value ? colors.primary : colors.border,
                        backgroundColor: form.type === value ? colors.primaryLight : 'transparent',
                      }}
                    >
                      <Text caption1 style={{ color: form.type === value ? colors.primary : BaseColor.grayColor }} bold={form.type === value}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Dolu / Boş */}
                <TouchableOpacity
                  onPress={() => setForm((f) => ({ ...f, isOccupied: !f.isOccupied }))}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}
                >
                  <Text body2 grayColor>Dolu</Text>
                  <View style={{
                    width: 48, height: 26, borderRadius: 13, padding: 2,
                    backgroundColor: form.isOccupied ? colors.primary : BaseColor.fieldColor,
                    justifyContent: 'center',
                  }}>
                    <View style={{
                      width: 22, height: 22, borderRadius: 11, backgroundColor: 'white',
                      alignSelf: form.isOccupied ? 'flex-end' : 'flex-start',
                    }} />
                  </View>
                </TouchableOpacity>

                <Button full loading={saving} onPress={onSave}>
                  Kaydet
                </Button>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
