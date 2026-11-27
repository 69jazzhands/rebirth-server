#!/usr/bin/env bash
# Rebirth game server: one-time setup on a fresh Ubuntu 22.04/24.04 machine
# (made for Oracle Cloud's Always Free VM, works on any Ubuntu server).
#
#   sudo bash setup.sh your-name.duckdns.org
#
# Installs: PostgreSQL (database), Nakama (accounts, friends, online play) and Caddy (HTTPS).
# The game itself is also served at https://your-name.duckdns.org so anyone can play in a browser.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then echo "Usage: sudo bash setup.sh your-domain (for example rebirth-game.duckdns.org)"; exit 1; fi
cd "$(dirname "$0")"
KIT="$(pwd)"
ARCH=$(uname -m); case "$ARCH" in aarch64|arm64) BIN=bin/nakama-arm64;; x86_64|amd64) BIN=bin/nakama-amd64;; *) echo "Unsupported CPU $ARCH"; exit 1;; esac
[ -f "$BIN" ] || { [ -f "$BIN.gz" ] && gunzip -kf "$BIN.gz"; }

echo "== Installing PostgreSQL and Caddy"
apt-get update -y
apt-get install -y postgresql caddy openssl curl iptables-persistent || apt-get install -y postgresql caddy openssl curl
if ! command -v caddy >/dev/null; then
  # older Ubuntu: add Caddy's own package source
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https gnupg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y && apt-get install -y caddy
fi

echo "== Database"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='nakama'" | grep -q 1 || sudo -u postgres psql -c "CREATE ROLE nakama LOGIN PASSWORD 'nakama'"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='nakama'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE nakama OWNER nakama"

echo "== Nakama"
install -d /opt/rebirth/data/modules /opt/rebirth/www
install -m 755 "$BIN" /opt/rebirth/nakama
cp data/modules/index.js /opt/rebirth/data/modules/
if [ ! -f /opt/rebirth/data/rebirth.yml ]; then
  cp data/rebirth.yml /opt/rebirth/data/rebirth.yml
  for n in 1 2 3; do sed -i "s/CHANGE-ME-long-random-$n/$(openssl rand -hex 24)/" /opt/rebirth/data/rebirth.yml; done
  ADMIN_PW=$(openssl rand -base64 18 | tr -d '/+=')
  sed -i "s/CHANGE-ME-admin-password/$ADMIN_PW/" /opt/rebirth/data/rebirth.yml
  echo "$ADMIN_PW" > /opt/rebirth/admin-password.txt; chmod 600 /opt/rebirth/admin-password.txt
fi
/opt/rebirth/nakama migrate up --database.address nakama:nakama@127.0.0.1:5432/nakama

cat > /etc/systemd/system/rebirth.service <<EOF
[Unit]
Description=Rebirth game server (Nakama)
After=network.target postgresql.service
[Service]
WorkingDirectory=/opt/rebirth
ExecStart=/opt/rebirth/nakama --config /opt/rebirth/data/rebirth.yml --data_dir /opt/rebirth/data --database.address nakama:nakama@127.0.0.1:5432/nakama
Restart=always
RestartSec=3
LimitNOFILE=65535
[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now rebirth
systemctl restart rebirth

echo "== Game files"
rm -rf /opt/rebirth/www/*
cp -r www/. /opt/rebirth/www/

echo "== HTTPS (Caddy gets a free certificate automatically)"
cat > /etc/caddy/Caddyfile <<EOF
$DOMAIN {
  encode gzip
  @api path /v2/* /ws /healthcheck
  reverse_proxy @api 127.0.0.1:7350
  root * /opt/rebirth/www
  file_server
}
EOF
systemctl restart caddy

echo "== Opening ports 80 and 443 on this machine"
iptables -C INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT
command -v netfilter-persistent >/dev/null && netfilter-persistent save || true

sleep 3
echo
if curl -fsS http://127.0.0.1:7350/healthcheck >/dev/null; then echo "Rebirth server is running."; else echo "The server did not start. See: journalctl -u rebirth -n 50"; fi
echo "Game:   https://$DOMAIN"
echo "Server address for the apps: https://$DOMAIN"
echo "Admin console (only from this machine, via SSH tunnel): http://127.0.0.1:7351  user admin, password in /opt/rebirth/admin-password.txt"
echo "Steam/Epic keys go in /opt/rebirth/data/rebirth.yml (runtime > env), then: sudo systemctl restart rebirth"
