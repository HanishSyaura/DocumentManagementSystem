# Full Guide — Upload Code ke VM + Deploy DMS (PM2 + Nginx + MySQL/MariaDB)

Dokumen ni ikut codebase dalam folder ini:

- Backend: Node.js + Express + Prisma (MySQL/MariaDB), default `PORT=4000`, API prefix `/api`, uploads `/uploads`
- Frontend: Vite, build output `dist`, frontend call API ke `/api`

---

## PART 1 — Upload code dari PC ke VM

Pilih satu cara.

### Option A (Recommended): Git pull di VM

Di VM (sekali sahaja):

```bash
sudo mkdir -p /var/www/dms
sudo chown -R $USER:$USER /var/www/dms
cd /var/www/dms
git clone <REPO_GIT_URL> .
git checkout <BRANCH>
```

Update next time:

```bash
cd /var/www/dms
git pull
```

### Option B: WinSCP SFTP Synchronize

Remote path di VM:
- `/var/www/dms`

Exclude (recommended):
- `**/node_modules/**`
- `**/dist/**`
- `**/.npm-cache-tmp/**`
- `**/.git/**` (optional)
- `backend/.env` (biar env kekal dalam VM)

### Option C: rsync over SSH

Di PC (contoh):

```bash
rsync -av --delete \
  --exclude node_modules \
  --exclude dist \
  --exclude .npm-cache-tmp \
  --exclude .git \
  --exclude .env \
  --exclude .env.* \
  --exclude backend/.env \
  ./ username@VM_IP:/var/www/dms/
```

---

## PART 2 — Setup server (Nginx + Node.js + PM2 + MySQL/MariaDB)

### 0) Install dependency asas

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git curl
```

Install Node.js (Node 20):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Install PM2:

```bash
sudo npm install -g pm2
pm2 -v
```

Install MySQL atau MariaDB (pilih satu):

```bash
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
```

---

## PART 3 — Database (create, migrate, import)

### 1) Create database + user (MySQL/MariaDB)

```bash
sudo mysql
```

Dalam MySQL shell:

```sql
CREATE DATABASE dms_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dms_user'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON dms_prod.* TO 'dms_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2) Migrasi database dari server lama (optional)

Export di server lama:

```bash
mysqldump -u <OLD_USER> -p <OLD_DB_NAME> > dms_backup.sql
```

Import di server baru:

```bash
mysql -u dms_user -p dms_prod < dms_backup.sql
```

Nota:
- Kalau schema lama tak sama dengan Prisma migration dalam repo, import dulu, kemudian jalankan `prisma migrate deploy` untuk apply migration yang belum ada.

---

## PART 4 — Setup backend (Prisma + env + PM2)

### 1) Install dependencies + set env

```bash
cd /var/www/dms/backend
npm ci
cp .env.example .env
nano .env
```

Minimum env untuk production:

```bash
DATABASE_URL="mysql://dms_user:CHANGE_ME_STRONG_PASSWORD@127.0.0.1:3306/dms_prod"
JWT_SECRET="CHANGE_ME_LONG_RANDOM"
ENCRYPTION_KEY="CHANGE_ME_LONG_RANDOM"
PORT=4000
UPLOAD_DIR="/srv/dms-storage"
NODE_ENV="production"
CORS_ORIGIN="https://<YOUR_DOMAIN>"
```

Create storage folder (asing dari code):

```bash
sudo mkdir -p /srv/dms-storage
sudo chown -R $USER:$USER /srv/dms-storage
```

### 2) Apply Prisma migrations

```bash
cd /var/www/dms/backend
npx prisma generate
npx prisma migrate deploy
```

Optional seed:

```bash
npm run seed
```

### 3) Start backend dengan PM2

Repo ni dah ada ecosystem file:
- `backend/ecosystem.config.cjs`

```bash
cd /var/www/dms/backend
pm2 start ecosystem.config.cjs --update-env
pm2 save
pm2 startup
pm2 list
```

Test backend:

```bash
curl -s http://127.0.0.1:4000/ | head
curl -s http://127.0.0.1:4000/api/system/health | head || true
```

---

## PART 5 — Setup frontend (build dist)

```bash
cd /var/www/dms/frontend
npm ci
npm run build
```

Output: `/var/www/dms/frontend/dist`

---

## PART 6 — Nginx serve dist + proxy /api & /uploads

Repo ni ada template config:
- `deploy/nginx/dms.conf`

Setup:

```bash
sudo rm -f /etc/nginx/sites-enabled/default || true
sudo cp /var/www/dms/deploy/nginx/dms.conf /etc/nginx/sites-available/dms
sudo ln -sf /etc/nginx/sites-available/dms /etc/nginx/sites-enabled/dms
sudo nginx -t
sudo systemctl restart nginx
```

Pastikan path dalam config betul:
- `root /var/www/dms/frontend/dist;`

Test dari VM:

```bash
curl -I http://127.0.0.1/
curl -I http://127.0.0.1/api/
curl -I http://127.0.0.1/uploads/
```

---

## PART 7 — Update code lepas deploy (tanpa kacau DB & uploads)

Flow update (standard):

```bash
cd /var/www/dms
git pull
```

Backend update:

```bash
cd /var/www/dms/backend
npm ci
npx prisma migrate deploy
pm2 reload ecosystem.config.cjs --update-env
```

Frontend update:

```bash
cd /var/www/dms/frontend
npm ci
npm run build
sudo systemctl reload nginx
```

---

## Common issues (cepat diagnose)

### A) API 404 / `Cannot POST /api/...`

- Check Nginx config proxy `/api/` ke `127.0.0.1:4000`
- Check backend hidup:

```bash
pm2 list
pm2 logs dms-backend --lines 200
curl -s http://127.0.0.1:4000/api/system/health | head || true
```

### B) Prisma migrate gagal

```bash
cd /var/www/dms/backend
npx prisma migrate deploy
```

Kalau masih fail, check log:

```bash
pm2 logs dms-backend --lines 300
```

