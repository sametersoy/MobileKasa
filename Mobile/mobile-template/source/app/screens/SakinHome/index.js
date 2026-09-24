import { View, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { BaseStyle, useTheme } from '@/config';
import { AuthActions } from '@/actions';
import { SafeAreaView, Text } from '@/components';

const SakinHome = ({ navigation }) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const onLogout = () => {
    dispatch(AuthActions.logout());
    navigation.replace('SignIn');
  };

  return (
    <SafeAreaView style={[BaseStyle.safeAreaView, { padding: 24 }]}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text title2 bold style={{ color: colors.primary, marginBottom: 8 }}>
          Hoş geldiniz 👋
        </Text>
        <Text body1 style={{ marginBottom: 4 }}>
          {user?.fullName ?? ''}
        </Text>
        <Text body2 grayColor style={{ marginBottom: 32 }}>
          {user?.email ?? ''}
        </Text>

        <TouchableOpacity
          onPress={onLogout}
          style={{
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.primary,
          }}
        >
          <Text body2 style={{ color: colors.primary }}>
            Çıkış Yap
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SakinHome;
