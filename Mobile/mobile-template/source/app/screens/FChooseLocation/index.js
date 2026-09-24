import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { Header, Icon, SafeAreaView, Text } from '@/components';
import { BaseStyle, useTheme } from '@/config';
import styles from './styles';

export default function FChooseLocation() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [loading] = useState('');
  const [keywork, setKeywork] = useState('');
  const navigation = useNavigation();

  /**
   * Called when apply change language
   */
  const saveAddress = () => {
    navigation.navigate({
      name: 'FAddTransaction',
      params: { address: addressChoosed },
      merge: true,
    });
  };

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'top', 'left']}>
      <Header
        title={t('choose_location')}
        renderLeft={() => {
          return <Icon name="angle-left" size={20} color={colors.text} enableRTL={true} />;
        }}
        renderRight={() => {
          if (loading) {
            return <ActivityIndicator size="small" color={colors.primary} />;
          } else {
            return (
              <Text headline primaryColor numberOfLines={1}>
                {t('save')}
              </Text>
            );
          }
        }}
        onPressLeft={() => {
          navigation.goBack();
        }}
        onPressRight={saveAddress}
      />
      <View style={styles.contain}>
        <View style={{ height: '100%', width: '100%', backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="map-marker-alt" size={60} color="#999" />
        </View>
      </View>
    </SafeAreaView>
  );
}
