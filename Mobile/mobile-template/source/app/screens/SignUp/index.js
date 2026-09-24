import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { BaseColor, BaseStyle, useTheme } from '@/config';
import { authApi } from '@/api';
import { Button, Header, Icon, SafeAreaView, Text, TextInput } from '@/components';
import styles from './styles';

const SignUp = ({ navigation }) => {
  const { colors } = useTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ fullName: false, email: false, password: false, password2: false });

  const fullNameValid = fullName.trim().length >= 2;
  const emailValid = email.trim().length > 0 && email.includes('@');
  const passwordValid = password.length >= 6;
  const password2Valid = password2 === password && password2.length > 0;

  const onRegister = async () => {
    setTouched({ fullName: true, email: true, password: true, password2: true });
    if (!fullNameValid || !emailValid || !passwordValid || !password2Valid) return;

    setError('');
    setLoading(true);
    try {
      await authApi.register(fullName.trim(), email.trim(), password);
      Alert.alert(
        'Kayıt Başarılı',
        'Hesabınız oluşturuldu. Giriş yapabilirsiniz.',
        [{ text: 'Tamam', onPress: () => navigation.replace('SignIn') }]
      );
    } catch (err) {
      setError(err?.message ?? 'Kayıt başarısız. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const offsetKeyboard = Platform.select({ ios: 0, android: 20 });

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <Header
        title="Kayıt Ol"
        renderLeft={() => (
          <Icon name="angle-left" size={20} color={colors.primary} enableRTL={true} />
        )}
        onPressLeft={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={offsetKeyboard}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.contain}
          keyboardShouldPersistTaps="handled"
        >
          {/* Başlık */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text title3 bold style={{ color: colors.primary }}>
              Yeni Hesap Oluştur
            </Text>
            <Text body2 grayColor style={{ marginTop: 4, textAlign: 'center' }}>
              Mağazanızı yönetmek için{'\n'}ücretsiz hesap oluşturun.
            </Text>
          </View>

          {/* Hata mesajı */}
          {error !== '' && (
            <View style={styles.errorBox}>
              <Text body2 style={{ color: '#dc3545' }}>{error}</Text>
            </View>
          )}

          {/* Ad Soyad */}
          <TextInput
            style={[
              BaseStyle.textInput,
              touched.fullName && !fullNameValid && { borderColor: colors.primary, borderWidth: 1 },
            ]}
            onChangeText={(t) => { setFullName(t); setError(''); }}
            onFocus={() => setTouched((p) => ({ ...p, fullName: true }))}
            autoCorrect={false}
            placeholder="Ad Soyad"
            placeholderTextColor={touched.fullName && !fullNameValid ? colors.primary : BaseColor.grayColor}
            value={fullName}
            selectionColor={colors.primary}
          />
          {touched.fullName && !fullNameValid && (
            <Text caption1 style={{ color: colors.primary, marginTop: 4, alignSelf: 'flex-start' }}>
              Ad Soyad en az 2 karakter olmalı.
            </Text>
          )}

          {/* E-posta */}
          <TextInput
            style={[
              BaseStyle.textInput,
              { marginTop: 10 },
              touched.email && !emailValid && { borderColor: colors.primary, borderWidth: 1 },
            ]}
            onChangeText={(t) => { setEmail(t); setError(''); }}
            onFocus={() => setTouched((p) => ({ ...p, email: true }))}
            autoCorrect={false}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="E-posta adresi"
            placeholderTextColor={touched.email && !emailValid ? colors.primary : BaseColor.grayColor}
            value={email}
            selectionColor={colors.primary}
          />
          {touched.email && !emailValid && (
            <Text caption1 style={{ color: colors.primary, marginTop: 4, alignSelf: 'flex-start' }}>
              Geçerli bir e-posta adresi girin.
            </Text>
          )}

          {/* Şifre */}
          <TextInput
            style={[
              BaseStyle.textInput,
              { marginTop: 10 },
              touched.password && !passwordValid && { borderColor: colors.primary, borderWidth: 1 },
            ]}
            onChangeText={(t) => { setPassword(t); setError(''); }}
            onFocus={() => setTouched((p) => ({ ...p, password: true }))}
            autoCorrect={false}
            placeholder="Şifre (en az 6 karakter)"
            secureTextEntry={true}
            placeholderTextColor={touched.password && !passwordValid ? colors.primary : BaseColor.grayColor}
            value={password}
            selectionColor={colors.primary}
          />
          {touched.password && !passwordValid && (
            <Text caption1 style={{ color: colors.primary, marginTop: 4, alignSelf: 'flex-start' }}>
              Şifre en az 6 karakter olmalı.
            </Text>
          )}

          {/* Şifre Tekrar */}
          <TextInput
            style={[
              BaseStyle.textInput,
              { marginTop: 10 },
              touched.password2 && !password2Valid && { borderColor: colors.primary, borderWidth: 1 },
            ]}
            onChangeText={(t) => { setPassword2(t); setError(''); }}
            onFocus={() => setTouched((p) => ({ ...p, password2: true }))}
            autoCorrect={false}
            placeholder="Şifre tekrar"
            secureTextEntry={true}
            placeholderTextColor={touched.password2 && !password2Valid ? colors.primary : BaseColor.grayColor}
            value={password2}
            selectionColor={colors.primary}
          />
          {touched.password2 && !password2Valid && (
            <Text caption1 style={{ color: colors.primary, marginTop: 4, alignSelf: 'flex-start' }}>
              Şifreler eşleşmiyor.
            </Text>
          )}

          {/* Kayıt Ol */}
          <Button full loading={loading} style={{ marginTop: 24 }} onPress={onRegister}>
            Hesap Oluştur
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;
