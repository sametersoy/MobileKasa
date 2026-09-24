import { useCallback, useEffect, useState } from 'react';
import { FlatList, View, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { BaseColor, BaseStyle, useTheme } from '@/config';
import { SafeAreaView, Text, Icon, TextInput, Button, Transaction2Col } from '@/components';
import { mobileApi, webApi } from '@/api';

const TYPES = ['Genel', 'Aidat', 'İhale', 'Anket', 'Bakım'];
const TYPE_ICONS = ['bell', 'file-invoice-dollar', 'gavel', 'poll-h', 'tools'];
const TYPE_COLORS = ['#6366F1', '#F59E0B', '#06B6D4', '#8B5CF6', '#EF4444'];

const EMPTY_FORM = { title: '', body: '', type: 0 };

export default function Bildirimler() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const token = useSelector((s) => s.auth?.token);
  const selectedBuildingId = useSelector((s) => s.building?.selectedId);
  const buildingList = useSelector((s) => s.building?.list ?? []);
  const buildingId = selectedBuildingId;
  const buildingName = buildingList.find((b) => b.id === selectedBuildingId)?.name ?? '';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token || !buildingId) { setLoading(false); setRefreshing(false); return; }
    try {
      const res = await mobileApi(token).notifications(buildingId, { pageSize: 50 });
      setItems(res.data ?? []);
    } catch (e) {
      console.warn('[Bildirimler] load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, buildingId]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleMarkRead = async (item) => {
    if (item.isRead) return;
    try {
      await mobileApi(token).markRead(buildingId, item.id);
      setItems((prev) => prev.map((n) => n.id === item.id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      Alert.alert('Hata', 'Başlık ve içerik zorunlu.');
      return;
    }
    setSaving(true);
    try {
      await webApi(token).sendNotification(buildingId, { ...form, targetUserId: null });
      setModalVisible(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Gönderilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Icon name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text header bold>Bildirimler</Text>
          {buildingName ? <Text caption1 grayColor style={{ marginTop: 2 }}>{buildingName}</Text> : null}
        </View>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}
        >
          <Icon name="paper-plane" size={13} color="white" />
          <Text caption1 whiteColor bold>Gönder</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl colors={[colors.primary]} tintColor={colors.primary} refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Icon name="bell-slash" size={48} color={BaseColor.grayColor} />
              <Text body1 grayColor style={{ marginTop: 12 }}>Henüz bildirim yok.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Transaction2Col
              icon={TYPE_ICONS[item.type] ?? 'bell'}
              name={item.title}
              date={item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : ''}
              status={TYPES[item.type] ?? 'Genel'}
              price={item.isRead ? 'Okundu' : 'Yeni'}
              isUp={!item.isRead}
              backgroundIcon={TYPE_COLORS[item.type] ?? colors.primary}
              style={{ paddingHorizontal: 20 }}
              onPress={() => handleMarkRead(item)}
            />
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Text title3 bold style={{ flex: 1 }}>Bildirim Gönder</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Icon name="times" size={20} color={BaseColor.grayColor} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text caption1 grayColor style={{ marginBottom: 6 }}>Tip</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  {TYPES.map((t, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setForm((f) => ({ ...f, type: i }))}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, marginRight: 8, borderColor: form.type === i ? colors.primary : colors.border, backgroundColor: form.type === i ? colors.primaryLight : 'transparent' }}
                    >
                      <Text caption1 style={{ color: form.type === i ? colors.primary : BaseColor.grayColor }}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text caption1 grayColor style={{ marginBottom: 6 }}>Başlık *</Text>
                <TextInput style={{ height: 44, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, backgroundColor: colors.card, marginBottom: 14 }} value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Bildirim başlığı" />

                <Text caption1 grayColor style={{ marginBottom: 6 }}>İçerik *</Text>
                <TextInput style={{ height: 100, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingTop: 10, backgroundColor: colors.card, marginBottom: 20, textAlignVertical: 'top' }} value={form.body} onChangeText={(v) => setForm((f) => ({ ...f, body: v }))} placeholder="Bildirim içeriği" multiline />

                <Button full loading={saving} onPress={handleSend}>Gönder</Button>
                <View style={{ height: 16 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
