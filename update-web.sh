#!/bin/bash
# Refreshes the hosted game (https://your-domain/) from this repo without touching the server, its data or its keys.
#   sudo bash update-web.sh          update now
#   sudo bash update-web.sh --auto   update now, then check GitHub for a new version every 15 minutes
set -e
cd "$(dirname "$0")"
git -c safe.directory="$(pwd)" pull --ff-only -q
mkdir -p /opt/rebirth/www
rm -rf /opt/rebirth/www/*
cp -r www/. /opt/rebirth/www/
echo "Rebirth web game updated: $(git -c safe.directory="$(pwd)" log -1 --format='%h %s')"
if [ "$1" = "--auto" ]; then
  echo "*/15 * * * * root cd $(pwd) && bash update-web.sh >/dev/null 2>&1" > /etc/cron.d/rebirth-web
  chmod 644 /etc/cron.d/rebirth-web
  echo "Automatic updates on: the server checks GitHub every 15 minutes."
fi
