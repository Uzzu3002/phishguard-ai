# Hosting PhishGuard AI on an Android phone

This runs the whole app (backend + built frontend) on an Android phone with Termux.
It is reachable **only from your own devices** over [Tailscale](https://tailscale.com),
over HTTPS, at an address like:

```
https://myphone.tail1234.ts.net:5443
```

## Why a name and not a bare IP address

Google sign-in only redirects back to `localhost` or to a real domain name over HTTPS.
A plain `http://100.x.y.z` address is rejected, so the app uses the phone's Tailscale
name (`*.ts.net`) together with a certificate you create with `mkcert`.
The server still listens only on the phone's Tailscale IP.

## What protects the server

| Layer | Effect |
|---|---|
| Tailscale | Only devices signed in to your tailnet can reach the phone. Nothing is exposed to the internet or your Wi-Fi. |
| `HOST` = Tailscale IP | The server does not listen on the Wi-Fi / mobile-data interfaces at all. |
| HTTPS (`TLS_CERT_FILE`) | Traffic and session cookies are encrypted; cookies are `Secure`, `HttpOnly`, `SameSite=Lax`. |
| `ALLOWED_EMAILS` | Only your Google account can sign in, even from a device on the tailnet. |
| Production checks | The server refuses to start without a strong `SESSION_SECRET`. Security headers (CSP, HSTS) are on. |

---

## 1. Tailscale (phone and every device you'll browse from)

1. Install **Tailscale** from the Play Store on the phone, and on your laptop / other devices.
2. Sign in to the **same account** on all of them.
3. In the [admin console → Machines](https://login.tailscale.com/admin/machines), note the phone's:
   - **Tailscale IP**, e.g. `100.101.102.103`
   - **full name**, e.g. `myphone.tail1234.ts.net` (MagicDNS must be on — it is by default; check under *DNS*).
4. On the phone: *Settings → Apps → Tailscale → Battery → Unrestricted*, so Android doesn't stop it.

## 2. Termux and Node.js (phone)

Install **Termux from F-Droid** (the Play Store build is outdated), then:

```bash
pkg update && pkg upgrade
pkg install nodejs git termux-api iproute2
```

Also set *Settings → Apps → Termux → Battery → Unrestricted*.

## 3. Get the code onto the phone

```bash
git clone https://github.com/<your-account>/phishguard-ai.git
cd phishguard-ai
(cd backend && npm install --omit=dev)
(cd frontend && npm install)
```

> The phone only gets what is **pushed** to GitHub. Commit and push your latest changes first,
> or copy the project folder over instead of cloning.

If `npm install` in `frontend/` fails on the phone, build on your laptop with
`npm run build:phone` and copy `frontend/dist/` to the phone instead.

## 4. HTTPS certificate (on your Windows laptop)

```powershell
winget install FiloSottile.mkcert
mkcert -install
mkcert -cert-file phone.pem -key-file phone-key.pem myphone.tail1234.ts.net 100.101.102.103
```

Use your phone's real name and IP. Copy `phone.pem` and `phone-key.pem` to the phone
into `phishguard-ai/backend/certs/` (Taildrop in the Tailscale app, or USB). This folder is gitignored.

**Trust the certificate on every device you browse from.** `mkcert -install` already did this
for the laptop. For an Android device (including the phone itself if you browse on it):

1. Run `mkcert -CAROOT` on the laptop and copy `rootCA.pem` from that folder to the device.
2. *Settings → Security → More security settings → Encryption & credentials → Install a certificate → CA certificate*, pick `rootCA.pem`.

Never share `rootCA-key.pem` — anyone with it can impersonate any website to your devices.

## 5. Google Cloud console

In your OAuth client (*APIs & Services → Credentials*):

- **Authorised JavaScript origins:** `https://myphone.tail1234.ts.net:5443`
- **Authorised redirect URIs:** `https://myphone.tail1234.ts.net:5443/api/auth/callback`

While the consent screen is in *Testing*, your Gmail address must be listed under **Test users**.

## 6. `backend/.env` on the phone

```bash
cd ~/phishguard-ai/backend
cp .env.example .env
nano .env
chmod 600 .env
```

```ini
NODE_ENV=production
PORT=5443
HOST=100.101.102.103
SERVE_FRONTEND=true
TLS_CERT_FILE=./certs/phone.pem
TLS_KEY_FILE=./certs/phone-key.pem

BACKEND_URL=https://myphone.tail1234.ts.net:5443
FRONTEND_URL=https://myphone.tail1234.ts.net:5443
GOOGLE_REDIRECT_URI=https://myphone.tail1234.ts.net:5443/api/auth/callback
ALLOWED_EMAILS=you@gmail.com

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GEMINI_API_KEY=...
SESSION_SECRET=...   # generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 7. Start it

```bash
cd ~/phishguard-ai
bash scripts/start-phone.sh            # builds the frontend on first run
bash scripts/start-phone.sh --rebuild  # after pulling frontend changes
```

Open `https://myphone.tail1234.ts.net:5443` on any of your Tailscale devices and sign in with Google.

To keep it running after you close Termux, start it inside `tmux` (`pkg install tmux`),
or use the Termux:Boot add-on to start it when the phone boots.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Tailscale address ... is not active` / `EADDRNOTAVAIL` | Tailscale is disconnected, or `HOST` doesn't match the phone's Tailscale IP. |
| Google: `redirect_uri_mismatch` | The redirect URI in Google Cloud must match `BACKEND_URL` + `/api/auth/callback` exactly, including `:5443`. |
| Browser: "Your connection is not private" | That device hasn't trusted `rootCA.pem` (step 4), or you opened a name/IP not listed in the `mkcert` command. |
| Site unreachable | The browsing device isn't connected to Tailscale, or Android stopped Termux (check battery settings). |
| Signed out after a restart | Expected: sessions are kept in memory, so restarting the server signs everyone out. |
| `SESSION_SECRET must be set...` | Set a random secret of at least 32 characters (command above). |
