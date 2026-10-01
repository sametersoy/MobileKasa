import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Link } from 'react-router'
import { Card, CardBody, Col, Container, Row } from 'react-bootstrap'

const CONTACT_EMAIL = 'ersamet55@gmail.com'

// Giriş gerektirmeyen, herkese açık gizlilik politikası (Google OAuth onay ekranı bu sayfayı gösterir)
const Page = () => {
  const name = META_DATA.name
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={9}>
          <div className="text-center mb-4">
            <AuthLogo />
            <h1 className="fw-bold mt-3">Gizlilik Politikası</h1>
            <p className="text-muted">Yürürlük tarihi: 1 Ekim 2026</p>
          </div>
          <Card>
            <CardBody>
              <p>
                Bu politika, {name} web sitesi ve mobil uygulamasını kullanırken kişisel verilerinizin nasıl toplandığını,
                kullanıldığını ve korunduğunu 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında açıklar.
              </p>

              <h4 className="fw-bold mt-4">1. Toplanan Veriler</h4>
              <ul>
                <li>Hesap bilgileri: ad soyad, e-posta adresi, telefon numarası (isteğe bağlı) ve şifrenizin geri döndürülemez özeti.</li>
                <li>
                  Google ile giriş yaparsanız: Google hesabınızın adı ve doğrulanmış e-posta adresi. Google şifrenize hiçbir zaman
                  erişmeyiz; Google'dan başka bir veri (kişiler, dosyalar, takvim vb.) talep etmeyiz.
                </li>
                <li>Uygulamaya sizin girdiğiniz işletme verileri (ör. kayıtlar, tutarlar, ürün ve stok bilgileri).</li>
                <li>Hizmetin güvenliği için teknik kayıtlar (IP adresi, istek zamanı, tarayıcı/cihaz bilgisi).</li>
              </ul>

              <h4 className="fw-bold mt-4">2. Verilerin Kullanım Amacı</h4>
              <p>
                Veriler yalnızca hesabınızı oluşturmak ve oturumunuzu açmak, hizmeti sunmak ve geliştirmek, güvenliği sağlamak
                ve yasal yükümlülükleri yerine getirmek amacıyla işlenir. Verileriniz reklam amacıyla kullanılmaz ve satılmaz.
              </p>

              <h4 className="fw-bold mt-4">3. Paylaşım</h4>
              <p>
                Kişisel verileriniz üçüncü kişilerle paylaşılmaz; yalnızca yasal bir zorunluluk olduğunda yetkili kamu kurumlarına
                aktarılabilir. Google ile giriş, Google LLC tarafından sağlanır ve Google'ın kendi gizlilik politikasına tabidir.
              </p>

              <h4 className="fw-bold mt-4">4. Saklama ve Güvenlik</h4>
              <p>
                Veriler kendi sunucularımızda saklanır ve yalnızca şifreli bağlantı (HTTPS) üzerinden erişilir. Hesabınız
                silindiğinde hesabınıza ait kişisel veriler silinir.
              </p>

              <h4 className="fw-bold mt-4">5. Haklarınız ve Hesap Silme</h4>
              <p>
                KVKK'nın 11. maddesi kapsamında verilerinize erişme, düzeltme ve silinmesini isteme haklarına sahipsiniz. Hesabınızı
                uygulama içinden veya{' '}
                <Link to="/auth/card/delete-account">hesap silme sayfasından</Link> silebilir ya da aşağıdaki adrese yazabilirsiniz.
              </p>

              <h4 className="fw-bold mt-4">6. İletişim</h4>
              <p className="mb-0">
                Sorularınız için: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </p>
            </CardBody>
          </Card>
          <p className="text-center text-muted mt-3 mb-0">
            © {currentYear} {name}
          </p>
        </Col>
      </Row>
    </Container>
  )
}

export default Page
