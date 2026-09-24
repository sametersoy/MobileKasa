#!/usr/bin/env bash
# MobileKasa'yı Rancher/RKE2 cluster'ına deploy eder — registry KULLANMADAN.
# İmajlar build edilip `docker save | ctr import` ile her node'un containerd'sine doğrudan yüklenir
# (Docker Hub'daki repolar public olacağı için bu yol tercih edildi; imajlar tamamen private kalır).
#
#   ./deploy/deploy.sh                  → tüm servisler
#   ./deploy/deploy.sh auth web         → sadece verilen servisler
#   SKIP_BUILD=1 ./deploy/deploy.sh     → build etmeden, mevcut lokal imajları yükle
# Ön koşul: kök dizinde .env (scripts/db/create-mobilkasa-db.sh üretir), colima çalışıyor.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY="$HOME/.ssh/id_ed25519_homelab"
NODES=(192.168.1.249 192.168.1.250 192.168.1.251 192.168.1.252)
CTL=(ssh -i "$KEY" "ubuntu@${NODES[0]}")
KENV='export KUBECONFIG=/etc/rancher/rke2/rke2.yaml PATH=$PATH:/var/lib/rancher/rke2/bin;'
CTR='sudo /var/lib/rancher/rke2/bin/ctr --address /run/k3s/containerd/containerd.sock -n k8s.io'
export PATH="/opt/homebrew/bin:/opt/homebrew/opt/colima/bin:$PATH"

dir_of() { case "$1" in auth) echo Backend/Auth;; webservis) echo Backend/WebServis;; mobileservis) echo Backend/MobileServis;;
  gateway) echo Backend/Gateway;; web) echo Web/web-app;; *) echo "Bilinmeyen servis: $1" >&2; exit 1;; esac; }
if [[ $# -gt 0 ]]; then SERVICES=("$@"); else SERVICES=(auth webservis mobileservis gateway web); fi

[[ -f "$ROOT/.env" ]] || { echo ".env yok — önce scripts/db/create-mobilkasa-db.sh çalıştır"; exit 1; }

# 1) Build + node'lara yükle
for name in "${SERVICES[@]}"; do
  image="mobilkasa/${name}"
  if [[ -z "${SKIP_BUILD:-}" ]]; then
    docker buildx build --platform linux/amd64 -t "${image}:latest" --load "$ROOT/$(dir_of "$name")"
  fi
  for node in "${NODES[@]}"; do
    echo ">> ${image}:latest → ${node}"
    docker save "${image}:latest" | ssh -i "$KEY" "ubuntu@${node}" "$CTR images import --platform linux/amd64 -"
  done
done

# 2) Namespace + uygulama secret'ı (.env → mobilkasa-secrets; cluster içinden Postgres servis DNS'i)
"${CTL[@]}" "$KENV kubectl create namespace mobilkasa --dry-run=client -o yaml | kubectl apply -f -"
sed 's/Host=192\.168\.1\.241/Host=postgresql.databases.svc.cluster.local/' "$ROOT/.env" \
  | "${CTL[@]}" "$KENV kubectl -n mobilkasa create secret generic mobilkasa-secrets --from-env-file=/dev/stdin --dry-run=client -o yaml | kubectl apply -f -"

# 3) Manifestler + yeni imajlarla pod'ları yeniden başlat (imagePullPolicy: IfNotPresent → node'daki yeni :latest kullanılır)
"${CTL[@]}" "$KENV kubectl apply -f -" < "$ROOT/deploy/k8s/mobilkasa.yaml"
"${CTL[@]}" "$KENV kubectl -n mobilkasa rollout restart $(printf 'deploy/%s ' "${SERVICES[@]}")
  kubectl -n mobilkasa rollout status deploy --timeout=240s; kubectl -n mobilkasa get pods,ingress"
echo "Deploy tamam."
