# MobileKasa — Proje Rehberi

> **Durum (2026-09-24):** Eski React Native MobileKasa uygulaması `_legacy/MobilKasa-eski/` altına taşındı. Yerine
> `~/yonetimim/yonetimim2026` temel alındı ve MobilKasa'ya dönüştürüldü; ürün artık **perakende satış + stok takibi**
> (barkod okutarak satış). Aşağıdaki "Yönetimim — Proje Rehberi" bölümü kaynak projenin geçmişidir, referans içindir.

## Yapı
- `Backend/` — Gateway (Ocelot), Auth, WebServis, MobileServis (.NET 8, her biri ayrı Docker image)
- `Web/web-app/` — React + Vite SPA (web template)
- `Mobile/mobile-template/source/` — React Native (mobil template)
- `GlobalAssets/`, `docker-compose.yml`

## Veritabanı — Rancher PostgreSQL (paylaşımlı)
- Namespace `databases`, LAN: `192.168.1.241:5432`, cluster içi: `postgresql.databases.svc.cluster.local:5432`
- MobileKasa'ya ait ayrı DB/kullanıcı: **`mobilkasa` / `mobilkasa`** (yonetimim DB'sine dokunulmaz)
- Oluşturma: `PGADMIN_PASSWORD='...' ./scripts/db/create-mobilkasa-db.sh` → rastgele şifre + JWT key üretir, kök `.env`'e yazar
- `appsettings.json`'larda şifre yok (`CHANGE_ME_VIA_ENV`); gerçek değerler env var ile gelir:
  `ConnectionStrings__DefaultConnection`, `Jwt__Key` (lokalde `.env`, docker-compose `env_file: .env`; Rancher'da k8s Secret)
- `.env` git'e girmez (`.env.example` şablon)

## Canlı ortam
- Web: https://mobilkasa.sametersoy.com — Gateway/Swagger: https://gw-mobilkasa.sametersoy.com/swagger
- Rancher namespace `mobilkasa`; deploy: `./deploy/deploy.sh` (bkz. `deploy/README.md`)
- Bağlantı bilgisi + JWT key: kök `.env` (git'te yok) ve k8s Secret `mobilkasa-secrets`

## Mobil sürüm / imzalama
- Android `com.mobilkasa` — versionCode 9 / 9.0 (eski uygulama: 8). Release imzası `RELEASE_*` property'leriyle, `~/.gradle/gradle.properties`'ten; keystore `android/app/` altında, gitignore'da.
- iOS `com.mobil.kasa` — 2.0.0 (5) (eski: 1.2.2 (4)), Automatic signing, `xcodebuild ... -allowProvisioningUpdates archive`.
- Mağazaya her yüklemede sürüm numaralarını artır.

## Diğer
- İsim dönüşümü tamam (kodda `yonetimim` yok), logolar eski MobileKasa barkod ikonu.

## Perakende şeması (WebServis, migration `AddRetailCatalog`, 2026-09-24)
Çok mağazalı SaaS: ortak barkod kataloğu + mağazaya özel fiyat/stok.
- `Products` (Barcode tekil) + `ProductCategories` — ortak katalog, fiyat/stok içermez
- `Stores`, `StoreMembers` (Owner/Manager/Cashier)
- `StoreProducts` — mağazadaki güncel alış/satış fiyatı, KDV, stok (StoreId+ProductId tekil)
- `ProductPriceHistory` — her alış/satış fiyatı değişikliği (eski/yeni fiyat, kim, ne zaman)
- `StockMovements` — her stok hareketi (Initial/Purchase/Sale/Return/Adjustment/Waste), işaretli miktar + sonraki bakiye
- Katalog seed: `Data/Seed/products-tr.json.gz` (Open Food/Beauty/Products Facts, ODbL — bkz. `Data/Seed/README.md`),
  `ProductSeeder` tablo boşsa açılışta yükler. Yeniden üretme: `scripts/catalog/build_seed.py`.
- Not: Program.cs'teki `Npgsql.EnableLegacyTimestampBehavior` nedeniyle EF, eski yonetimim tablolarında timestamptz→timestamp
  AlterColumn üretiyor; bu migration'dan elle çıkarıldı. Yeni migration'larda da kontrol et.
- Migration üretme (lokalde .NET 8 SDK yok): `docker run --rm -v "$PWD":/src -w /src mcr.microsoft.com/dotnet/sdk:8.0 bash -c
  'dotnet tool install -g dotnet-ef --version 8.0.4 && ~/.dotnet/tools/dotnet-ef migrations add <Ad>'` (Backend/WebServis içinde)
- Sonraki migration'lar: `AddSales` (`Sales`, `SaleItems`), `AddSuppliersAndPurchases` (`Suppliers`, `Purchases`, `PurchaseItems`).
- Perakende tablolarındaki tarihler UTC saklanır; `AppDbContext` okurken `DateTimeKind.Utc` işaretler (legacy timestamp modunda
  aksi halde JSON'a "Z"siz yazılıp mobilde 3 saat kayıyordu). Yeni perakende entity'si eklenirse `retailEntities` listesine ekle.

## Perakende API (WebServis, gateway'de `/api/web/stores/...`)
- `StoresController`: şubeler (liste/oluştur/güncelle/kapat, `current` ilk şubeyi otomatik açar), çalışanlar (e-posta ile ekle/çıkar)
- `StoreProductsController`: liste (`scope=store|catalog`, `lowStock`), barkod sorgu, ürün oluştur, detay (fiyat geçmişi, stok
  hareketleri, 30 gün satış), fiyat/KDV/min. stok güncelle, stok düzeltme (sayım/fire/iade)
- `SalesController`: satış, tarih aralığına göre liste + özet (ciro/KDV/nakit/kart), detay
- `SuppliersController`, `PurchasesController` (stok girişi: stok artar, alış/satış fiyatı geçmişe yazılır)
- Yetki: satış tüm çalışanlar; fiyat, stok girişi/düzeltme, tedarikçi → Sahip/Yönetici; şube çalışanları → Sahip.
- Fiyat/stok değişikliklerinin tek noktası `Helpers/StoreProductHelper.cs` (SetPrice geçmişe yazar, MoveStock hareket kaydeder).

## Mobil perakende ekranları
- Alt sekmeler (`navigation/config/crypto.js`): Satış · Ürünler · Stok (giriş) · Satışlar · Mağaza. Stack ekranları
  `navigation/config/retail.js`: UrunDetay, AlisGecmisi, Tedarikciler, Subeler, Hesabim.
- Seçili şube: `app/context/StoreContext.js` (`useStore()`), AsyncStorage'da saklanır. Ortak UI: `app/components/Retail`.
- Barkod: `react-native-vision-camera` 4.6.4 (konum API'leri kapalı: Podfile `$VCEnableLocation=false`,
  gradle `VisionCamera_enableLocation=false`; Android MLKit `VisionCamera_enableCodeScanner=true`).
- Yeni `app/` klasörü eklenirse `babel.config.js`'teki alias listesine `@/<klasör>` eklenmeli.

## Yapılacaklar
- [ ] Eski yonetimim ekran/tablolarının (Buildings, Dues, Polls…) kaldırılması
- [ ] Satış iadesi/iptali, fiş yazdırma, raporlar

---

# Yönetimim — Proje Rehberi

Apartman ve site yönetimi için SaaS platform. Domain: `yonetimim.com`

---

## Mimari

Micro-servis, tümü Docker container. Production'da Rancher üzerinde bağımsız deployment.

```
yonetimim/
├── Backend/
│   ├── Gateway/        .NET 8 — Ocelot API Gateway, port 5000
│   ├── Auth/           .NET 8 — JWT auth + kullanıcı yönetimi, port 5001
│   ├── WebServis/      .NET 8 — Web iş mantığı, port 5002
│   └── MobileServis/   .NET 8 — Mobil iş mantığı, port 5003
├── Web/
│   └── web-app/        React + Vite + TypeScript SPA, port 3000
├── Mobile/
│   └── mobile-template/ React Native (henüz başlanmadı)
└── docker-compose.yml
```

---

## Servisler ve Portlar

| Servis | Port | Açıklama |
|--------|------|----------|
| Gateway | 5000 | Tüm istekler buradan geçer |
| Auth | 5001 | Kayıt / giriş / JWT üretimi |
| WebServis | 5002 | Web backend |
| MobileServis | 5003 | Mobile backend |
| PostgreSQL | 5432 | Ana veritabanı |
| Web SPA | 3000 | React frontend (dev) |

---

## Veritabanı

- **PostgreSQL 16** Docker container
- Container: `yonetimim-postgres`
- Host: `localhost:5432`
- Kullanıcı: `yonetimim` / Şifre: `***` (eski, silinmiş container)
- DB: `yonetimim`
- Volume: `yonetimim-postgres-data` (kalıcı)
- **Schema sahibi WebServis** — EF Core migration'lar WebServis'ten çalışır
- MobileServis yalnızca `DeviceTokens` tablosunu kendi migration'ıyla yönetir

---

## Docker Komutları

```powershell
# Tüm servisleri başlat
docker compose up -d

# Belirli servisi yeniden build et
docker compose build <servis>
docker compose up -d <servis>

# Logları izle
docker compose logs -f <servis>

# Durdur
docker compose down
```

---

## Swagger / API Test

Gateway üzerinden tek noktadan erişim: **`http://localhost:5000/swagger`**

"Select a definition" dropdown'unda 3 servis seçilebilir:

| Servis | Gateway Swagger | Swagger JSON |
|--------|----------------|--------------|
| Auth | `/auth/swagger` | `/auth/swagger/v1/swagger.json` |
| WebServis | `/web/swagger` | `/web/swagger/v1/swagger.json` |
| MobileServis | `/mobile/swagger` | `/mobile/swagger/v1/swagger.json` |

---

## Gateway Routing (Ocelot)

```
POST /api/auth/**   → auth:8080       (JWT gereksiz)
GET  /api/web/**    → webservis:8080  (JWT gerekli)
GET  /api/mobile/** → mobileservis:8080 (JWT gerekli)
```

JWT almak için: `POST http://localhost:5000/api/auth/auth/login`

---

## Backend — Auth Servisi

- `POST /api/auth/auth/register` — Yeni yönetici kaydı (Role = "yonetici")
- `POST /api/auth/auth/login` — Token al
- `POST /api/auth/auth/register-sakin` — Sakin kaydı; `BuildingId` User'a atanır, `UnitId` → `ResidentUnits` tablosuna yazılır
- `GET /api/auth/residents?buildingId=` — Sakinleri listele; `unitIds: List<Guid>` döner
- `DELETE /api/auth/residents/{id}` — Sakin pasife al (IsActive=false)
- `PUT /api/auth/residents/{id}` — Sakin profil güncelle (FullName, Phone)
- `POST /api/auth/residents/{id}/units` — Sakine daire ekle (çoklu daire desteği)
- `DELETE /api/auth/residents/{id}/units/{unitId}` — Sakin-daire ilişkisini kaldır
- EF Core migration: `Backend/Auth/Migrations/`
- Model: `User` (Id, Email, PasswordHash, FullName, Phone?, Role, IsActive, BuildingId?)
- Model: `ResidentUnit` (UserId PK, UnitId PK) — sakin↔daire junction table; bir sakin birden fazla daireyle ilişkilendirilebilir
- Şifre: BCrypt hash
- Roller: `"admin"` | `"yonetici"` | `"sakin"`
- JWT: `buildingId` claim'i var; `unitId` claim'i **kaldırıldı** (çoklu daire nedeniyle)
- `AuthResponseDto` artık `UnitId` içermiyor

> **Önemli:** Yeni kayıt olan kullanıcının rolü veritabanında `"yonetici"` olmalı. Eski kayıtlarda `"user"` kalabilir — bu durumda tüm `[Authorize(Roles = "yonetici,admin")]` endpoint'leri 403 verir. Düzeltmek için: `UPDATE "Users" SET "Role" = 'yonetici' WHERE "Email" = '...'` ardından yeniden giriş yapılmalı.

---

## Backend — WebServis Modülleri

Tüm endpoint'ler `/api/buildings/{buildingId}/...` prefix'li, JWT zorunlu.

| Controller | Endpoint | Özellik |
|-----------|----------|---------|
| Buildings | `/api/buildings` | CRUD, kullanıcıya ait binalar |
| Units | `.../units` | Daire yönetimi |
| Financial | `.../financial` | Gelir/gider + özet rapor; `UnitId?` ve `ResidentUserId?` ile daire/sakin ilişkisi |
| Meters | `.../meters` | Sayaç + okuma kaydı |
| Dues | `.../dues` | Aidat kuralı + otomatik üretim + ödeme; ödeme anında `FinancialTransaction` (Income) otomatik oluşur; `unpay` ile geri alınır |
| Tenders | `.../tenders` | İhale yayınla, teklif al (public) |
| Polls | `.../polls` | Anket oluştur + oy kullan |
| Notifications | `.../notifications` | Bildirim gönder + okundu işaretle |
| Documents | `.../documents` | Dosya yükle + indir |

---

## Backend — MobileServis Modülleri

WebServis ile aynı veritabanı, mobil'e özel farklar:

- Tüm listeler `{ data, total, page, pageSize }` formatında sayfalı döner
- `GET /api/dashboard` — Tek istekle ana ekran özeti
- `GET .../notifications/unread-count` — Badge sayısı
- `POST /api/devices/register` — FCM/APNs push token kaydı
- Anket yanıtında `userVoted` alanı var
- Sadece `DeviceTokens` tablosu MobileServis migration'ından

---

## Web Frontend (React SPA)

```
Web/web-app/src/
├── views/
│   ├── admin/
│   │   ├── binalar/        Binalarım — CRUD
│   │   ├── daireler/       Daireler — CRUD + kayıtlı sakin gösterimi
│   │   ├── sakinler/       Daire Sakinleri — kayıt/daire değiştir/pasife al
│   │   ├── belgeler/       Belgeler — yükle/indir
│   │   ├── finans/         Gelir/Gider — daire & sakin ilişkili
│   │   ├── aidatlar/       Aidatlar — kurallar + ödeme
│   │   ├── sayaclar/       Sayaçlar — okuma kayıtları
│   │   ├── bildirimler/    Bildirimler — gönder/okundu
│   │   ├── anketler/       Anketler — oy kullan
│   │   └── ihaleler/       İhaleler — teklif/kapat/ödüllendir
│   └── sakin/
│       └── panel/          Sakin paneli
├── components/
│   ├── BuildingSelect.tsx   Bina seçici (context'ten)
│   ├── PageBreadcrumb.tsx   Breadcrumb
│   └── table/              DataTable, TablePagination, DeleteConfirmationModal
├── context/
│   ├── AuthContext.tsx      JWT + sessionStorage yönetimi
│   └── BuildingContext.tsx  Seçili bina state'i (yonetici/admin için)
└── lib/
    └── api.ts              Axios — baseURL: '/api/web', JWT auto-inject
```

### Rotalar

| Rota | Bileşen | Açıklama |
|------|---------|----------|
| `/` | sign-in | Giriş sayfası |
| `/binalar` | admin/binalar | Bina CRUD |
| `/daireler` | admin/daireler | Daire CRUD |
| `/sakinler` | admin/sakinler | Sakin yönetimi |
| `/belgeler` | admin/belgeler | Belge yönetimi |
| `/finans` | admin/finans | Gelir/Gider |
| `/aidatlar` | admin/aidatlar | Aidat yönetimi |
| `/sayaclar` | admin/sayaclar | Sayaç yönetimi |
| `/bildirimler` | admin/bildirimler | Bildirimler |
| `/anketler` | admin/anketler | Anketler |
| `/ihaleler` | admin/ihaleler | İhaleler |
| `/sakin/panelim` | sakin/panel | Sakin paneli |

### API İstemcileri

- `src/lib/api.ts` — `baseURL: '/api/web'` — WebServis için, JWT otomatik eklenir
- Sakinler/Daireler sayfalarında inline `authApi` — `baseURL: '/api/auth'` — Auth servisi için

```typescript
// Sakinler ve daireler sayfasındaki pattern:
const authApi = axios.create({ baseURL: '/api/auth' })
authApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')?.replace(/^"|"$/g, '') ?? ''
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

### Önemli Desenler

- **Bağımsız fetch**: `Promise.all` kullanmak yerine her istek kendi `.catch()` ile — biri başarısız olunca diğeri yine yüklenir
- **Sakin Ekle butonu**: `disabled={!selectedBuilding || units.length === 0}` — bina seçili ve en az 1 daire varsa aktif
- **Token strip**: `sessionStorage.getItem('token')?.replace(/^"|"$/g, '')` — usehooks-ts JSON olarak saklar, tırnak temizlenmeli

### Auth Sayfası Yapısı (Split Layout)

Sol kolon: `auth.jpg` tam yükseklik arka plan + gradient overlay  
Sağ kolon: 425–475px genişliğinde Card — `AuthLogo` + form + footer

CSS sınıfları `scss/pages/_authentication.scss` dosyasında tanımlı:
- `.auth-box` — wrapper (position-relative, min-vh-100)
- `.card-side-img` — sol kolon arka plan ayarları
- `.auth-overlay` — koyu gradient overlay
- `.auth-box-form` — sabit genişlikli form kartı
- `.auth-brand` — logo alanı (light/dark mod desteği)
- `.auth-sub-text` — açıklama metni (max-width: 300px)

Dev sunucu: `npm run dev` → `http://localhost:3000`

Nginx'te `/api/*` istekleri gateway container'a proxy edilir.

---

## EF Core Migration

```powershell
# WebServis — yeni migration ekle
cd Backend/WebServis
dotnet ef migrations add <MigrationAdi>

# Auth — yeni migration ekle
cd Backend/Auth
dotnet ef migrations add <MigrationAdi>

# MobileServis — sadece DeviceTokens için migration
cd Backend/MobileServis
dotnet ef migrations add <MigrationAdi>
```

Migration'lar servis başlarken otomatik uygulanır (`db.Database.Migrate()`).

---

## JWT Yapılandırması

Tüm servislerde aynı anahtar kullanılır (`appsettings.json`):

```json
"Jwt": {
  "Key": "yonetimim-super-secret-jwt-key-min-32-chars!!",
  "Issuer": "yonetimim",
  "Audience": "yonetimim-clients",
  "ExpiryMinutes": 1440
}
```

**Production'da bu anahtar mutlaka değiştirilmeli ve environment variable ile verilmeli.**

---

## Geliştirme Ortamı

- **Windows** — ana geliştirme makinesi
- **MacBook Pro M3** — iOS geliştirme (zaman zaman)
- .NET SDK 8.0 kurulu (10.0 de var ama projeler net8.0 hedefli)
- Node.js 20.17.0
- Docker Desktop 29.1.3

---

## Henüz Yapılmayanlar

- [ ] Mobile (React Native) kurulumu
- [ ] iOS için macOS ortam kurulumu
- [ ] Ödeme servisi entegrasyonu
- [ ] Push notification gönderme (FCM/APNs)
- [ ] Kullanıcı profil yönetimi
- [ ] Production `.env` / secret yönetimi
- [ ] CI/CD pipeline
- [ ] Push notification gönderme (FCM/APNs) — DeviceToken kaydı hazır

## Bu Konuşmada Yapılanlar

### Yeni Sayfalar (Web Frontend)
Tüm modül sayfaları `src/views/admin/` altında oluşturuldu:
`binalar`, `daireler`, `sakinler`, `belgeler`, `finans`, `aidatlar`, `sayaclar`, `bildirimler`, `anketler`, `ihaleler`

### Daire Sakinleri Sistemi
- **Auth servisi:** `ResidentsController` eklendi (`GET /residents`, `DELETE`, `PUT /{id}/unit`)
- **Auth servisi:** `POST /auth/register-sakin` endpoint'i — daire ve bina bilgisiyle sakin kaydı
- **User modeli:** `Phone?` alanı eklendi + `AddUserPhone` migration'ı
- **Sakinler sayfası:** Listeleme, ekleme (ad/email/telefon/şifre/daire), daire değiştirme, pasife alma
- **Daireler sayfası:** "Kayıtlı Sakin" sütunu — auth servisinden sakin bilgisi çekiliyor

### Gelir/Gider Geliştirmeleri
- `FinancialTransaction` modeline `UnitId?` ve `ResidentUserId?` eklendi (2 migration)
- WebServis'te `ResidentUser` entity'si — Auth'un `Users` tablosunu read-only okur (`ExcludeFromMigrations`)
- Finans sayfasına daire ve sakin seçimi eklendi; daire seçilince sakinler backend'de filtreleniyor

### Önemli Hata Giderimleri
- **EF Core LINQ hatası:** `OrderBy` `Select`'ten önce gelmeli — aksi hâlde SQL çevirisi başarısız
- **Promise.all tuzağı:** Birden fazla API çağrısını `Promise.all` ile yapıyorsan biri başarısız olunca hepsi patlar; her fetch bağımsız `.catch()` ile yapılmalı
- **Rol hatası (403):** Eski kayıtlı kullanıcının `Role` alanı `"user"` kalabilir; `"yonetici"` olarak güncellenip yeniden giriş yapılmalı

---

## Bu Konuşmada Yapılanlar (2. Oturum)

### Daireler Sayfası Yeniden Yapılandırması
- `OwnerName`, `OwnerPhone`, `OwnerEmail` alanları `Unit` modelinden kaldırıldı (`RemoveUnitOwnerFields` migration)
- Daire ekleme akışı: yeni daire kaydedilince modal kapanmaz, edit moduna geçer → sakin eklenebilir
- Edit modalda "Kayıtlı Sakinler" bölümü: mevcut sakinleri listele, daireyle ilişkiyi kaldır (×), mevcut sakini ata (dropdown), yeni sakin oluştur
- "Son Aidat" tablo sütunu eklendi (son dönem badge + tutar)
- Edit modalda "Aidat Durumu" bölümü: son 6 dönem, her birinde Öde / Geri Al butonu

### Çoklu Daire Desteği (Auth Servisi)
- `User.UnitId` kaldırıldı → `ResidentUnit(UserId PK, UnitId PK)` junction table eklendi (`AddResidentUnitsTable` migration)
- `ResidentDto.unitIds: List<Guid>` — bir sakin birden fazla daireyle ilişkilendirilebilir
- Yeni endpoint'ler: `POST /residents/{id}/units`, `DELETE /residents/{id}/units/{unitId}`
- JWT'den `unitId` claim'i kaldırıldı
- **Sakinler sayfası edit modalı** yenilendi: atanmış daireler badge listesi + × ile kaldır + dropdown ile ekle
- **Daireler sayfası** `residentsForUnit` → `unitIds.includes()` ile güncellendi

### Sakinler Sayfası Edit Modalı
- Sadece daire değiştirme yerine tam profil düzenleme: Ad Soyad (düzenlenebilir), E-posta (read-only), Telefon, Daireler bölümü
- `PUT /residents/{id}` endpoint'i eklendi (FullName, Phone güncelleme)

### Aidat ↔ Gelir/Gider Entegrasyonu
- `PATCH .../dues/{id}/pay` artık `FinancialTransaction (Income, Kategori: "Aidat")` otomatik oluşturuyor
- `PATCH .../dues/{id}/unpay` yeni endpoint: ödeme sıfırlar + ilgili finansal kaydı siler
- `FinancialTransaction` modeline `DuesId?` eklendi (`AddDuesIdToFinancialTransaction` migration)
- **Aidatlar sayfası** yenilendi:
  - Ödeme modalı: tarih + not seçimi
  - "Geri Al" butonu ödenmiş aidatlar için
  - Dönem ve durum filtreleri
  - Özet şerit (toplam tahsil / bekleyen)
  - Kural silme butonu
  - Bağımsız fetch (`Promise.all` kaldırıldı)

---

## Bu Konuşmada Yapılanlar (3. Oturum — Mobil Uygulama)

### Mobil Uygulama Temeli
- `Mobile/mobile-template/source` altındaki React Native template kullanıma alındı
- `babel.config.js`'e `'@/api': './app/api'` alias'ı eklendi (eksikti, LOGIN_ERROR sebebiydi)
- `app/api/index.js` oluşturuldu: `authApi`, `residentApi`, `mobileApi` factory'leri
  - Android emülatörde `10.0.2.2:5000` (host localhost), iOS'ta `localhost:5000`
  - Header birleştirme hatası düzeltildi (`...options` spread `Content-Type`'ı eziyordu → destructure ile çözüldü)
  - `JsonStringEnumConverter` MobileServis `Program.cs`'e eklendi (enum string olarak gönderilince 400 hatası)

### Redux Auth Katmanı
- `app/actions/auth.js`: `authApi.login()` çağrısı, callback pattern
- `app/reducers/auth.js`: `persist/REHYDRATE` ile eski state shape'i normalize etme; `isLoggedIn` token varlığına göre
- `app/actions/actionTypes.js`: `LOGIN_START`, `LOGIN_SUCCESS`, `LOGIN_ERROR`, `LOGOUT`

### Login Ekranı (`app/screens/SignIn/index.js`)
- E-posta + şifre validasyonu (Türkçe hata mesajları)
- Başarılı girişte `CryptoMenu`'ya yönlendirme
- `AndroidManifest.xml`'e `android:usesCleartextTraffic="true"` eklendi (Android 9+ HTTP bloğu)

### Navigasyon
- Login sonrası `CryptoMenu` (crypto.js tab navigator) açılıyor
- `isLoggedIn` state'ine göre `SignIn` ↔ `CryptoMenu` otomatik yönlendirme
- `UnitDetail` ekranı `share.js`'e eklendi (stack navigator'da)

### CryptoMenu Tab Yapısı (crypto.js)
| Tab | Ekran | İçerik |
|-----|-------|---------|
| Home (CHome) | Dashboard7 | Özet: bina/bildirim/aidat/anket sayıları + son bildirimler |
| Daireler (CMarket) | FCryptol01 | Daire listesi + Daire Ekle + UnitDetail navigate |
| Anketler (CNews) | FPost | Anket listesi + oy kullanma (% gösterimi) |
| Ayarlar (Profile) | Profile | Gerçek kullanıcı adı/email/rol + çıkış |

### Ekran Güncellemeleri
- **HeaderHome**: Redux'tan gerçek kullanıcı adı gösterimi
- **Dashboard7**: `/api/mobile/dashboard` endpoint'inden gerçek veri; bina özeti, stat kartları, son 5 bildirim
- **FCryptol01 (Daireler)**: Daire listesi (Toplam/Dolu/Boş özet); "Daire Ekle" bottom sheet modal (No/Kat/Alan/Tür/Dolu toggle); listeye tıklayınca UnitDetail açılır
- **FPost (Anketler)**: `/api/mobile/buildings/{id}/polls`; oy kullanma Alert + optimistic UI
- **Profile**: `auth.isLoggedIn` + gerçek kullanıcı bilgisi; `AuthActions.logout()` + `SignIn`'e replace

### UnitDetail Ekranı (`app/screens/UnitDetail/index.js`)
Web'deki daireler edit modalı ile birebir özellikler:
- **Daire Bilgileri**: No/Kat/Alan/Tür toggle + Dolu-Boş switch + Kaydet → `PUT /api/mobile/buildings/{id}/units/{unitId}`
- **Kayıtlı Sakinler**: Listeleme, × ile ilişki kaldırma (`DELETE /residents/{id}/units/{unitId}`), mevcut sakin atama (`POST /residents/{id}/units`), yeni sakin ekleme (`POST /auth/register-sakin`)
- **Aidat Durumu**: Son 6 dönem; Öde → `PATCH .../dues/{id}/pay`; Geri Al → `PATCH .../dues/{id}/unpay`

### MobileServis Backend Güncellemeleri
- `SharedModels.cs` WebServis modelleriyle tam eşleştirildi (`FinancialTransaction`'a `UnitId?/ResidentUserId?/DuesId?`, `Unit`'ten Owner alanları kaldırıldı, `BuildingMember`'a `JoinedAt` vb.)
- `BuildingsController`: `POST /buildings/{id}/units` (daire oluştur), `PUT /buildings/{id}/units/{unitId}` (daire güncelle)
- `DuesController`: `MobileDuesDto`'ya `UnitId` eklendi (eksikti → daire detayda aidatlar görünmüyordu)
- `MobileUnitDto`'dan `OwnerName/OwnerPhone` kaldırıldı
- `Program.cs`'e `JsonStringEnumConverter` eklendi; `[FromBody]` attribute eksikliği giderildi

### Önemli Hata Giderimleri
- **`@/api` alias eksikti**: `babel.config.js`'te tanımlı değildi → `Requiring unknown module "undefined"` hatası
- **HTTP 415**: `fetch` options spread'i `Content-Type` header'ını eziyordu; `{ headers: optHeaders, ...restOptions }` destructure ile çözüldü
- **HTTP 400 enum hatası**: .NET enum'lar integer bekliyor, frontend string gönderiyor → `JsonStringEnumConverter` eklendi
- **Aidatlar görünmüyor**: `MobileDuesDto`'da `UnitId` yoktu, filter her zaman boş dönüyordu → `UnitId` eklendi
- **MobileServis 500**: `Unit` modelinde hâlâ `OwnerEmail` vardı, DB'de silinmişti → model güncellendi

---

## Bu Konuşmada Yapılanlar (4. Oturum — Logo & HTTPS)

### Logo Güncelleme (Web)
- `Yonetimim_Logo4.png` (1024×1024, transparan arka plan, sinek kuşu illüstrasyon) tüm web varlıklarına uygulandı
- Değiştirilen dosyalar: `src/assets/images/logo.png`, `logo-black.png`, `logo-sm.png`, `public/favicon.ico`
- `AuthLogo.tsx` (login sayfası logosu): `style={{ height: 150, width: 'auto' }}` — CSS'in `height` attribute'unu ezmesi nedeniyle inline style kullanılıyor
- `AppLogo.tsx` (sidebar logosu): logo-lg `height={48}`, logo-sm `height={36}`

### HTTPS / Production Yapılandırması
- **Cloudflare Flexible SSL** modu kullanılıyor: Browser→Cloudflare HTTPS, Cloudflare→Origin HTTP
- **Cloudflare DNS kaydı Proxied (turuncu bulut) olmalı** — gray cloud (DNS only) modunda tarayıcı doğrudan sunucuya bağlanır, TLS olmadığı için `ERR_SSL_PROTOCOL_ERROR` verir
- `docker-compose.yml`'e web container için `80:80` port mapping eklendi — Cloudflare Flexible modda origin'e port 80 üzerinden bağlanır
- Modem yönlendirmesi: dış port 80 → sunucu port 80, dış port 443 → sunucu port 80
- Caddy denendi (otomatik Let's Encrypt) ama Cloudflare proxy modunda ACME challenge geçemediği için kaldırıldı
- Sonuç akış: `https://yonetimim.com` → Cloudflare (SSL) → `http://sunucu:80` → nginx → SPA + `/api/*` → gateway

### Ocelot Gateway — Prefix Davranışı (Hatırlatma)
- MobileServis controller route'ları `api/...` (mobile prefix'siz) olmalı
- Gateway `/api/mobile/**` → downstream `/api/**` şeklinde strip eder
- `[Route("api/feedback")]` doğru; `[Route("api/mobile/feedback")]` 404 verir

---

## Bu Konuşmada Yapılanlar (5. Oturum — UI Düzenlemeleri & KVKK)

### Daire Tipi Badge Renkleri
- `daireler/index.tsx`: `UNIT_TYPE_COLORS = { 0: 'primary', 1: 'warning', 2: 'secondary' }` tanımlandı
- Badge rengi `type` değerine göre dinamik: `<Badge bg={UNIT_TYPE_COLORS[row.original.type] ?? 'info'}>`

### Icon.tsx — SVG Buton Sorunu Giderildi
- **Kök neden**: Iconify SVG elementi block olarak render ediliyordu → butonlar kare/büyük görünüyordu
- `src/components/wrappers/Icon.tsx` güncellendi: her zaman `display: inline; verticalAlign: middle` style uygulanıyor
- Bu tek değişiklik tüm sayfalardaki buton görünüm sorununu çözdü

### Sayfa Düzeni Yeniden Yapılandırması (Tüm Admin Sayfaları)
- BuildingSelect + aksiyon butonları Card'ın **üstüne** taşındı (anketler sayfası referans alındı)
- CardHeader artık sadece arama inputu veya tab navigasyonu içeriyor
- CardFooter'a sayfa boyutu `<FormSelect style={{ width: 'auto' }}>` + sayfalama eklendi
- Etkilenen sayfalar: `binalar`, `daireler`, `sakinler`, `belgeler`, `finans`, `aidatlar`, `sayaclar`, `bildirimler`, `ihaleler`
- `binalar` sayfasında BuildingSelect olmadığından `justify-content-end` kullanıldı

### Anket Oluşturma 500 Hatası Giderildi
- **Hata**: `Cannot write DateTime with Kind=Unspecified to PostgreSQL type 'timestamp with time zone'`
- **Sebep**: HTML `datetime-local` input timezone bilgisi olmadan string gönderir, .NET `Kind=Unspecified` olarak deserialize eder
- **Düzeltme**: WebServis ve MobileServis `Program.cs`'e `AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true)` eklendi

### KVKK Veri Maskeleme
Tüm servislerde e-posta ve telefon maskeleme uygulandı. Format: `ahmet@gmail.com` → `a***@gmail.com`, `05551234567` → `0555***67`

**Yeni dosyalar** (her serviste ayrı namespace):
- `Backend/WebServis/Helpers/MaskHelper.cs`
- `Backend/MobileServis/Helpers/MaskHelper.cs`
- `Backend/Auth/Helpers/MaskHelper.cs`

**Maskeleme uygulanan endpoint'ler:**
| Servis | Controller | Alan |
|--------|-----------|------|
| WebServis | FinancialController | `GET .../residents` — `ResidentUserDto.Email` |
| WebServis | TendersController | `GET .../tenders/{id}` + `POST .../offers` — `OfferDto.ContactEmail/Phone` |
| WebServis | FeedbackController | `GET /feedback` — `FeedbackDto.UserEmail` |
| Auth | ResidentsController | `GET /residents`, `PUT /{id}`, `POST /{id}/units` — `ResidentDto.Email/Phone` |

### Önemli Desenler (Hatırlatma)
- **CardFooter page-size**: FormSelect'i CardHeader'da tutmak sorunlu (flex değil) → her zaman CardFooter'da `style={{ width: 'auto' }}` ile kullan
- **Iconify SVG**: `Icon.tsx`'te global `display: inline` zorunlu, yoksa butonlar block element gibi şişiyor

---

## Bu Konuşmada Yapılanlar (6. Oturum — Google Play Release)

### Android Release AAB Derleme
- `build.gradle` versiyon güncellendi: `versionCode 38`, `versionName "3.8"` (Play Store'daki son versiyon 37/3.7)
- Release AAB başarıyla derlendi: `app\build\outputs\bundle\release\app-release.aab` (59 MB)
- Derleme komutu: `.\gradlew.bat bundleRelease --project-cache-dir "C:\gradle-cache-rn"`
- Keystore: `android\app\release.keystore`, alias: `yonetimim`, şifre: `gradle.properties`'te

### Google Play Upload Key Sorunu ve Çözümü
- **Sorun**: Play Store'a yüklemede "wrong key" hatası — mevcut `release.keystore` SHA1: `51:0D:D9...`, Play Store SHA1: `73:11:20...` bekliyor
- **Kök neden**: Orijinal upload keystore MacBook'taki eski projede kalmış, proje silinmiş
- **İyi haber**: Uygulama **"Signing by Google Play"** modunda — Google asıl imzalama anahtarını kendi sunucusunda tutuyor, sadece upload key değişmesi gerekiyor
- **Çözüm adımları**:
  1. `keytool -export -rfc` ile yeni keystore'un PEM sertifikası çıkarıldı → `C:\yonetimim\upload_cert.pem`
  2. Play Console → App integrity → App signing → **"Request upload key reset"** tıklandı
  3. PEM dosyası yüklendi, talep gönderildi — **onay bekleniyor (1-3 iş günü)**
- Onay gelince mevcut `release.keystore` ile imzalanan AAB sorunsuz yüklenecek

### Önemli Notlar
- **Upload key ≠ App signing key**: Google Play App Signing'de Google iki farklı anahtar tutar. Upload key (geliştirici yükler) kaybolursa sıfırlanabilir; app signing key Google'da güvende
- **Upload key reset**: Play Console → App integrity → App signing → "Request upload key reset" — PEM formatında yeni sertifika yüklenir, Google onaylar
- **PEM üretme**: `keytool -export -rfc -keystore release.keystore -alias yonetimim -storepass <şifre> -file upload_cert.pem`

---

## Bu Konuşmada Yapılanlar (7. Oturum — Mobil Düzeltmeler)

### AssistiveTouch Butonu Kaldırıldı
- `app/navigation/index.js`'ten `AssistiveTouch` import'u, `goToApp` fonksiyonu ve render satırı temizlendi
- Her sayfanın üzerinde görünen sürüklenebilir yuvarlak uygulama seçici buton artık yok

### Dashboard Bina Değişiminde Güncellenmiyordu (Düzeltildi)
- **Kök neden**: Stat kutucukları (`Bekleyen Aidat`, `Aktif Anket`, `Bildirim`) global dashboard toplamlarını kullanıyordu; bina değişince `load()` yeniden çalışmıyordu
- **Backend**: `BuildingSummaryDto`'ya `ActivePollsCount` alanı eklendi (`Backend/MobileServis/DTOs/CommonDtos.cs`)
- **Backend**: `DashboardController` her bina için aktif anket sayısını `GroupBy` ile hesaplıyor ve summary'e ekliyor
- **Frontend**: `Dashboard7.js`'te `stats` array'i artık `dashboard.buildings` içindeki seçili binaya ait kayıttan türetiliyor (`activeBuildingData`) — ek API isteği olmadan bina değişince kartlar anında güncelleniyor

### Android Emülatör Çalıştırma
- `android/gradlew` dosyasında çalıştırma izni yoktu (`EACCES`) → `chmod +x` ile düzeltildi
- `npx react-native run-android` → `BUILD SUCCESSFUL in 4m 42s`, APK `Pixel_10_Pro(AVD)`'ye yüklendi

### Android Release APK Üretme
- `release.keystore` Windows'tan Mac'e kopyalandı → `android/app/release.keystore`
- `./gradlew assembleRelease` ile imzalı release APK üretildi
- Çıktı: `android/app/build/outputs/apk/release/app-release.apk` (98 MB)
- Release APK Metro bundler'a bağımlı değil, doğrudan telefona kurulabilir
- Keystore bilgileri `gradle.properties`'te: `RELEASE_STORE_FILE`, `RELEASE_KEY_ALIAS`, `RELEASE_STORE_PASSWORD`, `RELEASE_KEY_PASSWORD`

---

## Bu Konuşmada Yapılanlar (8. Oturum — Google Play Policy & Android Build)

### Google Play — Advertising ID Bildirimi
- **Hata**: "Incomplete advertising ID declaration" — Android 13+ hedefleyen tüm uygulamalar beyan zorunlu
- **Çözüm**: `AndroidManifest.xml`'e `tools:node="remove"` ile AD_ID iznini explicit kaldırma eklendi
  ```xml
  <uses-permission android:name="com.google.android.gms.permission.AD_ID" tools:node="remove"/>
  ```
- **Play Console adımı**: App content → Data safety → Device or other IDs → Advertising ID → "No, I don't collect this" seçilmeli (manifest değişikliği tek başına yetmez)

### Google Play — API Level & 16 KB Page Size Hataları
- **Hata 1**: `targetSdkVersion` 34 → 35'e yükseltilmesi zorunlu (Android 15 gereksinimi)
- **Hata 2**: 16 KB memory page size desteği eksik (Android 15 zorunluluğu)
- **Çözüm** (`android/build.gradle`):
  - `buildToolsVersion`: `"34.0.0"` → `"35.0.0"`
  - `compileSdkVersion`: `34` → `35`
  - `targetSdkVersion`: `34` → `35`
  - `ndkVersion`: `"26.1.10909125"` → `"27.1.12297006"`
- **Çözüm** (`android/app/build.gradle`): `externalNativeBuild.cmake.arguments` ile `-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON` eklendi
- **NDK 27 yükleme** (macOS): `~/Library/Android/sdk/cmdline-tools/latest/bin/sdkmanager "ndk;27.1.12297006"`

### Kotlin Derleme Hatası — SplashScreen Import
- **Hata**: `Unresolved reference: devio` — `MainActivity.kt` satır 8'de `import org.devio.rn.splashscreen.SplashScreen`
- **Kök neden**: `react-native-splash-screen` paketi `package.json`'da yok; kullanım zaten comment'e alınmıştı ama import kalmıştı
- **Çözüm**: `MainActivity.kt`'den kullanılmayan import ve `android.os.Bundle` import'u kaldırıldı
- **Sonuç**: `BUILD SUCCESSFUL` — `versionCode 40`, `versionName "4.0"` AAB derlendi

---

## Bu Konuşmada Yapılanlar (9. Oturum — iOS Build Düzeltmeleri)

### iOS Build Ortamı Temizliği

#### react-native-splash-screen Kaldırıldı
- `AppDelegate.mm`'den `#import "RNSplashScreen.h"` ve `[RNSplashScreen show]` satırları silindi
- `Podfile`'dan `react-native-google-maps` ve `Google-Maps-iOS-Utils` pod referansları kaldırıldı (`react-native-maps` paketi yüklü değildi, sadece `android/` klasörü vardı)
- `pod update SocketRocket` ile `SocketRocket 0.7.0 → 0.7.1` güncellendi; splash screen ve maps Pods'u temizlendi

#### yarn / Metro Başlatma Sorunları Giderildi
- **`yarn start` lockfile hatası**: `react-native-swiper` ve `rn-range-slider` GitHub fork URL'leri SSH erişimi olmadığından başarısız oluyordu → npm sürümlerine geçildi (`^1.6.0` ve `^2.2.2`)
- **`Cannot read 'handle'` hatası**: `@react-native-community/cli@20.1.3` RN 0.76.5 ile uyumsuz; `cli-server-api`'dan `indexPageMiddleware` kaldırılmıştı → `cli@15.1.3`'e düşürüldü

#### Native Package Versiyon Pinleme
Podfile.lock'ta sabitlenmiş sürümlerle çakışan paketler `package.json`'da pinlendi:
| Paket | Eski | Pinlenen |
|-------|------|----------|
| `react-native-pager-view` | `^6.4.0` (6.9.1 yüklüyordu) | `6.4.1` |
| `react-native-screens` | `^3.34.0` (3.37.0 yüklüyordu) | `3.34.0` |

- **Kök neden**: `6.9.1`'de `common/cpp/` dizini yok; `3.37.0`'da `RNSDefines.h` yok — her iki dosya da Pods projesinde build input olarak referans ediliyordu
- Xcode Derived Data tamamen silindi (3 stale Runner klasörü), `pod install` yeniden çalıştırıldı

#### Hermes dSYM Build Phase Eklendi
- **Hata**: App Store archive'ında `hermes.framework` için dSYM bulunamıyor
- **Kök neden**: `replace_hermes_version.js` Release tarball'ını extract ederken dSYM dahil etmiyor
- **Çözüm**: `project.pbxproj`'a `[RN] Generate Hermes dSYM` adlı Run Script Build Phase eklendi (`UUID: A630219E69204F2EABCAFCF6`)
  - Sadece Release config'de çalışır
  - `xcrun dsymutil` ile `hermes.framework` binary'sinden dSYM üretip `DWARF_DSYM_FOLDER_PATH`'e kopyalar

### Önemli Desenler (iOS)
- **`.xcworkspace` vs `.xcodeproj`**: CocoaPods için `.xcworkspace` zorunlu; General tab görsel tutarsızlık gösterebilir ama Build Settings asıl değerleri doğru tutar
- **Package pinleme**: `package.json`'da `^` prefix'i Podfile.lock'tan farklı sürüm yükleyebilir → native C++ kaynak dosyaları referans eden paketler için kesin sürüm pinlenmeli
- **`@react-native-community/cli` versiyonu**: RN 0.76.x için `15.1.3` kullanılmalı; `20.x` uyumsuz (`indexPageMiddleware` eksik)

---

## Bu Konuşmada Yapılanlar (10. Oturum — Production Rancher'a taşındı + Android Release)

### Production artık Rancher/Kubernetes'te (homelab)
Windows PC'deki docker-compose kurulumu tamamen kaldırıldı; backend (Gateway/Auth/WebServis/MobileServis), web SPA ve PostgreSQL artık homelab'daki Rancher/RKE2 cluster'ında çalışıyor. Detaylı altyapı bilgisi (namespace, image'lar, ingress host'ları, DB konumu, Docker Hub) bu repoda değil `~/homelab/HOMELAB.md` §9'da tutuluyor — homelab'a dair bir şey gerekirse oraya bakılmalı, burada tekrarlanmıyor.
- **Yeni domain'ler:** `https://yonetimim.com` (web), `https://gw.yonetimim.com` (Gateway/Swagger, Cloudflare Proxied — port 5000 desteklemiyor).
- **Mobil uygulama eski adrese bakıyordu:** `Mobile/mobile-template/source/app/api/index.js`'teki `BASE_URL`, eski docker-compose port mapping'i olan `http://gw.yonetimim.com:5000`'e sabitliydi. Yeni cluster'da bu port dışarıya hiç açık değildi (Cloudflare zaten port 5000'i desteklemiyor). **Düzeltildi:** `BASE_URL = 'https://gw.yonetimim.com'` (portsuz, HTTPS).
- Zaten yayında olan **eski mobil uygulama sürümlerini** hemen kırmamak için port 5000'i de dışarı açan geçici bir çözüm eklendi (`gateway-legacy-5000` LoadBalancer Service + router port yönlendirmesi, `192.168.1.244:5000`) — kalıcı değil, yeni sürüm tüm kullanıcılara ulaşınca kaldırılabilir (bkz. HOMELAB.md §9).

### Android Release (versionCode 44 → 46) — Play Store submission düzeltmeleri
Aylardır build edilmemiş mobil proje, güncel toolchain ile tekrar build edilirken birkaç bağımsız sorun çıktı, hepsi çözüldü:
1. **`node_modules/.bin` script'lerinin çalıştırma izni yoktu** (`Permission denied`, `rnc-cli`) → `chmod +x` gerekiyor, her `yarn add`/`yarn install` sonrası tekrar bozulabiliyor, build öncesi kontrol edilmeli.
2. **`react-native-gesture-handler` 2.20.0, RN 0.76.5 ile derlenmiyordu** (`Unresolved reference: getEventDispatcher`) → `2.20.2`'ye yükseltildi (aynı `^2.20.0` semver aralığında, minimal patch — `2.29.1`'e atlamak FARKLI bir hataya yol açtı: `ViewManagerWithGeneratedInterface` codegen uyumsuzluğu, o yüzden en küçük patch adımı tercih edilmeli).
3. **16 KB page-size ELF hizalama script'i kayıptı**: `android/app/build.gradle`'daki custom `afterEvaluate` bloğu `/tmp/patch_elf_align.py`'yi çağırıyordu ama bu dosya hiç repoya commit edilmemiş, sadece `/tmp`'de yaşıyordu — macOS'un periyodik temizliğiyle silinmiş. **Script artık kalıcı olarak `android/patch_elf_align.py`'de** ve build.gradle oraya işaret ediyor. Doğrulama: build sonrası `.aab` içindeki `.so` dosyalarının ELF PT_LOAD `p_align` değeri gerçekten 16384 olmalı (host'ta hızlı kontrol için ELF header okuyan bir python script kullanıldı — NDK 27 kurulu olması TEK BAŞINA yeterli değil, script olmadan tüm native kütüphaneler hâlâ 4K hizalı çıkıyor).
4. **Play Console: "must target at least API level 36"** → `android/build.gradle`'da `compileSdkVersion`/`targetSdkVersion` 35'ten **36**'ya çıkarıldı; `platforms;android-36` ve `build-tools;36.0.0` `sdkmanager` ile kurulması gerekti (yoktu).
5. **Play Console: "Version code X has already been used"** — bir versionCode Play Console'a bir kez yüklendiğinde (draft silinse/başarısız olsa bile) BİR DAHA ASLA kullanılamıyor. 44 (API 36 hatası aldı) ve 45 (bir sonraki denemede yine "already used" çıktı) tüketildi, sonunda **46** ile başarılı oldu. **Ders:** bundan sonra her yükleme denemesinde versionCode'u artırmaya hazır olunmalı, "sadece bir kere dene" varsayılmamalı.

**Sonuç:** `versionCode 46` (`versionName 4.6`) Play Console'a yüklendi, hatasız (sadece 2 zararsız uyarı: deobfuscation dosyası yok, genel "government apps" hatırlatması), kullanıcı tarafından save edilip **incelemeye gönderildi** (2026-09-20). AAB konumu: `Mobile/mobile-template/source/android/app/build/outputs/bundle/release/app-release.aab`.

**iOS release henüz yapılmadı** — bu Mac'in keychain'inde geçerli bir imzalama sertifikası (private key) yok (`security find-identity` → 0 sonuç), provisioning profile dosyaları var ama sertifikanın kendisi yok. Ya yedek bir `.p12` import edilmeli ya da Xcode'da Apple ID ile giriş yapılıp yeni sertifika oluşturulmalı — kullanıcı bu adımı henüz yapmadı.

**How to apply:** Android tarafında yeni bir release gerekirse: `versionCode`'u artır, `node_modules/.bin` izinlerini kontrol et, `android/gradlew bundleRelease --project-cache-dir /tmp/gradle-cache-rn` ile build et (cross-compile/toolchain sorunları artık çözülmüş durumda, tekrar çıkmamalı). Play Console'a yüklerken versionCode çakışması ihtimaline karşı build'i hızlıca tekrarlayabilecek şekilde hazır ol.
