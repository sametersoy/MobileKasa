import { ScrollView, TouchableOpacity, View } from 'react-native';
import { BaseColor, BaseStyle, useTheme } from '@/config';
import { Icon, SafeAreaView, Text } from '@/components';

const FEATURES = [
  { icon: 'city',               label: 'Bina & Site Yönetimi',     desc: 'Birden fazla binayı tek yerden yönetin.' },
  { icon: 'home',               label: 'Daire Takibi',             desc: 'Daire bilgileri, sakin atamaları ve doluluk durumu.' },
  { icon: 'file-invoice-dollar',label: 'Aidat & Finans',           desc: 'Aidat kuralları, otomatik üretim ve ödeme takibi.' },
  { icon: 'bell',               label: 'Bildirimler',              desc: 'Sakinlere anlık bildirim gönderin.' },
  { icon: 'poll-h',             label: 'Anketler',                 desc: 'Bina kararlarını anket ile şeffaf alın.' },
  { icon: 'gavel',              label: 'İhaleler',                 desc: 'Hizmet tekliflerini yayınlayın ve değerlendirin.' },
  { icon: 'tachometer-alt',     label: 'Sayaçlar',                 desc: 'Elektrik, su ve doğalgaz okumalarını kaydedin.' },
  { icon: 'folder-open',        label: 'Belgeler',                 desc: 'Bina belgelerini güvenle saklayın ve paylaşın.' },
];

const AboutUs = ({ navigation }) => {
  const { colors } = useTheme();

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
        <Text header bold>Hakkımızda</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Logo + slogan kartı */}
        <View style={{
          margin: 20, borderRadius: 16, padding: 28,
          backgroundColor: colors.primary,
          alignItems: 'center',
        }}>
          <View style={{
            width: 72, height: 72, borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            justifyContent: 'center', alignItems: 'center',
            marginBottom: 14,
          }}>
            <Icon name="city" size={36} color="#fff" solid />
          </View>
          <Text title2 bold style={{ color: '#fff' }}>MobilKasa</Text>
          <Text caption1 style={{ color: 'rgba(255,255,255,0.8)', marginTop: 6, textAlign: 'center' }}>
            Apartman ve site yönetimini kolaylaştıran akıllı platform
          </Text>
        </View>

        {/* Hakkında */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text title3 bold style={{ marginBottom: 10 }}>Ne Yapıyoruz?</Text>
          <Text body2 style={{ lineHeight: 22, color: BaseColor.grayColor }}>
            MobilKasa, işletmelerin satış ve kasa işlemlerini dijital ortama taşıyan bir SaaS platformdur.
            Aidat takibinden ihaleye, bildirimden belge arşivine kadar tüm yönetim süreçleri tek uygulamada toplanır.
            Sakinler de kendi panelleri üzerinden aidat durumlarını takip edebilir, anketlere katılabilir.
          </Text>
        </View>

        {/* Özellikler */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text title3 bold style={{ marginBottom: 14 }}>Özellikler</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'flex-start', gap: 14,
              paddingVertical: 12,
              borderBottomWidth: i < FEATURES.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
            }}>
              <View style={{
                width: 40, height: 40, borderRadius: 10,
                backgroundColor: colors.primary,
                justifyContent: 'center', alignItems: 'center',
                flexShrink: 0,
              }}>
                <Icon name={f.icon} size={18} color="#fff" solid />
              </View>
              <View style={{ flex: 1 }}>
                <Text body2 bold>{f.label}</Text>
                <Text caption1 grayColor style={{ marginTop: 2 }}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* İletişim */}
        <View style={{
          marginHorizontal: 20, borderRadius: 12,
          backgroundColor: colors.card,
          padding: 20,
        }}>
          <Text title3 bold style={{ marginBottom: 14 }}>İletişim</Text>
          {[
            { icon: 'globe', text: 'mobilkasa.sametersoy.com' },
          ].map(({ icon, text }) => (
            <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Icon name={icon} size={15} color={colors.primary} solid />
              <Text body2>{text}</Text>
            </View>
          ))}
        </View>

        {/* Versiyon */}
        <Text caption2 grayColor style={{ textAlign: 'center', marginTop: 24 }}>
          MobilKasa v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutUs;
