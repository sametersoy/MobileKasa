import { Fragment } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { BaseColor, useTheme } from '@/config';
import { Icon, Text } from '@/components';
import styles from './styles';

const HeaderHome = ({ style = {}, ComponentRight }) => {
  const { colors } = useTheme();
  const user = useSelector((state) => state.auth?.user);

  return (
    <Fragment>
      <View style={[styles.header, style]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
          <Icon name="user" size={18} color="#fff" />
        </View>
        <View style={styles.contentHeader}>
          <Text subhead light>Merhaba,</Text>
          <Text body2 bold>{user?.fullName ?? 'Kullanıcı'}</Text>
        </View>
        {ComponentRight ?? (
          <View style={{ position: 'relative' }}>
            <Icon name={'bell'} solid size={19} color={BaseColor.grayColor} />
          </View>
        )}
      </View>
    </Fragment>
  );
};

export default HeaderHome;
