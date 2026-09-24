import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { BaseColor, BaseStyle, useTheme } from '@/config';
import { Button, Icon, SafeAreaView, Text, TextInput } from '@/components';
import { AuthActions } from '@/actions';
import { mobileApi, residentApi } from '@/api';

const FB_TYPES = [
  { label: 'Genel', value: 0, icon: 'comment', color: '#6B7280' },
  { label: 'Hata', value: 1, icon: 'bug', color: '#EF4444' },
  { label: 'Öneri', value: 2, icon: 'lightbulb', color: '#10B981' },
  { label: 'Şikayet', value: 3, icon: 'exclamation-circle', color: '#F59E0B' },
];

const Profile = ({ navigation }) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user);
  const token = useSelector((state) => state.auth?.token);

  const [fbVisible, setFbVisible] = useState(false);
  const [fbForm, setFbForm] = useState({ type: 0, subject: '', message: '', rating: null });
  const [fbSaving, setFbSaving] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleSendFeedback = async () => {
    if (!fbForm.subject.trim() || !fbForm.message.trim()) {
      Alert.alert('Hata', 'Konu ve mesaj zorunludur.');
      return;
    }
    setFbSaving(true);
    try {
      await mobileApi(token).sendFeedback(fbForm);
      setFbVisible(false);
      setFbForm({ type: 0, subject: '', message: '', rating: null });
      Alert.alert('Teşekkürler', 'Geri bildiriminiz iletildi.');
    } catch (e) {
      Alert.alert('Hata', e.message ?? 'Gönderilemedi.');
    } finally {
      setFbSaving(false);
    }
  };

  const styleItem = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  };

  const onLogOut = () => {
    dispatch(AuthActions.logout());
    navigation.replace('SignIn');
  };

  const onDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Hesabınızı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinecektir.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Devam Et', style: 'destructive', onPress: () => setDeleteVisible(true) },
      ],
    );
  };

  const confirmDelete = () => {
    Alert.alert(
      'Son Onay',
      'Hesabınız kalıcı olarak silinecek. Emin misiniz?',
      [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'Evet, Sil',
          style: 'destructive',
          onPress: async () => {
            setDeleteLoading(true);
            try {
              await residentApi(token).deleteAccount();
              dispatch(AuthActions.logout());
              navigation.replace('SignIn');
            } catch (e) {
              Alert.alert('Hata', e.message ?? 'Hesap silinemedi.');
            } finally {
              setDeleteLoading(false);
              setDeleteVisible(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <View style={[BaseStyle.container, { flex: 1 }]}>
        <View style={{ marginBottom: 20 }}>
          <Text header bold>Ayarlar</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Kullanıcı Bilgisi */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 16,
              marginBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon name="user" size={24} color="#fff" />
            </View>
            <View>
              <Text body1 bold>{user?.fullName ?? ''}</Text>
              <Text caption1 grayColor style={{ marginTop: 2 }}>{user?.email ?? ''}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
                <Text caption2 style={{ color: colors.primary }}>{user?.role ?? ''}</Text>
              </View>
            </View>
          </View>

          {/* Menü */}
          <TouchableOpacity style={styleItem} onPress={() => navigation.navigate('ChangePassword')}>
            <Text body1>Şifre Değiştir</Text>
            <Icon name="angle-right" size={18} color={colors.primary} enableRTL />
          </TouchableOpacity>

          <TouchableOpacity style={styleItem} onPress={() => navigation.navigate('AboutUs')}>
            <Text body1>Hakkımızda</Text>
            <Icon name="angle-right" size={18} color={colors.primary} enableRTL />
          </TouchableOpacity>

          <TouchableOpacity style={styleItem} onPress={() => setFbVisible(true)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="comment-alt" size={15} color={colors.primary} solid />
              <Text body1>Geri Bildirim Gönder</Text>
            </View>
            <Icon name="angle-right" size={18} color={colors.primary} enableRTL />
          </TouchableOpacity>

          <TouchableOpacity style={[styleItem, { borderBottomWidth: 0 }]} onPress={onDeleteAccount}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="trash-alt" size={15} color="#EF4444" solid />
              <Text body1 style={{ color: '#EF4444' }}>Hesabı Sil</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Hesap Silme Onay Modalı */}
        <Modal visible={deleteVisible} animationType="slide" transparent onRequestClose={() => setDeleteVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="trash-alt" size={24} color="#EF4444" solid />
                </View>
                <Text title3 bold style={{ textAlign: 'center' }}>Hesabı Kalıcı Olarak Sil</Text>
                <Text body2 grayColor style={{ textAlign: 'center', marginTop: 8 }}>
                  Bu işlem geri alınamaz. Hesabınıza ait tüm veriler kalıcı olarak silinecektir.
                </Text>
              </View>
              <Button full style={{ backgroundColor: '#EF4444', marginBottom: 12 }} loading={deleteLoading} onPress={confirmDelete}>
                Hesabımı Kalıcı Olarak Sil
              </Button>
              <Button full outline onPress={() => setDeleteVisible(false)}>
                Vazgeç
              </Button>
              <View style={{ height: 8 }} />
            </View>
          </View>
        </Modal>

        {/* Geri Bildirim Modal */}
        <Modal visible={fbVisible} animationType="slide" transparent onRequestClose={() => setFbVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  <Text title3 bold style={{ flex: 1 }}>Geri Bildirim</Text>
                  <TouchableOpacity onPress={() => setFbVisible(false)}>
                    <Icon name="times" size={20} color={BaseColor.grayColor} />
                  </TouchableOpacity>
                </View>

                {/* Tür seçimi */}
                <Text caption1 grayColor style={{ marginBottom: 8 }}>Tür</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                  {FB_TYPES.map((ft) => (
                    <TouchableOpacity
                      key={ft.value}
                      onPress={() => setFbForm((f) => ({ ...f, type: ft.value }))}
                      style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: fbForm.type === ft.value ? ft.color : colors.border, backgroundColor: fbForm.type === ft.value ? ft.color + '20' : 'transparent' }}
                    >
                      <Icon name={ft.icon} size={16} color={fbForm.type === ft.value ? ft.color : BaseColor.grayColor} solid />
                      <Text caption2 style={{ color: fbForm.type === ft.value ? ft.color : BaseColor.grayColor, marginTop: 3 }}>{ft.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Puan */}
                <Text caption1 grayColor style={{ marginBottom: 8 }}>Puan (isteğe bağlı)</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity key={n} onPress={() => setFbForm((f) => ({ ...f, rating: f.rating === n ? null : n }))}>
                      <Icon name="star" size={28} solid color={fbForm.rating >= n ? '#F59E0B' : colors.border} />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Konu */}
                <Text caption1 grayColor style={{ marginBottom: 6 }}>Konu *</Text>
                <TextInput
                  style={{ height: 44, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, backgroundColor: colors.card, marginBottom: 14 }}
                  value={fbForm.subject}
                  onChangeText={(v) => setFbForm((f) => ({ ...f, subject: v }))}
                  placeholder="Kısa bir başlık"
                />

                {/* Mesaj */}
                <Text caption1 grayColor style={{ marginBottom: 6 }}>Mesaj *</Text>
                <TextInput
                  style={{ height: 90, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingTop: 10, backgroundColor: colors.card, textAlignVertical: 'top', marginBottom: 16 }}
                  value={fbForm.message}
                  onChangeText={(v) => setFbForm((f) => ({ ...f, message: v }))}
                  placeholder="Detayları yazın..."
                  multiline
                />

                <Button full loading={fbSaving} onPress={handleSendFeedback}>Gönder</Button>
                <View style={{ height: 16 }} />
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </View>

      <View style={{ padding: 10 }}>
        <Button full onPress={onLogOut}>
          Çıkış Yap
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
