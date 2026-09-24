import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import { BaseColor, BaseStyle, useTheme } from '@/config';
import { AuthActions } from '@/actions';
import { Button, SafeAreaView, Text, TextInput } from '@/components';
import styles from './styles';

const { authentication } = AuthActions;

const SignIn = ({ navigation }) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailValid = email.trim().length > 0 && email.includes('@');
  const passwordValid = password.length >= 6;

  const onLogin = () => {
    setTouched({ email: true, password: true });
    if (!emailValid || !passwordValid) return;

    setError('');
    setLoading(true);
    dispatch(
      authentication(email.trim(), password, (response) => {
        setLoading(false);
        if (response.success) {
          navigation.replace('CryptoMenu');
        } else {
          setError(response.error ?? 'E-posta veya şifre hatalı.');
        }
      })
    );
  };

  const offsetKeyboard = Platform.select({ ios: 0, android: 20 });

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={offsetKeyboard}
        style={{ flex: 1 }}
      >
        <View style={styles.contain}>
          {/* Logo / Başlık */}
          <View style={styles.header}>
            <Text title1 bold style={{ color: colors.primary }}>
              MobilKasa
            </Text>
            <Text body2 grayColor style={{ marginTop: 6 }}>
              Mağazanızın satış ve stok yönetimine giriş yapın
            </Text>
          </View>

          {/* Hata mesajı */}
          {error !== '' && (
            <View style={styles.errorBox}>
              <Text body2 style={{ color: '#dc3545' }}>
                {error}
              </Text>
            </View>
          )}

          {/* E-posta */}
          <TextInput
            style={[
              BaseStyle.textInput,
              touched.email && !emailValid && { borderColor: colors.primary, borderWidth: 1 },
            ]}
            onChangeText={(text) => { setEmail(text); setError(''); }}
            onFocus={() => setTouched((t) => ({ ...t, email: true }))}
            autoCorrect={false}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="E-posta adresi"
            placeholderTextColor={touched.email && !emailValid ? colors.primary : BaseColor.grayColor}
            value={email}
            selectionColor={colors.primary}
          />
          {touched.email && !emailValid && (
            <Text caption1 style={{ color: colors.primary, marginTop: 4, marginBottom: 4 }}>
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
            onChangeText={(text) => { setPassword(text); setError(''); }}
            onFocus={() => setTouched((t) => ({ ...t, password: true }))}
            autoCorrect={false}
            placeholder="Şifre"
            secureTextEntry={true}
            placeholderTextColor={touched.password && !passwordValid ? colors.primary : BaseColor.grayColor}
            value={password}
            selectionColor={colors.primary}
          />
          {touched.password && !passwordValid && (
            <Text caption1 style={{ color: colors.primary, marginTop: 4 }}>
              Şifre en az 6 karakter olmalı.
            </Text>
          )}

          {/* Giriş Yap */}
          <Button
            full
            loading={loading}
            style={{ marginTop: 24 }}
            onPress={onLogin}
          >
            Giriş Yap
          </Button>

          {/* Şifremi unuttum */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ResetPassword')}
          >
            <Text body2 grayColor>
              Şifremi unuttum
            </Text>
          </TouchableOpacity>

          {/* Kayıt Ol */}
          <TouchableOpacity
            style={{ marginTop: 12, alignItems: 'center' }}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text body2 grayColor>
              Hesabınız yok mu?{' '}
              <Text body2 style={{ color: colors.primary, fontWeight: 'bold' }}>
                Kayıt Ol
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;
