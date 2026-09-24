# MobileKasa — Deploy (Rancher/RKE2 homelab)

| Bileşen | Değer |
|---|---|
| Namespace | `mobilkasa` |
| Deployment/Service | `auth`, `webservis`, `mobileservis`, `gateway` (8080), `web` (80) |
| Image'lar | `docker.io/mobilkasa/<servis>:latest` — registry yok, `deploy.sh` imajı her node'a `ctr import` ile yükler (`imagePullPolicy: IfNotPresent`) |
| Ingress | `mobilkasa.sametersoy.com` → web, `gw-mobilkasa.sametersoy.com` → gateway (Traefik + `letsencrypt-prod`) |
| DB | Paylaşımlı Postgres (`databases` ns), DB/kullanıcı `mobilkasa` — cluster içi host `postgresql.databases.svc.cluster.local` |
| Secret | `mobilkasa-secrets` (`ConnectionStrings__DefaultConnection`, `Jwt__Key`) — `.env`'den üretilir |

## Deploy
`./deploy/deploy.sh` (tümü) veya `./deploy/deploy.sh auth web` (seçili servisler): build → node'lara import → secret → apply → rollout restart.
Yeni bir worker node eklenirse `deploy.sh` içindeki `NODES` listesine eklenmeli.

EF Core migration'ları servis açılışında `Database.Migrate()` ile otomatik uygulanır.
