import { Fragment, useEffect } from 'react';
import { StackActions, useNavigation } from '@react-navigation/native';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import { BaseColor } from '@/config';
import { parseHexTransparency } from '@/utils';
import { Icon, Text } from '@/components';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 10,
    justifyContent: 'center',
  },
  titleStyle: {
    padding: 10,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  paragraphStyle: {
    padding: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  introImageStyle: {
    width: 200,
    height: 200,
  },
  introTextStyle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    paddingVertical: 30,
  },
  introTitleStyle: {
    fontSize: 25,
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  buttonCircle: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0, 0, 0, .2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const slides = [
  {
    key: 's0',
    title: 'Y\u00f6netimim',
    text: 'Apartman ve site y\u00f6netimini kolayla\u015ft\u0131ran ak\u0131ll\u0131 platform',
    icon: 'city',
    backgroundColor: parseHexTransparency(BaseColor.pinkLightColor, 75),
  },
  {
    key: 's1',
    title: 'Daireler & Sakinler',
    text: 'Daire bilgilerini y\u00f6netin, sakinleri kaydedin ve takip edin',
    icon: 'building',
    backgroundColor: parseHexTransparency(BaseColor.orangeColor, 75),
  },
  {
    key: 's2',
    title: 'Aidatlar',
    text: 'Aidat kurallar\u0131 olu\u015fturun, \u00f6demeleri kolayca takip edin',
    icon: 'file-invoice-dollar',
    backgroundColor: parseHexTransparency(BaseColor.pinkColor, 75),
  },
  {
    key: 's3',
    title: 'Finans',
    text: 'Gelir ve giderleri kaydedin, finansal durumu anl\u0131k g\u00f6r\u00fcn',
    icon: 'chart-line',
    backgroundColor: parseHexTransparency(BaseColor.blueColor, 75),
  },
  {
    key: 's4',
    title: 'Bildirimler',
    text: 'Sakinlere an\u0131nda bildirim g\u00f6nderin, duyurular\u0131 y\u00f6netin',
    icon: 'bell',
    backgroundColor: parseHexTransparency(BaseColor.kashmir, 75),
  },
  {
    key: 's5',
    title: 'Anketler & \u0130haleler',
    text: 'Sakinlerin g\u00f6r\u00fc\u015flerini al\u0131n, ihale s\u00fcre\u00e7lerini takip edin',
    icon: 'poll-h',
    backgroundColor: parseHexTransparency(BaseColor.greenColor, 75),
  },
];

const SliderIntro = () => {
  const navigation = useNavigation();

  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent', true);
    }
  }, []);

  const renderItem = ({ item }) => {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: item.backgroundColor,
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingBottom: 100,
          paddingHorizontal: 20,
        }}
      >
        <Text whiteColor title1>
          {item.title}
        </Text>
        <Icon name={item.icon} color={BaseColor.whiteColor} size={200} />
        <Text whiteColor body1 style={{ textAlign: 'center' }}>
          {item.text}
        </Text>
      </View>
    );
  };

  const onDone = () => {
    navigation.dispatch(StackActions.replace('MaziHome'));
  };

  const onSkip = () => {
    navigation.dispatch(StackActions.replace('MaziHome'));
  };

  const renderButton =
    (label = '') =>
    () => {
      return (
        <View style={styles.buttonCircle}>
          <Text footnote whiteColor>
            {label}
          </Text>
        </View>
      );
    };

  return (
    <Fragment>
      <AppIntroSlider
        data={slides}
        renderItem={renderItem}
        onDone={onDone}
        showSkipButton={true}
        onSkip={onSkip}
        renderDoneButton={renderButton('Done')}
        renderNextButton={renderButton('Next')}
        renderSkipButton={renderButton('Skip')}
      />
    </Fragment>
  );
};

export default SliderIntro;
