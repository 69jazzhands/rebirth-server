#!/bin/bash
# ===== Rebirth: paste this whole script into Oracle's "Initialization script" box =====
# Fill in the two lines below, then create the server. It installs itself in about 5-10 minutes.
DUCKDNS_NAME="rebirth-game"          # your DuckDNS name (without .duckdns.org)
DUCKDNS_TOKEN="paste-your-token"     # the token shown at the top of duckdns.org after you sign in
# ===================================================================================
exec > /var/log/rebirth-install.log 2>&1
set -x
export DEBIAN_FRONTEND=noninteractive
# point the DuckDNS name at this server (DuckDNS uses the address the request comes from)
curl -fsS "https://www.duckdns.org/update?domains=${DUCKDNS_NAME}&token=${DUCKDNS_TOKEN}&ip=" || true
# keep the name pointed here once an hour
echo "17 * * * * root curl -fsS 'https://www.duckdns.org/update?domains=${DUCKDNS_NAME}&token=${DUCKDNS_TOKEN}&ip=' >/dev/null" > /etc/cron.d/duckdns
cd /root
curl -fsSL -o kit.tar.gz https://github.com/69jazzhands/rebirth-server/archive/refs/heads/main.tar.gz
rm -rf rebirth-server-main && tar -xzf kit.tar.gz
cd rebirth-server-main
bash setup.sh "${DUCKDNS_NAME}.duckdns.org"
echo "REBIRTH INSTALL FINISHED"
