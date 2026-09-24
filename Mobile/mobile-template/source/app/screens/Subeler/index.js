import { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { BaseStyle, BaseColor, useTheme } from '@/config';
import { SafeAreaView, Text, Icon, Button } from '@/components';
import { useStore, ROLE_LABELS } from '@/context/StoreContext';
import { ScreenHeader, HeaderButton, Sheet, Field, Chip, COLORS } from '@/components/Retail';

const EMPTY = { name: '', address: '', phone: '', taxNumber: '' };

export default function Subeler() {
  const { colors } = useTheme();
  const { stores, store, selectStore, reload, api } = useStore();
  const [editing, setEditing] = useState(null); // null | { id?, role?, ...form }
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!editing.name.trim()) {
      Alert.alert('Eksik bilgi', 'Şube adı zorunlu.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: editing.name,
        address: editing.address,
        phone: editing.phone,
        taxNumber: editing.taxNumber,
      };
      const saved = editing.id ? await api.update(editing.id, body) : await api.create(body);
      await reload();
      if (!editing.id) selectStore(saved.id);
      setEditing(null);
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const close = () =>
    Alert.alert(
      'Şubeyi Kapat',
      `${editing.name} kapatılsın mı? Satış ve stok kayıtları silinmez ama şube listeden kalkar.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kapat',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deactivate(editing.id);
              setEditing(null);
              await reload();
            } catch (e) {
              Alert.alert('Hata', e.message);
            }
          },
        },
      ]
    );

  const set = (key) => (value) => setEditing((f) => ({ ...f, [key]: value }));

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <ScreenHeader
        title="Şubeler"
        subtitle={`${stores.length} şube`}
        back
        right={<HeaderButton icon="plus" label="Yeni Şube" onPress={() => setEditing({ ...EMPTY })} />}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {stores.map((s) => {
          const current = s.id === store?.id;
          return (
            <View
              key={s.id}
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: current ? colors.primary : 'transparent' },
              ]}
            >
              <TouchableOpacity
                onPress={() => selectStore(s.id)}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <View style={[styles.icon, { backgroundColor: current ? colors.primary : '#E5E7EB' }]}>
                  <Icon name="store" size={16} color={current ? '#fff' : BaseColor.grayColor} />
                </View>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text body1 bold>
                    {s.name}
                  </Text>
                  <Text caption1 grayColor style={{ marginTop: 2 }} numberOfLines={1}>
                    {[ROLE_LABELS[s.role], s.address, s.phone].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                {current ? (
                  <Text caption1 bold style={{ color: colors.primary }}>
                    Aktif
                  </Text>
                ) : (
                  <Text caption1 grayColor>
                    Geç
                  </Text>
                )}
              </TouchableOpacity>
              {s.role !== 2 && (
                <TouchableOpacity
                  onPress={() =>
                    setEditing({ ...EMPTY, ...Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v ?? ''])) })
                  }
                  style={[styles.editLink, { borderTopColor: colors.border }]}
                >
                  <Icon name="cog" size={12} color={colors.primary} />
                  <Text caption1 style={{ marginLeft: 6, color: colors.primary }}>
                    {s.role === 0 ? 'Bilgiler ve çalışanlar' : 'Şube bilgileri'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Sheet
        visible={!!editing}
        title={editing?.id ? editing.name || 'Şube' : 'Yeni Şube'}
        onClose={() => setEditing(null)}
        footer={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {editing?.id && editing.role === 0 && stores.filter((s) => s.role === 0).length > 1 ? (
              <Button outline style={{ flex: 1 }} onPress={close}>
                Şubeyi Kapat
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
            <Field label="Şube adı *" value={editing.name} onChangeText={set('name')} placeholder="Örn. Merkez Şube" />
            <Field label="Adres" value={editing.address} onChangeText={set('address')} placeholder="Adres" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Field
                style={{ flex: 1 }}
                label="Telefon"
                value={editing.phone}
                onChangeText={set('phone')}
                keyboardType="phone-pad"
                placeholder="0xxx"
              />
              <Field
                style={{ flex: 1 }}
                label="Vergi no"
                value={editing.taxNumber}
                onChangeText={set('taxNumber')}
                keyboardType="number-pad"
                placeholder="VKN"
              />
            </View>
            {editing.id && editing.role === 0 ? <Members storeId={editing.id} /> : null}
          </>
        )}
      </Sheet>
    </SafeAreaView>
  );
}

// Şube çalışanları: sahip, kayıtlı kullanıcıları e-posta ile kasiyer/yönetici olarak ekler
function Members({ storeId }) {
  const { colors } = useTheme();
  const { api } = useStore();
  const [members, setMembers] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(2);
  const [adding, setAdding] = useState(false);

  const load = () =>
    api
      .members(storeId)
      .then(setMembers)
      .catch(() => setMembers([]));
  useEffect(() => {
    load();
  }, [storeId]);

  const add = async () => {
    if (!email.trim()) return;
    setAdding(true);
    try {
      await api.addMember(storeId, { email: email.trim(), role });
      setEmail('');
      load();
    } catch (e) {
      Alert.alert('Eklenemedi', e.message);
    } finally {
      setAdding(false);
    }
  };

  const remove = (m) =>
    Alert.alert('Çalışanı Çıkar', `${m.fullName} bu şubeden çıkarılsın mı?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkar',
        style: 'destructive',
        onPress: () =>
          api
            .removeMember(storeId, m.userId)
            .then(load)
            .catch((e) => Alert.alert('Hata', e.message)),
      },
    ]);

  return (
    <View style={{ marginTop: 20 }}>
      <Text body1 bold>
        Çalışanlar
      </Text>
      {members == null ? (
        <ActivityIndicator style={{ marginTop: 10 }} />
      ) : (
        members.map((m) => (
          <View key={m.userId} style={[styles.memberRow, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text body2 bold>
                {m.fullName}
              </Text>
              <Text caption2 grayColor>
                {m.email} · {ROLE_LABELS[m.role]}
              </Text>
            </View>
            {m.role !== 0 && (
              <TouchableOpacity onPress={() => remove(m)} style={{ padding: 6 }}>
                <Icon name="user-minus" size={14} color={COLORS.danger} />
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
      <Field
        label="Çalışan ekle (kayıtlı e-posta)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="kasiyer@ornek.com"
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
        <Chip label="Kasiyer" active={role === 2} onPress={() => setRole(2)} />
        <Chip label="Yönetici" active={role === 1} onPress={() => setRole(1)} />
        <View style={{ flex: 1 }} />
        <Button style={{ paddingHorizontal: 18 }} onPress={add} loading={adding} disabled={adding || !email.trim()}>
          Ekle
        </Button>
      </View>
      <Text caption2 grayColor style={{ marginTop: 8 }}>
        Kasiyer satış yapabilir; yönetici ayrıca fiyat, stok girişi ve tedarikçileri yönetebilir.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 14, marginTop: 10, borderWidth: 1.5 },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
