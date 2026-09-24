import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView, View, TouchableOpacity, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import { BaseStyle, useTheme } from '@/config';
import { SafeAreaView, Text, Icon, TextInput, Button } from '@/components';
import { mobileApi, residentApi } from '@/api';

const UnitTypes = [
  { value: 'Residential', label: 'Konut' },
  { value: 'Commercial', label: 'İşyeri' },
  { value: 'Parking', label: 'Otopark' },
];

const fmt = (n) => '₺' + Number(n).toLocaleString('tr-TR');

const SectionTitle = ({ title, colors }) => (
  <Text caption1 style={{ color: colors.primary, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 }}>
    {title.toUpperCase()}
  </Text>
);

const Card = ({ children, colors, style }) => (
  <View style={[{ backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 14 }, style]}>
    {children}
  </View>
);

const Toggle = ({ label, value, onChange, colors }) => (
  <TouchableOpacity
    onPress={() => onChange(!value)}
    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}
  >
    <Text body2>{label}</Text>
    <View style={{
      width: 48, height: 26, borderRadius: 13, padding: 2,
      backgroundColor: value ? colors.primary : colors.border,
      justifyContent: 'center',
    }}>
      <View style={{
        width: 22, height: 22, borderRadius: 11, backgroundColor: 'white',
        alignSelf: value ? 'flex-end' : 'flex-start',
      }} />
    </View>
  </TouchableOpacity>
);

const EMPTY_RESIDENT_FORM = { fullName: '', email: '', phone: '', password: '' };

const UnitDetail = ({ navigation, route }) => {
  const { colors } = useTheme();
  const token = useSelector((state) => state.auth?.token);
  const { unit: initialUnit, buildingId } = route.params;

  const [unit, setUnit] = useState(initialUnit);
  const [form, setForm] = useState({
    number: initialUnit.number,
    floor: String(initialUnit.floor),
    areaM2: String(initialUnit.areaM2),
    type: initialUnit.type,
    isOccupied: initialUnit.isOccupied,
  });
  const [saving, setSaving] = useState(false);

  const [residents, setResidents] = useState([]);
  const [allResidents, setAllResidents] = useState([]);
  const [resLoading, setResLoading] = useState(true);
  const [assignId, setAssignId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [dues, setDues] = useState([]);
  const [duesLoading, setDuesLoading] = useState(true);

  const [addResModal, setAddResModal] = useState(false);
  const [resForm, setResForm] = useState(EMPTY_RESIDENT_FORM);
  const [resSaving, setResSaving] = useState(false);
  const [resError, setResError] = useState('');

  const [payModal, setPayModal] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [payDate, setPayDate] = useState('');
  const [payNote, setPayNote] = useState('');
  const [paying, setPaying] = useState(false);

  const loadResidents = useCallback(async () => {
    setResLoading(true);
    try {
      const list = await mobileApi(token).residents(buildingId);
      setAllResidents(list);
      setResidents(list.filter((r) => r.unitIds?.includes(unit.id)));
    } catch {}
    setResLoading(false);
  }, [token, buildingId, unit.id]);

  const loadDues = useCallback(async () => {
    setDuesLoading(true);
    try {
      const res = await mobileApi(token).dues(buildingId, { pageSize: 100 });
      setDues((res.data ?? []).filter((d) => d.unitId === unit.id).sort((a, b) => b.period.localeCompare(a.period)));
    } catch {}
    setDuesLoading(false);
  }, [token, buildingId, unit.id]);

  useEffect(() => {
    loadResidents();
    loadDues();
  }, []);

  const onSave = async () => {
    const floor = parseInt(form.floor, 10);
    const areaM2 = parseFloat(form.areaM2);
    if (!form.number.trim() || isNaN(floor) || isNaN(areaM2) || areaM2 <= 0) {
      Alert.alert('Hata', 'Lütfen tüm alanları doğru doldurun.');
      return;
    }
    setSaving(true);
    try {
      const updated = await mobileApi(token).updateUnit(buildingId, unit.id, {
        number: form.number.trim(), floor, type: form.type, areaM2, isOccupied: form.isOccupied,
      });
      setUnit(updated);
      navigation.setParams({ unit: updated });
      Alert.alert('Başarılı', 'Daire bilgileri güncellendi.');
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Güncellenemedi.');
    }
    setSaving(false);
  };

  const onUnassign = (residentId) => {
    Alert.alert('Daireyle İlişkiyi Kaldır', 'Emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Kaldır', style: 'destructive',
        onPress: async () => {
          try {
            await residentApi(token).removeUnit(residentId, unit.id);
            loadResidents();
          } catch (e) { Alert.alert('Hata', e.message); }
        },
      },
    ]);
  };

  const onAssign = async () => {
    if (!assignId) return;
    setAssigning(true);
    try {
      await residentApi(token).addUnit(assignId, unit.id);
      setAssignId('');
      loadResidents();
    } catch (e) { Alert.alert('Hata', e.message); }
    setAssigning(false);
  };

  const onAddResident = async () => {
    if (!resForm.fullName || !resForm.email || !resForm.password) {
      setResError('Ad soyad, e-posta ve şifre zorunludur.');
      return;
    }
    setResSaving(true);
    setResError('');
    try {
      await residentApi(token).register({
        fullName: resForm.fullName,
        email: resForm.email,
        phone: resForm.phone || null,
        password: resForm.password,
        buildingId,
        unitId: unit.id,
      });
      setAddResModal(false);
      setResForm(EMPTY_RESIDENT_FORM);
      loadResidents();
    } catch (e) {
      setResError(e.message ?? 'Sakin eklenemedi.');
    }
    setResSaving(false);
  };

  const openPay = (due) => {
    setPayTarget(due);
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayNote('');
    setPayModal(true);
  };

  const onPay = async () => {
    if (!payDate) return;
    setPaying(true);
    try {
      await mobileApi(token).payDue(buildingId, payTarget.id, { paidDate: payDate, note: payNote || null });
      setPayModal(false);
      loadDues();
    } catch (e) { Alert.alert('Hata', e.message); }
    setPaying(false);
  };

  const onUnpay = (due) => {
    Alert.alert('Ödemeyi Geri Al', `${due.period} dönemi ödemesi geri alınacak.`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Geri Al', style: 'destructive',
        onPress: async () => {
          try {
            await mobileApi(token).unpayDue(buildingId, due.id);
            loadDues();
          } catch (e) { Alert.alert('Hata', e.message); }
        },
      },
    ]);
  };

  const assignable = allResidents.filter((r) => !residents.find((x) => x.id === r.id));

  return (
    <SafeAreaView style={[BaseStyle.safeAreaView, { flex: 1 }]} edges={['right', 'top', 'left']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Icon name="arrow-left" size={18} color={colors.text} />
        </TouchableOpacity>
        <Text title3 bold style={{ flex: 1 }}>Daire {unit.number}</Text>
        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: unit.isOccupied ? colors.primary : colors.border }}>
          <Text caption2 style={{ color: unit.isOccupied ? '#fff' : colors.text }}>
            {unit.isOccupied ? 'Dolu' : 'Boş'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Daire Bilgileri ── */}
          <SectionTitle title="Daire Bilgileri" colors={colors} />
          <Card colors={colors}>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1.2 }}>
                <Text caption1 style={{ color: colors.text, opacity: 0.6, marginBottom: 4 }}>Daire No</Text>
                <TextInput
                  style={BaseStyle.textInput}
                  value={form.number}
                  onChangeText={(v) => setForm((f) => ({ ...f, number: v }))}
                  placeholder="1A"
                  autoCapitalize="characters"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text caption1 style={{ color: colors.text, opacity: 0.6, marginBottom: 4 }}>Kat</Text>
                <TextInput
                  style={BaseStyle.textInput}
                  value={form.floor}
                  onChangeText={(v) => setForm((f) => ({ ...f, floor: v }))}
                  keyboardType="number-pad"
                  placeholder="1"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text caption1 style={{ color: colors.text, opacity: 0.6, marginBottom: 4 }}>Alan (m²)</Text>
                <TextInput
                  style={BaseStyle.textInput}
                  value={form.areaM2}
                  onChangeText={(v) => setForm((f) => ({ ...f, areaM2: v }))}
                  keyboardType="decimal-pad"
                  placeholder="90"
                />
              </View>
            </View>
            <Text caption1 style={{ color: colors.text, opacity: 0.6, marginBottom: 8 }}>Tür</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {UnitTypes.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setForm((f) => ({ ...f, type: value }))}
                  style={{
                    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: form.type === value ? colors.primary : colors.border,
                    backgroundColor: form.type === value ? colors.primary : 'transparent',
                  }}
                >
                  <Text caption1 style={{ color: form.type === value ? '#fff' : colors.text }} bold={form.type === value}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Toggle label="Dolu" value={form.isOccupied} onChange={(v) => setForm((f) => ({ ...f, isOccupied: v }))} colors={colors} />
            <Button full loading={saving} style={{ marginTop: 14 }} onPress={onSave}>
              Kaydet
            </Button>
          </Card>

          {/* ── Kayıtlı Sakinler ── */}
          <SectionTitle title="Kayıtlı Sakinler" colors={colors} />
          <Card colors={colors}>
            {resLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                {residents.length === 0 ? (
                  <Text caption1 style={{ color: colors.text, opacity: 0.6, marginBottom: 10 }}>Bu daireye atanmış sakin yok.</Text>
                ) : (
                  residents.map((r) => (
                    <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                        <Text body2 style={{ color: '#FFFFFF', fontWeight: '700' }}>{r.fullName.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text body2 bold>{r.fullName}</Text>
                        <Text caption1 style={{ color: colors.text, opacity: 0.6 }}>{r.email}{r.phone ? ` · ${r.phone}` : ''}</Text>
                      </View>
                      <TouchableOpacity onPress={() => onUnassign(r.id)}>
                        <Icon name="times-circle" size={18} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}

                {assignable.length > 0 && (
                  <>
                    {/* Dropdown başlığı */}
                    <TouchableOpacity
                      onPress={() => { setDropdownOpen((o) => !o); setAssignId(''); }}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: dropdownOpen ? colors.primary : colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginTop: 4, marginBottom: dropdownOpen ? 0 : 10 }}
                    >
                      <Text caption1 style={{ color: assignId ? colors.text : colors.text, opacity: assignId ? 1 : 0.5 }}>
                        {assignId ? assignable.find((r) => r.id === assignId)?.fullName ?? 'Sakin seç' : 'Sakin seç...'}
                      </Text>
                      <Icon name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={12} color={colors.text} />
                    </TouchableOpacity>

                    {/* Açılır liste */}
                    {dropdownOpen && (
                      <View style={{ borderWidth: 1, borderTopWidth: 0, borderColor: colors.primary, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, marginBottom: 10, overflow: 'hidden' }}>
                        {assignable.map((r, i) => (
                          <TouchableOpacity
                            key={r.id}
                            onPress={() => { setAssignId(r.id); setDropdownOpen(false); }}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: assignId === r.id ? colors.primaryLight : colors.background, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}
                          >
                            <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: assignId === r.id ? colors.primary : colors.border, backgroundColor: assignId === r.id ? colors.primary : 'transparent' }} />
                            <Text caption1 style={{ color: colors.text, flex: 1 }}>
                              {r.fullName}{r.unitIds?.length > 0 ? <Text caption1 style={{ color: colors.text, opacity: 0.5 }}> (başka daire)</Text> : ''}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={onAssign}
                      disabled={!assignId || assigning}
                      style={{ paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: assignId ? colors.primary : colors.border, marginBottom: 10 }}
                    >
                      <Text caption1 style={{ color: assignId ? '#fff' : colors.text }} bold>
                        {assigning ? 'Atanıyor...' : 'Seçili Sakini Ata'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  onPress={() => { setResForm(EMPTY_RESIDENT_FORM); setResError(''); setAddResModal(true); }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}
                >
                  <Icon name="user-plus" size={14} color={colors.primary} />
                  <Text caption1 style={{ color: colors.primary }} bold>Yeni Sakin Ekle</Text>
                </TouchableOpacity>
              </>
            )}
          </Card>

          {/* ── Aidat Durumu ── */}
          <SectionTitle title="Aidat Durumu" colors={colors} />
          <Card colors={colors}>
            {duesLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : dues.length === 0 ? (
              <Text caption1 style={{ color: colors.text, opacity: 0.6 }}>Aidat kaydı bulunamadı.</Text>
            ) : (
              dues.slice(0, 6).map((d) => (
                <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View style={{ flex: 1 }}>
                    <Text body2 bold>{d.period}</Text>
                    <Text caption1 style={{ color: colors.text, opacity: 0.6 }}>{fmt(d.amount)}</Text>
                  </View>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: d.isPaid ? colors.primaryLight : '#fee2e2', marginRight: 8 }}>
                    <Text caption2 style={{ color: d.isPaid ? colors.primary : '#dc2626' }}>
                      {d.isPaid ? 'Ödendi' : 'Bekliyor'}
                    </Text>
                  </View>
                  {d.isPaid ? (
                    <TouchableOpacity onPress={() => onUnpay(d)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                      <Text caption2 style={{ color: colors.text }}>Geri Al</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => openPay(d)} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.primary }}>
                      <Text caption2 style={{ color: '#fff' }} bold>Öde</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </Card>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Yeni Sakin Modalı ── */}
      <Modal visible={addResModal} animationType="slide" transparent onRequestClose={() => setAddResModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Text title3 bold style={{ flex: 1 }}>Yeni Sakin Ekle</Text>
                <TouchableOpacity onPress={() => setAddResModal(false)}>
                  <Icon name="times" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {[
                  { label: 'Ad Soyad *', key: 'fullName', placeholder: 'Ad Soyad' },
                  { label: 'E-posta *', key: 'email', placeholder: 'ornek@mail.com', keyboard: 'email-address' },
                  { label: 'Telefon', key: 'phone', placeholder: '05xx xxx xx xx', keyboard: 'phone-pad' },
                  { label: 'Şifre *', key: 'password', placeholder: 'En az 6 karakter', secure: true },
                ].map(({ label, key, placeholder, keyboard, secure }) => (
                  <View key={key} style={{ marginBottom: 12 }}>
                    <Text caption1 style={{ color: colors.text, opacity: 0.6, marginBottom: 4 }}>{label}</Text>
                    <TextInput
                      style={BaseStyle.textInput}
                      value={resForm[key]}
                      onChangeText={(v) => setResForm((f) => ({ ...f, [key]: v }))}
                      placeholder={placeholder}
                      keyboardType={keyboard ?? 'default'}
                      secureTextEntry={!!secure}
                      autoCapitalize={key === 'email' ? 'none' : 'words'}
                    />
                  </View>
                ))}
                {resError !== '' && (
                  <View style={{ backgroundColor: '#fee2e2', borderRadius: 8, padding: 10, marginBottom: 12 }}>
                    <Text caption1 style={{ color: '#dc2626' }}>{resError}</Text>
                  </View>
                )}
                <Button full loading={resSaving} onPress={onAddResident} style={{ marginTop: 4, marginBottom: 8 }}>
                  Kaydet
                </Button>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Ödeme Modalı ── */}
      <Modal visible={payModal} animationType="slide" transparent onRequestClose={() => setPayModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Text title3 bold style={{ flex: 1 }}>Ödeme Al — {payTarget?.period}</Text>
              <TouchableOpacity onPress={() => setPayModal(false)}>
                <Icon name="times" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={{ backgroundColor: colors.primaryLight, borderRadius: 8, padding: 10, marginBottom: 16 }}>
              <Text body2>Tutar: <Text bold style={{ color: colors.primary }}>{fmt(payTarget?.amount ?? 0)}</Text></Text>
            </View>
            <Text caption1 style={{ color: colors.text, opacity: 0.6, marginBottom: 4 }}>Ödeme Tarihi</Text>
            <TextInput
              style={[BaseStyle.textInput, { marginBottom: 12 }]}
              value={payDate}
              onChangeText={setPayDate}
              placeholder="YYYY-MM-DD"
            />
            <Text caption1 style={{ color: colors.text, opacity: 0.6, marginBottom: 4 }}>Not (isteğe bağlı)</Text>
            <TextInput
              style={[BaseStyle.textInput, { marginBottom: 16 }]}
              value={payNote}
              onChangeText={setPayNote}
              placeholder="Nakit, havale vb."
            />
            <Button full loading={paying} onPress={onPay}>
              Ödemeyi Kaydet
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default UnitDetail;
