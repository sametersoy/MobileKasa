#!/usr/bin/env bash
# Rancher'daki paylaşımlı PostgreSQL'de (namespace: databases, 192.168.1.241)
# MobileKasa için ayrı kullanıcı + veritabanı oluşturur ve kök dizindeki .env'e yazar.
# Kullanım:  PGADMIN_PASSWORD='<postgres şifresi>' ./scripts/db/create-mobilkasa-db.sh
set -euo pipefail

PG_HOST="${PG_HOST:-192.168.1.241}"
PG_PORT="${PG_PORT:-5432}"
DB_NAME="mobilkasa"
DB_USER="mobilkasa"
PSQL="${PSQL:-/Applications/Postgres.app/Contents/Versions/latest/bin/psql}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$ROOT/.env"

: "${PGADMIN_PASSWORD:?PGADMIN_PASSWORD (postgres admin şifresi) gerekli}"

DB_PASSWORD="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)"
JWT_KEY="$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 48)"

export PGPASSWORD="$PGADMIN_PASSWORD"
"$PSQL" -h "$PG_HOST" -p "$PG_PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASSWORD';
  ELSE
    ALTER ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL

cat > "$ENV_FILE" <<ENV
# Otomatik oluşturuldu: scripts/db/create-mobilkasa-db.sh — GIT'E EKLENMEZ
ConnectionStrings__DefaultConnection=Host=$PG_HOST;Port=$PG_PORT;Database=$DB_NAME;Username=$DB_USER;Password=$DB_PASSWORD
Jwt__Key=$JWT_KEY
ENV
chmod 600 "$ENV_FILE"

echo "OK: '$DB_NAME' veritabanı ve '$DB_USER' kullanıcısı hazır. Bilgiler $ENV_FILE dosyasına yazıldı."
