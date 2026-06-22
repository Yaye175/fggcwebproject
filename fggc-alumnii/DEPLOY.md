# Deploying FGGC Alumni to Railway

Railway runs the Node backend **and** a managed MySQL database in one project, with
automatic HTTPS (auto-issued, auto-renewing certificate). You do not configure TLS
yourself — the public `https://…` URL Railway gives you is the cert.

The backend also serves the frontend (`express.static`), so you deploy **one service**.

---

## Prerequisites
- Code pushed to GitHub (`Yaye175/fggcwebproject`).
- A Railway account (https://railway.app), signed in with GitHub.

---

## Step 1 — Push the latest code
The hardening commit must be on GitHub before Railway can build it:

```bash
git push origin main
```

(The old secrets remain in git *history*; they are neutralised because the JWT
secret was rotated and the leaked Gmail app password was revoked. History scrubbing
is optional — see the security notes.)

## Step 2 — Create the project
1. Railway → **New Project → Deploy from GitHub repo** → pick `fggcwebproject`.
2. After it imports, open the created **service → Settings**.

## Step 3 — Point the service at the backend
The app lives in a subfolder, so in **Settings → Build**:
- **Root Directory:** `fggc-alumnii/backend`
- **Start Command:** `npm start` (already defined in `package.json`)

> The backend serves the frontend via `../../frontend`. If the site loads JSON/404s
> instead of the homepage after deploy, the static path didn't resolve — tell me and
> I'll make `index.js` resolve the frontend path robustly.

## Step 4 — Add MySQL
1. In the project: **New → Database → Add MySQL**.
2. Open the MySQL service → **Variables** tab. You'll see `MYSQLHOST`, `MYSQLPORT`,
   `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`. You'll reference these next.

## Step 5 — Set the backend's environment variables
On the **backend service → Variables**, add these. Use Railway's reference syntax
`${{MySQL.VARNAME}}` so they stay in sync (replace `MySQL` with your DB service name):

| Variable | Value |
|---|---|
| `JWT_SECRET` | a long random string (≥ 32 chars) — generate a fresh one for prod |
| `DB_HOST` | `${{MySQL.MYSQLHOST}}` |
| `DB_PORT` | `${{MySQL.MYSQLPORT}}` |
| `DB_USER` | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `DB_NAME` | `${{MySQL.MYSQLDATABASE}}` |
| `DB_SSL` | leave empty (private network) |
| `EMAIL_USER` | `atolitech7@gmail.com` |
| `EMAIL_PASS` | your **current** Gmail app password |
| `FRONTEND_URL` | your Railway app URL (set after Step 7) |
| `CORS_ORIGIN` | same Railway app URL |

> `PORT` is injected by Railway automatically — do **not** set it. The app already
> reads `process.env.PORT`.

## Step 6 — Create the database tables
Connect to the MySQL instance once and run `backend/schema.sql`:
- In the MySQL service → **Connect** tab, copy the public connection string.
- Use the `mysql` CLI or a GUI (MySQL Workbench / TablePlus / DBeaver) to connect and
  run the contents of `fggc-alumnii/backend/schema.sql`.
- Then promote your own account to admin once you've signed up:
  `UPDATE users SET is_admin = TRUE WHERE email = 'you@example.com';`

## Step 7 — Generate the public domain
1. Backend service → **Settings → Networking → Generate Domain**.
2. Copy the `https://…up.railway.app` URL.
3. Set `FRONTEND_URL` and `CORS_ORIGIN` (Step 5) to that exact URL, then redeploy.

## Step 8 — Verify
- Visit `https://<your-app>.up.railway.app/health` → `{ "status": "OK", "database": "Connected" }`.
- Load the homepage, sign up, log in, and confirm the dashboard loads.
- Test the password-reset email (confirms `EMAIL_PASS` works in prod).

---

## Known caveats
- **File uploads are ephemeral.** Gallery/news uploads write to local disk and are
  **lost on every redeploy/restart**. Before relying on uploads, attach a Railway
  **Volume** mounted at the uploads directory, or move uploads to object storage
  (Cloudflare R2 / S3). This is the one item not yet solved.
- **Generate a new `JWT_SECRET` for production** — don't reuse the local-dev value.
