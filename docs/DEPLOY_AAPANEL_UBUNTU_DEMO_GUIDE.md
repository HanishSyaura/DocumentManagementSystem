# Deploy Demo DMS di aaPanel Ubuntu (Domain Baru + Database Baru)

Dokumen ini khas untuk deploy **demo version** DMS pada:

- domain berasingan
- database berasingan
- folder app berasingan
- storage upload berasingan
- PM2 app berasingan

Contoh naming yang disyorkan dalam dokumen ini:

- Domain demo: `demo.example.com`
- Project root: `/www/wwwroot/dms-demo`
- Backend port: `4100`
- Database: `dms_demo`
- Database user: `dms_demo_user`
- Upload storage: `/srv/dms-demo-storage`
- PM2 app name: `dms-demo-backend`

Jangan reuse path production lama seperti:

- `/var/www/dms`
- `dms_prod`
- `/srv/dms-storage`
- `dms-backend`

## Prinsip penting

- Demo mesti hidup sendiri tanpa kacau production.
- Guna domain, DB, folder, port, dan storage yang berbeza.
- Jangan copy fail `.env` production bulat-bulat tanpa tukar value.
- Kalau nak data sama macam production, buat salinan database ke database demo, bukan kongsi database yang sama.

## Architecture cadangan

- aaPanel urus vhost domain
- Nginx serve `frontend/dist`
- Nginx proxy `/api` dan `/uploads` ke backend Node.js
- Backend jalan via PM2 pada port `4100`
- MySQL/MariaDB guna database demo sendiri
- Upload files simpan dalam folder persistent sendiri

## Step 1 — Sediakan maklumat wajib dulu

Sebelum sentuh server, confirm 7 item ini:

1. Domain demo
   - Contoh: `demo.example.com`
2. Server IP
   - Pastikan domain boleh point ke server Ubuntu aaPanel
3. Repo branch
   - Contoh: `main` atau branch khas demo
4. Nama project root
   - Disyorkan: `/www/wwwroot/dms-demo`
5. Database demo
   - Disyorkan: `dms_demo`
6. Backend port demo
   - Disyorkan: `4100`
7. Storage upload demo
   - Disyorkan: `/srv/dms-demo-storage`

Checklist keputusan yang disyorkan:

```text
DOMAIN=demo.example.com
APP_ROOT=/www/wwwroot/dms-demo
BRANCH=main
DB_NAME=dms_demo
DB_USER=dms_demo_user
BACKEND_PORT=4100
UPLOAD_DIR=/srv/dms-demo-storage
PM2_APP=dms-demo-backend
```

## Step 2 — Create site dalam aaPanel

Dalam aaPanel:

1. Pergi ke `Website`
2. Klik `Add Site`
3. Isi domain demo, contoh `demo.example.com`
4. Root directory set ke:

```bash
/www/wwwroot/dms-demo/frontend/dist
```

5. Database masa create site:
   - boleh skip dulu jika nak create manual
   - atau create database baru terus dalam aaPanel
6. PHP version:
   - tak perlu untuk app ini
7. Siap create site

Nota:

- Kalau aaPanel auto create root ke `/www/wwwroot/demo.example.com`, boleh juga guna itu, tapi untuk konsisten dengan repo ini lebih mudah kalau app root memang `/www/wwwroot/dms-demo`.

## Step 3 — Point domain ke server

Di DNS provider:

- tambah `A record`
- host: subdomain demo anda
- value: IP server Ubuntu aaPanel

Lepas update DNS, test:

```bash
ping demo.example.com
```

Atau:

```bash
nslookup demo.example.com
```

## Step 4 — SSH masuk server dan install dependency asas

```bash
sudo apt update
sudo apt install -y git curl nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
node -v
npm -v
pm2 -v
```

Kalau MySQL/MariaDB belum ada:

```bash
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
```

## Step 5 — Clone code ke folder demo

```bash
sudo mkdir -p /www/wwwroot/dms-demo
sudo chown -R $USER:$USER /www/wwwroot/dms-demo
cd /www/wwwroot/dms-demo
git clone <REPO_GIT_URL> .
git checkout <BRANCH>
```

Contoh update branch:

```bash
cd /www/wwwroot/dms-demo
git fetch --all --prune
git checkout main
git pull --ff-only
```

## Step 6 — Create database demo

Masuk MySQL:

```bash
sudo mysql
```

Run:

```sql
CREATE DATABASE dms_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dms_demo_user'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON dms_demo.* TO 'dms_demo_user'@'localhost';
FLUSH PRIVILEGES;
```

Kalau anda nak copy data production ke demo, export dan import ke database demo sahaja.

## Step 7 — Setup backend env demo

```bash
cd /www/wwwroot/dms-demo/backend
npm ci
cp .env.example .env
nano .env
```

Isi `.env` demo:

```bash
DATABASE_URL="mysql://dms_demo_user:CHANGE_ME_STRONG_PASSWORD@127.0.0.1:3306/dms_demo"
JWT_SECRET="CHANGE_ME_LONG_RANDOM_FOR_DEMO"
ENCRYPTION_KEY="CHANGE_ME_LONG_RANDOM_FOR_DEMO"
PORT=4100
UPLOAD_DIR="/srv/dms-demo-storage"
NODE_ENV="production"
CORS_ORIGIN="https://demo.example.com"
```

Create storage demo:

```bash
sudo mkdir -p /srv/dms-demo-storage
sudo chown -R $USER:$USER /srv/dms-demo-storage
```

## Step 8 — Apply Prisma migration

```bash
cd /www/wwwroot/dms-demo/backend
npx prisma generate
npx prisma migrate deploy
```

Kalau perlu seed:

```bash
npm run seed
```

## Step 9 — Start backend demo dengan PM2

```bash
cd /www/wwwroot/dms-demo/backend
pm2 start src/index.js --name dms-demo-backend --cwd /www/wwwroot/dms-demo/backend
pm2 restart dms-demo-backend --update-env
pm2 save
pm2 startup
pm2 list
```

Test terus di server:

```bash
curl -s http://127.0.0.1:4100/ | head
curl -s http://127.0.0.1:4100/api/system/health | head || true
```

## Step 10 — Build frontend demo

```bash
cd /www/wwwroot/dms-demo/frontend
npm ci
npm run build
```

Output sepatutnya:

```bash
/www/wwwroot/dms-demo/frontend/dist
```

## Step 11 — Setup Nginx vhost aaPanel untuk demo

Dalam aaPanel, buka config domain demo dan pastikan behavior ini wujud:

```nginx
server {
    listen 80;
    server_name demo.example.com;

    root /www/wwwroot/dms-demo/frontend/dist;
    index index.html;

    client_max_body_size 60m;

    location /api/ {
        proxy_pass http://127.0.0.1:4100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:4100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Lepas edit:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 12 — Enable SSL untuk domain demo

Dalam aaPanel:

1. Buka site demo
2. Pergi `SSL`
3. Apply Let's Encrypt
4. Enable `Force HTTPS`

## Step 13 — Verification lepas deploy

Test:

```bash
curl -I http://127.0.0.1
curl -s http://127.0.0.1:4100/api/system/health | head || true
curl -I https://demo.example.com
curl -s https://demo.example.com/api/system/health | head || true
```

Test upload serving:

```bash
echo ok | sudo tee /srv/dms-demo-storage/health-test.txt >/dev/null
curl -s https://demo.example.com/uploads/health-test.txt
```

## Step 14 — Jika mahu data demo sama macam production

Pilihan paling selamat:

1. export database production
2. import ke `dms_demo`
3. sanitize data sensitif kalau perlu
4. point demo ke `dms_demo` sahaja

Jangan set demo guna database production live.

## Troubleshooting ringkas

- `502 Bad Gateway`
  - semak `pm2 list`
  - semak `pm2 logs dms-demo-backend --lines 100`
  - semak port backend dalam `.env` dan Nginx sama
- `Frontend keluar blank page`
  - build semula frontend
  - semak root Nginx ke `frontend/dist`
- `API tak kena`
  - pastikan proxy `/api/` ke `127.0.0.1:4100`
- `Upload tak keluar`
  - pastikan `UPLOAD_DIR=/srv/dms-demo-storage`
  - semak `/uploads/` proxied ke backend demo

## Naming map production vs demo

```text
Production:
DOMAIN=your-production-domain
APP_ROOT=/var/www/dms
DB_NAME=dms_prod
PORT=4000
UPLOAD_DIR=/srv/dms-storage
PM2_APP=dms-backend

Demo:
DOMAIN=demo.example.com
APP_ROOT=/www/wwwroot/dms-demo
DB_NAME=dms_demo
PORT=4100
UPLOAD_DIR=/srv/dms-demo-storage
PM2_APP=dms-demo-backend
```
