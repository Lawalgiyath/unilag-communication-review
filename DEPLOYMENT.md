# Deployment Guide — UNILAG Communication Review

How to take this application live on the **University of Lagos CITS server** infrastructure. Written for the CITS systems administrator; no knowledge of the application internals is required.

---

## 1. What CITS needs to provide

| Item | Requirement | Notes |
|---|---|---|
| Server | Linux VM/VPS (Ubuntu 22.04/24.04 LTS recommended) | 1–2 vCPU, 2 GB RAM, 20 GB disk is ample. Windows Server also works (see §10). |
| Domain / subdomain | e.g. `communicationreview.unilag.edu.ng` | A DNS **A record** pointing to the server's public IP. CITS controls the `unilag.edu.ng` zone. |
| Ports | 80 and 443 open inbound | The Node app itself listens only on localhost:3000 behind nginx. |
| TLS certificate | Let's Encrypt (free, automated below) or a CITS-issued certificate | HTTPS is required — Google Scholar and modern browsers expect it. |
| Outbound SMTP (optional) | Credentials for a UNILAG mail relay | Enables submission/decision notification emails. The system works without it. |

No external database server is needed — the application uses an embedded SQLite database file.

---

## 2. Install system software (once)

SSH into the server as a sudo-capable user:

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 22 LTS (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx

node -v   # should print v22.x
```

Create a dedicated service user and directories:

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin journal
sudo mkdir -p /opt/ucr
sudo chown journal:journal /opt/ucr
```

---

## 3. Put the application on the server

Copy the project folder (everything except `node_modules/`, `.next/`, `data/`, `uploads/`) to `/opt/ucr/app`. Any method works — `scp`, `rsync`, or a git repository:

```bash
# from your workstation, e.g.:
rsync -av --exclude node_modules --exclude .next --exclude data --exclude uploads \
  ./ user@SERVER:/tmp/ucr-app/
# then on the server:
sudo mv /tmp/ucr-app /opt/ucr/app
sudo chown -R journal:journal /opt/ucr/app
```

---

## 4. Configure the environment

```bash
sudo -u journal cp /opt/ucr/app/.env.example /opt/ucr/app/.env
sudo -u journal nano /opt/ucr/app/.env
```

Set **exactly** these values (substitute the real domain):

```ini
DATABASE_URL="file:../data/journal.db"
NEXT_PUBLIC_SITE_URL="https://communicationreview.unilag.edu.ng"
UPLOADS_DIR="/opt/ucr/app/uploads"

# Optional — UNILAG mail relay (leave blank to disable email)
SMTP_HOST="smtp.unilag.edu.ng"
SMTP_PORT="587"
SMTP_USER="ucr@unilag.edu.ng"
SMTP_PASS="********"
SMTP_FROM="UNILAG Communication Review <ucr@unilag.edu.ng>"
```

> ⚠️ `NEXT_PUBLIC_SITE_URL` must be the final public HTTPS URL **before** you build. It is baked into Google Scholar citation tags, the sitemap, RSS, and OAI-PMH responses. If the domain ever changes, update it and rebuild.

---

## 5. Build, migrate, and (optionally) seed

```bash
cd /opt/ucr/app
sudo -u journal npm ci
sudo -u journal npx prisma migrate deploy     # creates data/journal.db with the schema
sudo -u journal npm run build
```

**Content decision — pick one:**

- **Start empty (recommended for the real launch):** do nothing further. Create the first admin account by running:
  ```bash
  sudo -u journal npx tsx scripts/create-admin.ts admin@unilag.edu.ng "Journal Administrator"
  ```
  (If this script is not present, run the seed and delete sample content via the dashboard instead.)
- **Start with sample content (for stakeholder demos):** `sudo -u journal npm run db:seed`, then **change all seeded passwords immediately** (they are documented in README.md and are public knowledge).

---

## 6. Run as a service (systemd)

Create `/etc/systemd/system/ucr.service`:

```ini
[Unit]
Description=UNILAG Communication Review (Next.js)
After=network.target

[Service]
Type=simple
User=journal
WorkingDirectory=/opt/ucr/app
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

# Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ReadWritePaths=/opt/ucr/app/data /opt/ucr/app/uploads

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ucr
sudo systemctl status ucr        # should be "active (running)"
curl -I http://localhost:3000    # should return HTTP 200
```

(If CITS prefers **pm2**: `sudo npm i -g pm2 && sudo -u journal pm2 start npm --name ucr -- start && pm2 save && pm2 startup` — equivalent result.)

---

## 7. nginx reverse proxy + HTTPS

Create `/etc/nginx/sites-available/ucr`:

```nginx
server {
    listen 80;
    server_name communicationreview.unilag.edu.ng;

    # File uploads (manuscripts) up to 15 MB
    client_max_body_size 15m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

> The `X-Forwarded-For` header is required — the application uses it for view-count deduplication.

Enable and add HTTPS:

```bash
sudo ln -s /etc/nginx/sites-available/ucr /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Let's Encrypt (auto-renews via systemd timer)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d communicationreview.unilag.edu.ng
```

If CITS issues its own certificate instead, install it in the nginx `server` block per standard practice (listen 443 ssl; ssl_certificate / ssl_certificate_key) and redirect port 80 to 443.

---

## 8. Backups (critical)

Everything that matters lives in **two places**:

1. `/opt/ucr/app/data/journal.db` — the entire database (articles, users, submissions, reviews)
2. `/opt/ucr/app/uploads/` — manuscript files and published PDFs

Nightly backup cron (as root, `sudo crontab -e`):

```cron
30 2 * * * sqlite3 /opt/ucr/app/data/journal.db ".backup /var/backups/ucr/journal-$(date +\%a).db" && rsync -a --delete /opt/ucr/app/uploads/ /var/backups/ucr/uploads/
```

```bash
sudo apt install -y sqlite3
sudo mkdir -p /var/backups/ucr
```

This keeps 7 rotating daily database snapshots. CITS should additionally copy `/var/backups/ucr/` to off-server storage on its normal schedule. **Test a restore once** (copy a snapshot over `journal.db` on a staging copy and start the app).

---

## 9. Updating the application later

```bash
cd /opt/ucr/app
sudo systemctl stop ucr
# copy in the new code (rsync/git pull), then:
sudo -u journal npm ci
sudo -u journal npx prisma migrate deploy
sudo -u journal npm run build
sudo systemctl start ucr
```

Database and uploads are untouched by updates.

---

## 10. If CITS only offers a Windows server

The stack runs identically: install Node 22 LTS, run steps §4–5 in PowerShell, run the app with [NSSM](https://nssm.cc) or `pm2-windows-service` instead of systemd, and use IIS (with ARR reverse-proxy + URL Rewrite) or nginx-for-Windows in place of §7. Set `UPLOADS_DIR` to e.g. `C:\ucr\uploads` and back up `data\journal.db` + `uploads\` the same way.

---

## 11. Go-live checklist

- [ ] DNS resolves: `ping communicationreview.unilag.edu.ng`
- [ ] HTTPS works, port 80 redirects to 443
- [ ] Homepage loads; Archives → an issue → an article all reachable by clicking links
- [ ] An article page shows the abstract without logging in
- [ ] `view-source:` on an article page shows `citation_title`, `citation_author`, `citation_publication_date`, `citation_pdf_url` meta tags, and the `citation_pdf_url` opens a PDF
- [ ] `https://<domain>/robots.txt` allows `/` and disallows `/dashboard`
- [ ] `https://<domain>/sitemap.xml`, `/feed.xml`, and `/oai?verb=Identify` all respond
- [ ] All seeded demo passwords changed or demo users deleted
- [ ] A real admin/editor account exists and can log in
- [ ] Test submission round-trip: register a test author → submit → editor sees it
- [ ] Backups cron installed and first snapshot exists in `/var/backups/ucr/`
- [ ] (Optional) SMTP configured and a decision email arrives

## 12. Getting indexed by Google Scholar

There is **no submission form** — Scholar discovers compliant sites by crawling. After go-live:

1. Ensure the site is publicly reachable and stays up (frequent downtime delays or removes indexing).
2. Optionally register the domain in [Google Search Console](https://search.google.com/search-console) and submit the sitemap — this accelerates regular-Google discovery, which helps Scholar find the site.
3. Wait **4–8 weeks**, then verify by searching Google Scholar for several exact article titles (not `site:` queries).
4. If articles are still absent after ~2 months, email **scholar-support@google.com** with 2–3 example article URLs.
5. Keep URLs permanent. If the site must ever move, use per-article 301 redirects — never redirect old article links to the homepage.

For broader indexing, the OAI-PMH endpoint (`https://<domain>/oai`) can be registered with [AJOL](https://www.ajol.info), [BASE](https://www.base-search.net/about/en/suggest.php), and library aggregators. DOI registration via Crossref membership is a recommended future step (the system already stores and displays DOIs per article).

---

## Support quick reference

| Symptom | Check |
|---|---|
| 502 from nginx | `sudo systemctl status ucr` and `journalctl -u ucr -n 50` |
| Uploads fail at ~1 MB | `client_max_body_size 15m;` missing in nginx |
| Wrong URLs in citation tags / sitemap | `NEXT_PUBLIC_SITE_URL` wrong at build time → fix `.env`, rebuild |
| Emails not arriving | SMTP vars in `.env`; failures are logged in the EmailLog table and `journalctl` |
| View counts all from one IP | `proxy_set_header X-Forwarded-For` missing in nginx |
