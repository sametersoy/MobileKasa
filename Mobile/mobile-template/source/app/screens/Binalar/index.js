import { useCallback, useEffect, useState } from 'react';
import {
  FlatList, View, TouchableOpacity, RefreshControl, ActivityIndicator,
  Modal, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { BaseColor, BaseStyle, useTheme } from '@/config';
import { SafeAreaView, Text, Icon, TextInput, Button } from '@/components';
import { webApi } from '@/api';
import * as actionTypes from '@/actions/actionTypes';

const BUILDING_TYPES = [
  { value: 0, label: 'Apartman' },
  { value: 1, label: 'Site' },
];

const EMPTY_FORM = { name: '', address: '', type: 0 };

const BuildingItem = ({ item, colors, onEdit, onDelete, isSelected, onSelect }) => (
  <TouchableOpacity
    onPress={onSelect}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: isSelected ? colors.primary + '18' : colors.card,
    }}
  >
    <View
      style={{
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: isSelected ? colors.primary : BaseColor.fieldColor,
        justifyContent: 'center', alignItems: 'center', marginRight: 14,
      }}
    >
      <Icon name="city" size={20} color={isSelected ? '#fff' : BaseColor.grayColor} solid />
    </View>
    <View style={{ flex: 1 }}>
      <Text body1 bold numberOfLines={1}>{item.name}</Text>
      <Text caption1 grayColor numberOfLines={1} style={{ marginTop: 2 }}>{item.address}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <View style={{ backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text caption2 style={{ color: '#fff' }}>{BUILDING_TYPES[item.type]?.label ?? 'Bina'}</Text>
        </View>
        <Text caption2 grayColor>{item.unitCount ?? 0} daire</Text>
      </View>
    </View>
    {isSelected && (
      <View style={{ marginRight: 8 }}>
        <Icon name="check-circle" size={18} color={colors.primary} solid />
      </View>
    )}
    <TouchableOpacity onPress={onEdit} style={{ padding: 8 }}>
      <Icon name="edit" size={16} color={BaseColor.grayColor} />
    </TouchableOpacity>
    <TouchableOpacity onPress={onDelete} style={{ padding: 8 }}>
      <Icon name="trash-alt" size={16} color="#EF4444" />
    </TouchableOpacity>
  </TouchableOpacity>
);

export default function Binalar({ navigation }) {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth?.token);
  const selectedId = useSelector((state) => state.building?.selectedId);

  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await webApi(token).buildings();
      const list = res.data ?? res ?? [];
      setBuildings(list);
      dispatch({ type: actionTypes.SET_BUILDINGS, buildings: list });
    } catch (e) {
      console.warn('[Binalar] load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (b) => {
    setEditTarget(b);
    setForm({ name: b.name, address: b.address, type: b.type });
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  const onSave = async () => {
    if (!form.name.trim()) { Alert.alert('Hata', 'Bina adı gerekli.'); return; }
    if (!form.address.trim()) { Alert.alert('Hata', 'Adres gerekli.'); return; }
    setSaving(true);
    try {
      const api = webApi(token);
      if (editTarget) {
        await api.updateBuilding(editTarget.id, form);
      } else {
        await api.addBuilding(form);
      }
      closeModal();
      await load();
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Kayıt başarısız.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (b) => {
    Alert.alert(
      'Binayı Sil',
      `"${b.name}" silinecek. Emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            try {
              await webApi(token).deleteBuilding(b.id);
              await load();
            } catch (e) {
              Alert.alert('Hata', e.message ?? 'Silinemedi.');
            }
          },
        },
      ],
    );
  };

  const onSelect = (b) => {
    dispatch({ type: actionTypes.SELECT_BUILDING, id: b.id });
  };

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      {/* Başlık */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Icon name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text header bold style={{ flex: 1 }}>Binalar</Text>
        <TouchableOpacity
          onPress={openAdd}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: colors.primary, paddingHorizontal: 14,
            paddingVertical: 8, borderRadius: 20,
          }}
        >
          <Icon name="plus" size={13} color="white" />
          <Text caption1 whiteColor bold>Bina Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Özet */}
      {!loading && buildings.length > 0 && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <Text caption1 grayColor>
            Toplam {buildings.length} bina · Aktif bina{' '}
            <Text caption1 style={{ color: colors.primary }}>
              {buildings.find((b) => b.id === selectedId)?.name ?? '—'}
            </Text>
          </Text>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={buildings}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl colors={[colors.primary]} tintColor={colors.primary} refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Icon name="city" size={48} color={BaseColor.grayColor} />
              <Text body1 grayColor style={{ marginTop: 12 }}>Henüz bina eklenmedi.</Text>
              <TouchableOpacity onPress={openAdd} style={{ marginTop: 16 }}>
                <Text body2 style={{ color: colors.primary }}>İlk binayı ekle</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <BuildingItem
              item={item}
              colors={colors}
              isSelected={item.id === selectedId}
              onSelect={() => onSelect(item)}
              onEdit={() => openEdit(item)}
              onDelete={() => onDelete(item)}
            />
          )}
        />
      )}

      {/* Ekle / Düzenle Modalı */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Text title3 bold style={{ flex: 1 }}>
                  {editTarget ? 'Binayı Düzenle' : 'Yeni Bina Ekle'}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <Icon name="times" size={20} color={BaseColor.grayColor} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text caption1 grayColor style={{ marginBottom: 6 }}>Bina Adı *</Text>
                <TextInput
                  style={[BaseStyle.textInput, { marginBottom: 14 }]}
                  placeholder="örn. Gül Apartmanı"
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                />

                <Text caption1 grayColor style={{ marginBottom: 6 }}>Adres *</Text>
                <TextInput
                  style={[BaseStyle.textInput, { marginBottom: 14 }]}
                  placeholder="örn. Atatürk Cad. No:5, İstanbul"
                  value={form.address}
                  onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                  multiline
                />

                <Text caption1 grayColor style={{ marginBottom: 10 }}>Bina Tipi</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                  {BUILDING_TYPES.map(({ value, label }) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() => setForm((f) => ({ ...f, type: value }))}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: 10,
                        alignItems: 'center', borderWidth: 1.5,
                        borderColor: form.type === value ? colors.primary : colors.border,
                        backgroundColor: form.type === value ? colors.primary + '18' : 'transparent',
                      }}
                    >
                      <Text
                        caption1 bold={form.type === value}
                        style={{ color: form.type === value ? colors.primary : BaseColor.grayColor }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Button full loading={saving} onPress={onSave}>
                  {editTarget ? 'Güncelle' : 'Kaydet'}
                </Button>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
