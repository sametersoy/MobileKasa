import { useCallback, useEffect, useState } from 'react';
import { FlatList, View, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { BaseColor, BaseStyle, useTheme } from '@/config';
import { SafeAreaView, Text, Icon, TextInput, Button, Transaction2Col } from '@/components';
import { webApi } from '@/api';

const STATUS = [
  { label: 'Açık', color: '#10B981' },
  { label: 'Kapalı', color: '#6B7280' },
  { label: 'Tamamlandı', color: '#6366F1' },
];

export default function Ihaleler() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const token = useSelector((s) => s.auth?.token);
  const selectedBuildingId = useSelector((s) => s.building?.selectedId);
  const buildingList = useSelector((s) => s.building?.list ?? []);
  const buildingId = selectedBuildingId;
  const buildingName = buildingList.find((b) => b.id === selectedBuildingId)?.name ?? '';

  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedTender, setSelectedTender] = useState(null);
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', deadline: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token || !buildingId) { setLoading(false); setRefreshing(false); return; }
    try {
      const res = await webApi(token).tenders(buildingId);
      setTenders(res ?? []);
    } catch (e) {
      console.warn('[Ihaleler] load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, buildingId]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const loadOffers = async (tender) => {
    setSelectedTender(tender);
    setOffersLoading(true);
    try {
      const res = await webApi(token).tenderDetail(buildingId, tender.id);
      setOffers(res.offers ?? []);
    } catch {
      setOffers([]);
    } finally {
      setOffersLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.deadline) { Alert.alert('Hata', 'Başlık ve son teklif tarihi zorunlu.'); return; }
    setSaving(true);
    try {
      await webApi(token).addTender(buildingId, form);
      setModalVisible(false);
      setForm({ title: '', description: '', deadline: '' });
      load();
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (tender) => {
    Alert.alert('İhaleyi Kapat', 'İhale kapatılsın mı?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Kapat', onPress: async () => {
        try { await webApi(token).closeTender(buildingId, tender.id); load(); if (selectedTender?.id === tender.id) setSelectedTender(null); }
        catch (e) { Alert.alert('Hata', e.message); }
      }},
    ]);
  };

  const handleAward = async (offer) => {
    Alert.alert('Teklifi Seç', `${offer.companyName} firmasının teklifi seçilsin mi?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Seç', onPress: async () => {
        try { await webApi(token).awardOffer(buildingId, selectedTender.id, offer.id); loadOffers(selectedTender); load(); }
        catch (e) { Alert.alert('Hata', e.message); }
      }},
    ]);
  };

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Icon name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text header bold>İhaleler</Text>
          {buildingName ? <Text caption1 grayColor style={{ marginTop: 2 }}>{buildingName}</Text> : null}
        </View>
        <TouchableOpacity onPress={() => { setForm({ title: '', description: '', deadline: '' }); setModalVisible(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
          <Icon name="plus" size={13} color="white" />
          <Text caption1 whiteColor bold>İhale Yayınla</Text>
        </TouchableOpacity>
      </View>

      {/* Seçili ihale teklifleri */}
      {selectedTender && (
        <View style={{ marginHorizontal: 20, marginBottom: 8, backgroundColor: colors.card, borderRadius: 12, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text body2 bold style={{ flex: 1 }}>{selectedTender.title} — Teklifler</Text>
            <TouchableOpacity onPress={() => setSelectedTender(null)}>
              <Icon name="times" size={16} color={BaseColor.grayColor} />
            </TouchableOpacity>
          </View>
          {offersLoading ? <ActivityIndicator size="small" color={colors.primary} /> : offers.length === 0 ? (
            <Text caption1 grayColor>Henüz teklif gelmemiş.</Text>
          ) : offers.map((o) => (
            <View key={o.id} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text body2 bold>{o.companyName}</Text>
                  <Text caption1 grayColor>{o.contactEmail}</Text>
                  <Text body2 bold style={{ color: '#10B981', marginTop: 2 }}>₺{Number(o.amount).toLocaleString('tr-TR')}</Text>
                  {o.description ? <Text caption1 grayColor numberOfLines={2}>{o.description}</Text> : null}
                </View>
                {o.isAwarded ? (
                  <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text caption2 style={{ color: '#10B981' }}>Seçildi</Text>
                  </View>
                ) : selectedTender.status === 1 ? (
                  <TouchableOpacity onPress={() => handleAward(o)} style={{ backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text caption2 whiteColor>Seç</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
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
          data={tenders}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl colors={[colors.primary]} tintColor={colors.primary} refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<View style={{ alignItems: 'center', marginTop: 60 }}><Icon name="gavel" size={48} color={BaseColor.grayColor} /><Text body1 grayColor style={{ marginTop: 12 }}>Henüz ihale yayınlanmadı.</Text></View>}
          renderItem={({ item }) => {
            const st = STATUS[item.status] ?? STATUS[0];
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Transaction2Col
                    icon="gavel"
                    name={item.title}
                    date={`Son teklif: ${item.deadline} · ${item.offerCount} teklif`}
                    status={item.description}
                    price={st.label}
                    isUp={item.status === 0}
                    backgroundIcon={st.color}
                    style={{ paddingHorizontal: 20 }}
                    onPress={() => loadOffers(item)}
                  />
                </View>
                {item.status === 0 && (
                  <TouchableOpacity onPress={() => handleClose(item)} style={{ paddingHorizontal: 14, paddingVertical: 20 }}>
                    <Icon name="lock" size={15} color={BaseColor.grayColor} />
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Text title3 bold style={{ flex: 1 }}>Yeni İhale</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Icon name="times" size={20} color={BaseColor.grayColor} /></TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {[
                  { label: 'Başlık *', key: 'title', placeholder: 'İhale başlığı' },
                  { label: 'Açıklama', key: 'description', placeholder: 'İhale detayları' },
                  { label: 'Son Teklif Tarihi * (YYYY-AA-GG)', key: 'deadline', placeholder: '2026-06-01' },
                ].map(({ label, key, placeholder }) => (
                  <View key={key} style={{ marginBottom: 14 }}>
                    <Text caption1 grayColor style={{ marginBottom: 6 }}>{label}</Text>
                    <TextInput style={{ height: key === 'description' ? 80 : 44, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingTop: key === 'description' ? 10 : 0, backgroundColor: colors.card, textAlignVertical: key === 'description' ? 'top' : 'center' }} value={form[key]} onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))} placeholder={placeholder} multiline={key === 'description'} />
                  </View>
                ))}
                <Button full loading={saving} onPress={handleSave}>Yayınla</Button>
                <View style={{ height: 16 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
