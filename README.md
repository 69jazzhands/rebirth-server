# Rebirth game server

Runs everything online for Rebirth: accounts, friend codes, friends across phones, PC, Steam, Epic and
console browsers, invites, the shared city and private games. It also hosts the game itself at your
address, so anyone can play in a browser.

**Cost: $0** on Oracle Cloud Always Free, with a free DuckDNS address.

## Set up a server by pasting one script (no terminal needed)

**1. Get a free address.** Sign in at **duckdns.org** and add a name, for example `rebirth-game`.
Copy your **token** from the top of the page.

**2. Create the server in Oracle.** Go to **Compute > Instances > Create instance**.
- **Image:** Ubuntu 24.04.
- **Shape:** Ampere VM.Standard.A1.Flex, 2 OCPUs and 12 GB. If there's no capacity, use VM.Standard.E2.1.Micro.
- **SSH keys:** Save private key, so you can log in later if needed.
- **Show advanced options > Management > Initialization script:** choose **Paste cloud-init script** and paste all of
  [`oracle-init.sh`](oracle-init.sh). Change `DUCKDNS_NAME` and `DUCKDNS_TOKEN` at the top to your own.
- Tap **Create**.

**3. Open the web ports.** On the instance page, open **Subnet > Security List > Add Ingress Rules**:
source `0.0.0.0/0`, TCP, destination ports `80,443`.

**4. Wait about 10 minutes**, then open `https://rebirth-game.duckdns.org` (use your own name).
The game should load and say *Online: connected* in the menu.

**5. Point the apps at it.** In the Android app, iPhone app or PC version, enter the address under
**MENU > Game server**.

### If it doesn't load
- Check that step 3 is done. It's the most common miss.
- Log in with your saved key and read the install log: `sudo tail -50 /var/log/rebirth-install.log`
- Server log: `journalctl -u rebirth -n 100`

## Setup by hand
```
sudo bash setup.sh your-name.duckdns.org
```
Run this inside a copy of this repo. Running it again updates the server; players and friends are kept.

## Steam and Epic keys (only when you publish there)
Edit `/opt/rebirth/data/rebirth.yml` (the `env` lines), then run `sudo systemctl restart rebirth`.
- **Steam:** `STEAM_PUBLISHER_KEY` (Steamworks > Users & Permissions > Manage Groups) and `STEAM_APP_ID`.
- **Epic:** `EPIC_CLIENT_ID`, `EPIC_CLIENT_SECRET` and `EPIC_DEPLOYMENT_ID` from the Epic Developer Portal.

## What's inside
- `setup.sh` installs PostgreSQL, the Nakama server (`bin/`, built from Nakama 3.42) and Caddy for HTTPS, and
  creates its own security keys.
- `data/modules/index.js` holds Rebirth's server rules: invites, and Steam and Epic sign-in checks.
- `www/` is the game.
