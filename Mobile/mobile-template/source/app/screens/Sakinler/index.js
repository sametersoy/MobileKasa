import { useCallback, useEffect, useState } from 'react';
import {
  FlatList, View, TouchableOpacity, RefreshControl, ActivityIndicator,
  Modal, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { BaseColor, BaseStyle, useTheme } from '@/config';
import { SafeAreaView, Text, Icon, TextInput, Button, Transaction2Col } from '@/components';
import { mobileApi, residentApi } from '@/api';

const EMPTY_ADD = { fullName: '', email: '', phone: '', password: '', unitId: '' };
const EMPTY_EDIT = { fullName: '', phone: '' };

/* ---------- Küçük yardımcılar ---------- */

const Field = ({ label, children }) => (
  <View style={{ marginBottom: 14 }}>
    <Text caption1 grayColor style={{ marginBottom: 6 }}>{label}</Text>
    {children}
  </View>
);

const inputStyle = (colors) => ({
  height: 44,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.border,
  paddingHorizontal: 12,
  backgroundColor: colors.card,
  color: colors.text,
});

/* ---------- Ana bileşen ---------- */

export default function Sakinler() {
  const { colors } = useTheme();
  const token = useSelector((s) => s.auth?.token);
  const selectedBuildingId = useSelector((s) => s.building?.selectedId);
  const buildingList = useSelector((s) => s.building?.list ?? []);
  const buildingId = selectedBuildingId;
  const buildingName = buildingList.find((b) => b.id === selectedBuildingId)?.name ?? '';

  const [residents, setResidents] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sakin Ekle
  const [addVisible, setAddVisible] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD);
  const [addError, setAddError] = useState('');
  const [addSaving, setAddSaving] = useState(false);

  // Sakin Düzenle
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editSaving, setEditSaving] = useState(false);
  const [addUnitId, setAddUnitId] = useState('');
  const [unitAdding, setUnitAdding] = useState(false);

  /* ---- Veri yükleme ---- */

  const load = useCallback(async () => {
    if (!token || !buildingId) { setLoading(false); setRefreshing(false); return; }
    try {
      const [resRes, unitRes] = await Promise.allSettled([
        residentApi(token).list(buildingId),
        mobileApi(token).units(buildingId),
      ]);
      if (resRes.status === 'fulfilled') setResidents(resRes.value ?? []);
      if (unitRes.status === 'fulfilled') setUnits(unitRes.value?.data ?? []);
    } catch (e) {
      console.warn('[Sakinler] load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, buildingId]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const unitNumber = (uid) => units.find((u) => u.id === uid)?.number ?? '—';

  /* ---- Sakin Ekle ---- */

  const openAdd = () => {
    setAddForm({ ...EMPTY_ADD, unitId: units[0]?.id ?? '' });
    setAddError('');
    setAddVisible(true);
  };

  const handleAdd = async () => {
    if (!addForm.fullName.trim()) { setAddError('Ad Soyad zorunlu.'); return; }
    if (!addForm.email.trim()) { setAddError('E-posta zorunlu.'); return; }
    if (addForm.password.length < 6) { setAddError('Şifre en az 6 karakter olmalı.'); return; }
    if (!addForm.unitId) { setAddError('Daire seçiniz.'); return; }
    setAddSaving(true);
    setAddError('');
    try {
      await residentApi(token).register({
        fullName: addForm.fullName.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim() || null,
        password: addForm.password,
        buildingId,
        unitId: addForm.unitId,
      });
      setAddVisible(false);
      load();
    } catch (e) {
      setAddError(e.message ?? 'Kayıt başarısız.');
    } finally {
      setAddSaving(false);
    }
  };

  /* ---- Sakin Düzenle ---- */

  const openEdit = (r) => {
    setEditTarget(r);
    setEditForm({ fullName: r.fullName, phone: r.phone ?? '' });
    setAddUnitId('');
  };

  const handleEditSave = async () => {
    if (!editTarget || !editForm.fullName.trim()) return;
    setEditSaving(true);
    try {
      await residentApi(token).update(editTarget.id, {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim() || null,
      });
      load();
      setEditTarget((prev) => ({ ...prev, ...editForm }));
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Güncelleme başarısız.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleAddUnit = async () => {
    if (!editTarget || !addUnitId) return;
    setUnitAdding(true);
    try {
      await residentApi(token).addUnit(editTarget.id, addUnitId);
      setAddUnitId('');
      const fresh = await residentApi(token).list(buildingId);
      setResidents(fresh ?? []);
      setEditTarget((prev) => (fresh ?? []).find((x) => x.id === prev?.id) ?? prev);
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Daire eklenemedi.');
    } finally {
      setUnitAdding(false);
    }
  };

  const handleRemoveUnit = async (uid) => {
    if (!editTarget) return;
    Alert.alert('Daireyi Kaldır', `Daire ${unitNumber(uid)} ilişkisi kaldırılsın mı?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Kaldır',
        style: 'destructive',
        onPress: async () => {
          try {
            await residentApi(token).removeUnit(editTarget.id, uid);
            const fresh = await residentApi(token).list(buildingId);
            setResidents(fresh ?? []);
            setEditTarget((prev) => (fresh ?? []).find((x) => x.id === prev?.id) ?? prev);
          } catch (e) {
            Alert.alert('Hata', e.message ?? 'Kaldırılamadı.');
          }
        },
      },
    ]);
  };

  /* ---- Pasife Al ---- */

  const handleDeactivate = (r) => {
    Alert.alert('Pasife Al', `${r.fullName} adlı sakin pasife alınsın mı?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Pasife Al',
        style: 'destructive',
        onPress: async () => {
          try {
            await residentApi(token).deactivate(r.id);
            load();
            if (editTarget?.id === r.id) setEditTarget(null);
          } catch (e) {
            Alert.alert('Hata', e.message ?? 'İşlem başarısız.');
          }
        },
      },
    ]);
  };

  /* ---- Yardımcı: daire seçici (dropdown yerine yatay pill listesi) ---- */

  const UnitPicker = ({ selectedId, onSelect, exclude = [] }) => {
    const available = units.filter((u) => !exclude.includes(u.id));
    if (available.length === 0) return (
      <Text caption1 grayColor>Atanabilecek daire yok.</Text>
    );
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {available.map((u) => {
          const active = selectedId === u.id;
          return (
            <TouchableOpacity
              key={u.id}
              onPress={() => onSelect(active ? '' : u.id)}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                borderWidth: 1.5, marginRight: 8,
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? colors.primaryLight : 'transparent',
              }}
            >
              <Text caption1 style={{ color: active ? colors.primary : BaseColor.grayColor }}>
                Daire {u.number}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  /* ---- Render ---- */

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>

      {/* Başlık */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <Text header bold>Sakinler</Text>
          {buildingName ? <Text caption1 grayColor style={{ marginTop: 2 }}>{buildingName}</Text> : null}
        </View>
        <TouchableOpacity
          onPress={openAdd}
          disabled={units.length === 0}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: units.length === 0 ? BaseColor.grayColor : colors.primary,
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
          }}
        >
          <Icon name="user-plus" size={13} color="white" />
          <Text caption1 whiteColor bold>Sakin Ekle</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={residents}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl colors={[colors.primary]} tintColor={colors.primary} refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Icon name="users" size={48} color={BaseColor.grayColor} />
              <Text body1 grayColor style={{ marginTop: 12 }}>Henüz kayıtlı sakin yok.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Transaction2Col
                  icon="user"
                  name={item.fullName}
                  date={item.email}
                  status={item.unitIds?.length > 0 ? item.unitIds.map((uid) => `D.${unitNumber(uid)}`).join(', ') : 'Daire atanmadı'}
                  price={item.isActive ? 'Aktif' : 'Pasif'}
                  isUp={item.isActive}
                  backgroundIcon={item.isActive ? colors.primary : BaseColor.grayColor}
                  style={{ paddingHorizontal: 20 }}
                  onPress={() => openEdit(item)}
                />
              </View>
              <TouchableOpacity
                onPress={() => handleDeactivate(item)}
                style={{ paddingHorizontal: 16, paddingVertical: 20 }}
              >
                <Icon name="user-slash" size={15} color={BaseColor.grayColor} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* ===== Sakin Ekle Modal ===== */}
      <Modal visible={addVisible} animationType="slide" transparent onRequestClose={() => setAddVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Text title3 bold style={{ flex: 1 }}>Yeni Daire Sakini</Text>
                <TouchableOpacity onPress={() => setAddVisible(false)}>
                  <Icon name="times" size={20} color={BaseColor.grayColor} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {addError ? (
                  <View style={{ backgroundColor: '#FEE2E2', borderRadius: 8, padding: 10, marginBottom: 14 }}>
                    <Text caption1 style={{ color: '#B91C1C' }}>{addError}</Text>
                  </View>
                ) : null}

                <Field label="Ad Soyad *">
                  <TextInput
                    style={inputStyle(colors)}
                    placeholder="Tam adı"
                    value={addForm.fullName}
                    onChangeText={(v) => setAddForm((f) => ({ ...f, fullName: v }))}
                  />
                </Field>

                <Field label="E-posta *">
                  <TextInput
                    style={inputStyle(colors)}
                    placeholder="ornek@mail.com"
                    value={addForm.email}
                    onChangeText={(v) => setAddForm((f) => ({ ...f, email: v }))}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </Field>

                <Field label="Telefon (isteğe bağlı)">
                  <TextInput
                    style={inputStyle(colors)}
                    placeholder="05XX XXX XX XX"
                    value={addForm.phone}
                    onChangeText={(v) => setAddForm((f) => ({ ...f, phone: v }))}
                    keyboardType="phone-pad"
                  />
                </Field>

                <Field label="Şifre *">
                  <TextInput
                    style={inputStyle(colors)}
                    placeholder="En az 6 karakter"
                    value={addForm.password}
                    onChangeText={(v) => setAddForm((f) => ({ ...f, password: v }))}
                    secureTextEntry
                  />
                </Field>

                <Field label="Daire *">
                  <UnitPicker
                    selectedId={addForm.unitId}
                    onSelect={(id) => setAddForm((f) => ({ ...f, unitId: id }))}
                  />
                </Field>

                <View style={{ marginTop: 8, marginBottom: 16 }}>
                  <Button full loading={addSaving} onPress={handleAdd}>
                    Kaydet
                  </Button>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ===== Sakin Düzenle Modal ===== */}
      <Modal visible={!!editTarget} animationType="slide" transparent onRequestClose={() => setEditTarget(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' }}>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Text title3 bold style={{ flex: 1 }}>Sakin Düzenle</Text>
                <TouchableOpacity onPress={() => setEditTarget(null)}>
                  <Icon name="times" size={20} color={BaseColor.grayColor} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                <Field label="Ad Soyad">
                  <TextInput
                    style={inputStyle(colors)}
                    value={editForm.fullName}
                    onChangeText={(v) => setEditForm((f) => ({ ...f, fullName: v }))}
                  />
                </Field>

                <Field label="E-posta (değiştirilemez)">
                  <View style={[inputStyle(colors), { justifyContent: 'center', opacity: 0.6 }]}>
                    <Text body2 grayColor>{editTarget?.email}</Text>
                  </View>
                </Field>

                <Field label="Telefon">
                  <TextInput
                    style={inputStyle(colors)}
                    placeholder="05XX XXX XX XX"
                    value={editForm.phone}
                    onChangeText={(v) => setEditForm((f) => ({ ...f, phone: v }))}
                    keyboardType="phone-pad"
                  />
                </Field>

                {/* Atanmış Daireler */}
                <View style={{ backgroundColor: colors.card, borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <Text caption1 grayColor style={{ fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Atanmış Daireler
                  </Text>

                  {(editTarget?.unitIds?.length ?? 0) === 0 ? (
                    <Text caption1 grayColor style={{ marginBottom: 10 }}>Henüz daire atanmadı.</Text>
                  ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {editTarget?.unitIds.map((uid) => (
                        <View
                          key={uid}
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 4,
                            backgroundColor: colors.primaryLight, borderRadius: 20,
                            paddingLeft: 10, paddingRight: 6, paddingVertical: 4,
                          }}
                        >
                          <Text caption1 style={{ color: colors.primary }}>Daire {unitNumber(uid)}</Text>
                          <TouchableOpacity onPress={() => handleRemoveUnit(uid)} style={{ padding: 2 }}>
                            <Icon name="times" size={10} color={colors.primary} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <Text caption1 grayColor style={{ marginBottom: 8 }}>Daire Ekle</Text>
                  <UnitPicker
                    selectedId={addUnitId}
                    onSelect={setAddUnitId}
                    exclude={editTarget?.unitIds ?? []}
                  />
                  {addUnitId ? (
                    <TouchableOpacity
                      onPress={handleAddUnit}
                      disabled={unitAdding}
                      style={{
                        marginTop: 10, backgroundColor: colors.primary,
                        borderRadius: 8, paddingVertical: 8, alignItems: 'center',
                      }}
                    >
                      {unitAdding
                        ? <ActivityIndicator size="small" color="white" />
                        : <Text caption1 whiteColor bold>Ekle</Text>}
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      full
                      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
                      styleText={{ color: colors.text }}
                      onPress={() => setEditTarget(null)}
                    >
                      İptal
                    </Button>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button full loading={editSaving} onPress={handleEditSave}>
                      Kaydet
                    </Button>
                  </View>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
