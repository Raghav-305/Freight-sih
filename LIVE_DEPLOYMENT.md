# Live Deployment Guide

How to put this **whole** project on a public or internal server, including trained ML models, data, database, FastAPI backend, and the React frontend.

This is **not** a Vercel / Netlify / Hatchable-only app. Inference loads Python artifacts from disk (`ml/models/`). Those files must live on the **server filesystem**, never in the browser, and not on a typical serverless host.

The Hatchable `public/` + `api/` tree is a separate demo surface. Live production is:

- Frontend: `frontend/` (Vite + React)
- Backend: `backend/` (FastAPI)
- Models: `ml/models/` + `ml/registry/model_registry.json` + `ml/artifacts/`
- Data: `data/`
- Database: PostgreSQL (Docker Compose) or the local SQLite file under `data/` if you explicitly override it

---

## 1. What you are uploading

| Piece | Where it lives | How it goes live | Browser-visible? |
|---|---|---|---|
| React UI | `frontend/` | Build `frontend/dist`, serve with Nginx | Yes |
| FastAPI | `backend/` | `uvicorn` on the server (or Docker) | Only via HTTP API |
| Model files (`.pkl`, `.joblib`, JSON schemas) | `ml/models/` | Copy onto the server disk | **No** |
| Model registry | `ml/registry/model_registry.json` | Copy with the repo | **No** |
| Preprocessors / scalers | `ml/artifacts/` | Copy onto the server disk | **No** |
| Reference datasets | `data/` | Copy onto the server disk | **No** |
| PostgreSQL | Compose service or managed DB | Run on the server / cloud DB | **No** |
| Secrets | `.env` | Create **on the server**, never commit | **No** |

Rule from the project spec: **do not put trained models in `frontend/`, `public/`, or any static folder the browser can download.**

---

## 2. Choose a host (what actually works)

### Recommended: one Linux VM + Docker Compose

Works on:

- A campus / ministry / PSU internal VM
- DigitalOcean Droplet, AWS EC2, Azure VM, GCP Compute Engine
- Any Ubuntu 22.04+ box with 4+ GB RAM (8 GB if several models load at once)

You copy the repo **and** the model/data directories to that machine, then run Compose (or systemd). One public URL in front of Nginx is enough.

### Do not use these as the only host for ML inference

| Host | Why it fails for this repo |
|---|---|
| Hatchable | Demo/static JS surface, not the FastAPI + `ml/models` runtime |
| Vercel / Netlify (frontend only) | Fine **only** for the built UI. They cannot load your `.pkl` models |
| GitHub Pages | Static files only |
| Typical serverless Python (short timeout, no persistent disk) | Model load + forecast will time out or lose artifacts |

You *can* put the **frontend** on Vercel and the **API + models** on a VM. If you do that, set `VITE_API_BASE_URL` at **build time** to the public API URL and restrict CORS.

### GitHub is not “live”

Pushing to GitHub is source backup, not deployment.

- GitHub file limit is **100 MB**. This repo already gitignores `data/raw/vessel_intelligence/vessel_intelligence_daily.csv` (~324 MB).
- Typical model `.pkl` files in this project are small enough for git, but **do not** assume every future artifact will be.
- Never commit `.env`, private keys, or `AMOY_PRIVATE_KEY`.

For large models/data, use **scp/rsync**, object storage, or Git LFS — not a giant git push.

---

## 3. Before you upload: inventory models

On your laptop, from the repo root:

```bash
ls ml/models
ls ml/registry
```

Expected registry: `ml/registry/model_registry.json`.

Current registered families (paths are relative to `MODEL_ROOT_PATH`, default `./ml/models`):

| Version | Folder under `ml/models/` | Artifact |
|---|---|---|
| `xgb_panamax_freight_v7` | `forecasting/xgboost/panamax_freight_v7/` | `model.pkl` |
| `congestion_sih_v1` | `congestion/congestion_sih_v1/` | `congestion_model.pkl` |
| `market_intelligence_v1` | `market_intelligence/market_intelligence_v1/` | `market_intelligence_model.pkl` |
| `vessel_intelligence_v2` | `vessel_intelligence/vessel_intelligence_v2/` | `waiting_time_model.joblib` |
| `fos_v1` | `freight_opportunity_score/fos_v1/` | `fos_model.pkl` |
| `bid_anomaly_detection_v1` | `collusion_detection/bid_anomaly_detection_v1/` | `model.pkl` |

Each folder should also have its `metadata.json` / feature schema as listed in the registry.

If a file is missing on the server, that model’s API will fail even if the UI is “live”.

---

## 4. Recommended path: Ubuntu VM + Nginx + Docker (or venv)

Replace `YOUR_SERVER_IP` and `your.domain.gov.in` with real values.

### 4.1 Server packages

```bash
sudo apt update
sudo apt install -y git nginx docker.io docker-compose-v2 python3-venv
sudo usermod -aG docker $USER
# log out and back in so docker works without sudo
```

Point a DNS A record at the VM if you have a domain. Otherwise use the public IP.

### 4.2 Copy the project (code + models + data)

**Option A — git clone, then copy large files separately**

On the server:

```bash
cd /opt
sudo mkdir -p freight-chartering-v4
sudo chown $USER:$USER freight-chartering-v4
git clone <YOUR_GIT_URL> freight-chartering-v4
cd freight-chartering-v4
```

From your laptop (PowerShell), sync models and data that git may not contain:

```powershell
scp -r ml\models user@YOUR_SERVER_IP:/opt/freight-chartering-v4/ml/
scp -r ml\artifacts user@YOUR_SERVER_IP:/opt/freight-chartering-v4/ml/
scp -r data user@YOUR_SERVER_IP:/opt/freight-chartering-v4/
```

Or rsync (Git Bash / WSL):

```bash
rsync -avP ml/models/ user@YOUR_SERVER_IP:/opt/freight-chartering-v4/ml/models/
rsync -avP ml/artifacts/ user@YOUR_SERVER_IP:/opt/freight-chartering-v4/ml/artifacts/
rsync -avP data/ user@YOUR_SERVER_IP:/opt/freight-chartering-v4/data/
```

**Option B — one archive (simplest for a jury / demo VM)**

On your laptop, from the parent of the repo:

```powershell
tar -cvf freight-live.tar --exclude=node_modules --exclude=.venv --exclude=frontend/dist freight-chartering-v4
```

Upload `freight-live.tar` (scp, USB, approved file transfer), then on the server:

```bash
tar -xvf freight-live.tar -C /opt
cd /opt/freight-chartering-v4
```

Confirm models exist:

```bash
test -f ml/models/forecasting/xgboost/panamax_freight_v7/model.pkl && echo "forecast model OK"
test -f ml/registry/model_registry.json && echo "registry OK"
```

### 4.3 Secrets on the server only

```bash
cp .env.example .env
nano .env
```

Minimum live values:

```env
ENVIRONMENT=production
VITE_API_MODE=live
# If Nginx serves UI and API on the SAME host, use empty or the public origin.
# Vite bakes this in at `npm run build`. Wrong value = browser calls localhost.
VITE_API_BASE_URL=https://your.domain.gov.in
VITE_APP_ENV=production

DATABASE_URL=postgresql+psycopg://freight_user:CHANGE_THIS_PASSWORD@postgres:5432/freight_intelligence
CORS_ORIGINS=https://your.domain.gov.in

MODEL_ROOT_PATH=./ml/models
MODEL_ARTIFACT_PATH=./ml/artifacts
MODEL_REGISTRY_PATH=./ml/registry/model_registry.json
DATA_ROOT_PATH=./data
MARKET_INTELLIGENCE_DATA_PATH=./data/features/market_intelligence

AISSTREAM_API_KEY=
IMD_LIVE=0
AMOY_PRIVATE_KEY=
```

Change the Postgres password in both `.env` and `docker-compose.yml` (or override with `environment:`) before opening the VM to the internet.

### 4.4 Start API + database

From `/opt/freight-chartering-v4`:

```bash
docker compose up -d --build postgres backend
```

The Compose file already mounts:

```text
./ml  -> /app/ml   (read-only)
./data -> /app/data (read-only)
```

so replacing a file under `ml/models/` on the host updates what the container can read. Restart the backend after swapping artifacts:

```bash
docker compose restart backend
```

Health check:

```bash
curl -s http://127.0.0.1:8000/health
curl -s http://127.0.0.1:8000/docs
```

(Use the exact health path your app exposes if `/health` is mounted under a prefix.)

### 4.5 Build the frontend for production

On the **server** (so `VITE_*` from `.env` / the shell is used at build time):

```bash
cd /opt/freight-chartering-v4/frontend
npm ci
export VITE_API_BASE_URL=https://your.domain.gov.in
export VITE_API_MODE=live
export VITE_APP_ENV=production
npm run build
```

Same-origin pattern (recommended): Nginx serves the UI and proxies `/api` (and other backend routes) to port 8000. Then set:

```bash
export VITE_API_BASE_URL=https://your.domain.gov.in
```

If the UI is on another host, `VITE_API_BASE_URL` must be the **public** FastAPI URL (`https://api.your.domain.gov.in`). Never leave the default `http://127.0.0.1:8000` in a production build — that hits the **user’s** machine, not your server.

### 4.6 Nginx: one public site

Example `/etc/nginx/sites-available/freight`:

```nginx
server {
    listen 80;
    server_name your.domain.gov.in;

    root /opt/freight-chartering-v4/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # FastAPI (adjust prefixes if your routes are only under /api)
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    location /docs {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }

    # Never alias ml/ or data/ here
}
```

```bash
sudo ln -s /etc/nginx/sites-available/freight /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

HTTPS (when you have a domain):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your.domain.gov.in
```

Open firewall: `80`, `443`. Do **not** expose Postgres `5432` to the internet.

---

## 5. Alternative: no Docker (venv + systemd)

If Docker is not allowed:

```bash
cd /opt/freight-chartering-v4
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

Install PostgreSQL on the host, create DB `freight_intelligence`, set `DATABASE_URL` in `.env`.

systemd unit `/etc/systemd/system/freight-api.service`:

```ini
[Unit]
Description=Freight Chartering FastAPI
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/opt/freight-chartering-v4
EnvironmentFile=/opt/freight-chartering-v4/.env
ExecStart=/opt/freight-chartering-v4/.venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now freight-api
```

Serve `frontend/dist` with Nginx as in section 4.6.

---

## 6. Split hosting (UI on CDN, API on VM)

1. Deploy FastAPI + `ml/` + `data/` + Postgres on the VM (sections 4.2–4.4).
2. Put TLS on the API (`https://api.your.domain.gov.in`).
3. Build the frontend **once** with:

   ```env
   VITE_API_BASE_URL=https://api.your.domain.gov.in
   VITE_API_MODE=live
   ```

4. Upload only `frontend/dist` to Vercel/Netlify/S3+CloudFront.
5. Set `CORS_ORIGINS` on the API to the UI origin only (not `*`).

Models still never leave the VM.

---

## 7. Updating models after go-live

You do **not** rebuild the frontend when a model changes, as long as the FastAPI JSON contract stays the same.

1. Copy new files into the same folder names under `ml/models/...`.
2. Update `ml/registry/model_registry.json` if version, artifact name, or `relative_path` changed.
3. Restart backend: `docker compose restart backend` or `sudo systemctl restart freight-api`.
4. Hit `/api/models` (or the models route you already use) and run one forecast.

Keep the previous artifact until the new one is verified.

---

## 8. Optional live feeds

These are **not** required for core forecasting.

| Variable | Default | Live meaning |
|---|---|---|
| `AISSTREAM_API_KEY` | empty | Empty = offline AIS simulator |
| `IMD_LIVE` | `0` | `1` = live IMD weather (needs outbound internet) |
| `AMOY_PRIVATE_KEY` | empty | Testnet audit anchoring only; throwaway wallet |

For an air-gapped / intranet go-live, leave them unset.

---

## 9. Smoke test after deploy

- [ ] `https://your.domain.gov.in` loads the React app (not Hatchable `public/index.html`)
- [ ] Browser network tab: API calls go to **your server**, not `127.0.0.1`
- [ ] Forecast / charter / models pages return real payloads with `model_version` set
- [ ] GIS map: backend must be up for `/api/map/*`; basemap tiles may still need outbound HTTPS unless you self-host tiles
- [ ] `ml/` is not downloadable as a static URL
- [ ] `.env` is not in git and not in `frontend/dist`
- [ ] Postgres is not open on `0.0.0.0:5432`

---

## 10. What “upload to GitHub” should look like

Safe to push:

- Source under `frontend/src`, `backend/`, `ml/inference/`, `ml/registry/`
- Small model files already in the repo (if each file is under 100 MB)

Do not push:

- `.env`, keys, `*.pem`
- `node_modules/`, `.venv/`, `frontend/dist/`
- Huge CSVs (already gitignored example: `vessel_intelligence_daily.csv`)

Copy those last items with scp/rsync onto the live machine as in section 4.2.

---

## 11. Quick command sheet

```bash
# on server
cd /opt/freight-chartering-v4
docker compose up -d --build postgres backend
cd frontend && VITE_API_BASE_URL=https://your.domain.gov.in VITE_API_MODE=live npm ci && npm run build

# replace a model
scp model.pkl user@YOUR_SERVER_IP:/opt/freight-chartering-v4/ml/models/forecasting/xgboost/panamax_freight_v7/
ssh user@YOUR_SERVER_IP "cd /opt/freight-chartering-v4 && docker compose restart backend"
```

Local architecture, env vars, and model folder layout are also in [README.md](README.md) and [docs/MODEL_HANDOFF.md](docs/MODEL_HANDOFF.md).
