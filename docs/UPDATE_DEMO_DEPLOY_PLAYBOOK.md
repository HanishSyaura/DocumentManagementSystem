# Update Demo Version Sahaja (aaPanel Ubuntu)

Dokumen ini khas untuk **update demo version** yang sudah siap deploy.

Ia tidak cover setup awal server. Ia fokus pada flow ini sahaja:

- semak server demo
- pull code terbaru
- update backend demo jika perlu
- update frontend demo jika perlu
- verify demo domain

Contoh naming dalam dokumen ini:

- Domain: `demo.example.com`
- App root: `/www/wwwroot/dms.demo.clbgroups.com`
- Backend path: `/www/wwwroot/dms.demo.clbgroups.com/backend`
- Frontend path: `/www/wwwroot/dms.demo.clbgroups.com/frontend`
- PM2 app: `dms-demo-backend`
- Upload dir: `/srv/dms-demo-storage`

## Prinsip penting

- Jangan update dalam folder production.
- Jangan sentuh database production.
- Jangan ubah `UPLOAD_DIR` demo ke path production.
- Kalau ada perubahan local dalam repo server demo, jangan terus `git pull`.

## 1) Pre-check dalam server demo

```bash
cd /www/wwwroot/dms.demo.clbgroups.com
git status -sb
git fetch --all --prune
git log --oneline HEAD..origin/main
git diff --name-only HEAD..origin/main
pm2 list
```

Kalau `git status` tak clean:

- simpan perubahan yang memang perlu
- atau `git restore <file>`
- elakkan `git pull` selagi working tree tak clean

## 2) Pull update terbaru

```bash
cd /www/wwwroot/dms.demo.clbgroups.com
git pull --ff-only
git log --oneline --decorate -n 3
```

## 3) Update backend demo bila ada perubahan `backend/`

```bash
cd /www/wwwroot/dms.demo.clbgroups.com/backend
npm ci
npx prisma migrate deploy
pm2 restart dms-demo-backend --update-env
```

Semak status:

```bash
curl -s http://127.0.0.1:4100/api/system/health | head || true
pm2 logs dms-demo-backend --lines 50
```

Nota:

- Kalau anda ubah `.env`, pastikan restart guna `--update-env`
- `UPLOAD_DIR` mesti kekal ke demo path:

```bash
/srv/dms-demo-storage
```

## 4) Update frontend demo bila ada perubahan `frontend/`

```bash
cd /www/wwwroot/dms.demo.clbgroups.com/frontend
npm ci
npm run build
sudo systemctl reload nginx
```

## 5) Quick verification lepas update

```bash
curl -I https://demo.example.com
curl -s https://demo.example.com/api/system/health | head || true
```

Jika nak test static upload serving:

```bash
echo ok | sudo tee /srv/dms-demo-storage/health-test.txt >/dev/null
curl -s https://demo.example.com/uploads/health-test.txt
```

## 6) Workaround kalau frontend build fail sebab Rollup optional dependency

Kalau keluar error macam:

```text
Cannot find module @rollup/rollup-linux-x64-gnu
```

Buat ini:

```bash
cd /www/wwwroot/dms.demo.clbgroups.com/frontend
rm -rf node_modules
npm ci --include=optional
npm i --no-save @rollup/rollup-linux-x64-gnu
npm run build
```

## 7) Rollback cepat untuk demo

Semak commit:

```bash
cd /www/wwwroot/dms.demo.clbgroups.com
git log --oneline -n 10
```

Rollback:

```bash
cd /www/wwwroot/dms.demo.clbgroups.com
git reset --hard <OLD_SHA>
```

Lepas rollback:

```bash
cd /www/wwwroot/dms.demo.clbgroups.com/backend
npm ci
npx prisma migrate deploy
pm2 restart dms-demo-backend --update-env

cd /www/wwwroot/dms.demo.clbgroups.com/frontend
npm ci
npm run build
sudo systemctl reload nginx
```

## 8) Checklist pendek setiap kali update demo

```text
[ ] Dalam folder /www/wwwroot/dms.demo.clbgroups.com
[ ] git status clean
[ ] git pull --ff-only berjaya
[ ] backend npm ci berjaya
[ ] prisma migrate deploy berjaya
[ ] pm2 restart dms-demo-backend berjaya
[ ] frontend npm run build berjaya
[ ] https://demo.example.com boleh buka
[ ] /api/system/health respon
```
