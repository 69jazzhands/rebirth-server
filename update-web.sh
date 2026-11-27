#!/bin/bash
# Keeps the server up to date from this repo without touching its data or its keys:
# the hosted game (https://your-domain/) and the game server's own code.
#   sudo bash update-web.sh          update now
#   sudo bash update-web.sh --auto   update now, then check GitHub for a new version every 5 minutes
set -e
cd "$(dirname "$0")"
# pull first, then run the freshly pulled copy of this script
if [ "$1" != "--pulled" ]; then
  git -c safe.directory="$(pwd)" pull --ff-only -q
  exec bash "$0" --pulled "$@"
fi
shift
mkdir -p /opt/rebirth/www
rm -rf /opt/rebirth/www/*
cp -r www/. /opt/rebirth/www/
echo "Rebirth web game updated: $(git -c safe.directory="$(pwd)" log -1 --format='%h %s')"
# the game server's code: copy it and restart the server only when it changed (players reconnect by themselves)
if [ -d /opt/rebirth/data/modules ] && ! cmp -s data/modules/index.js /opt/rebirth/data/modules/index.js; then
  cp data/modules/index.js /opt/rebirth/data/modules/index.js
  systemctl restart rebirth && echo "Game server code updated and restarted."
fi
# automatic updates: check GitHub every 5 minutes (an older 15-minute schedule switches itself over)
if [ "$1" = "--auto" ] || grep -q '^\*/15 ' /etc/cron.d/rebirth-web 2>/dev/null; then
  echo "*/5 * * * * root cd $(pwd) && bash update-web.sh >/dev/null 2>&1" > /etc/cron.d/rebirth-web
  chmod 644 /etc/cron.d/rebirth-web
  echo "Automatic updates on: the server checks GitHub every 5 minutes."
fi
