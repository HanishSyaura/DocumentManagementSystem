# Update & Deploy Playbook (Git → VM) — DocumentManagementSystem (DMS)

Dokumen ni untuk **repeatable workflow** bila update code: **push dari PC (Windows)** → **pull di VM** → **build/restart yang perlu sahaja**.

***

## Struktur folder (WAJIB betul)

### PC (Windows)

- Repo: `C:\Users\USER\Desktop\DocumentManagementSystem`
- Frontend source: `frontend/`
- Backend source: `backend/`

### VM

- Repo root: `/var/www/dms`
- Frontend: `/var/www/dms/frontend`
- Frontend build output: `/var/www/dms/frontend/dist`
- Backend: `/var/www/dms/backend`
- Backend env (simpan di VM sahaja): `/var/www/dms/backend/.env`
- Upload storage (persistent): `/srv/dms-storage`
- Upload URL: `https://dms.clbgroups.com/uploads/<file>`
- PM2 app name: `dms-backend`

Optional (aaPanel/Nginx):

- Vhost file: `/www/server/panel/vhost/nginx/dms.clbgroups.com.conf`
- SSL cert path: `/www/server/nginx/ssl/dms.clbgroups.com/fullchain.pem`
- SSL key path: `/www/server/nginx/ssl/dms.clbgroups.com/privkey.pem`

***

## 0) Prinsip penting sebelum update

- Jangan buat `git pull` kalau `git status` di VM ada perubahan local (akan conflict).
- Jangan commit `.env` / secrets ke Git.
- Upload folder mesti persistent (tak hilang bila update code):
  - `/srv/dms-storage` (uploads)
  - Backups: jika nak backup persistent, buat symlink:
    - `ln -s /var/www/dms/backups /var/www/dms/backend/backups` (sekali sahaja)

***

## 1) PC (Windows) — Commit & Push ke Git

Di folder repo PC:

```bash
cd C:\Users\USER\Desktop\DocumentManagementSystem
git status -sb
git diff
```

Commit hanya file yang you intend:

```bash
git add frontend/src/components/HomePage.jsx
git commit -m "fix(ui): feature icon fill container"
git push origin main
```

Kalau ada file lain tersentuh (contoh `package-lock.json`) dan tak sengaja:

```bash
git restore <path-file>
```

Kalau `git status` tunjuk `ahead N`, semak dulu commit mana nak dipush:

```bash
git log --oneline origin/main..HEAD
```

***

## 2) VM — Pre-check sebelum pull

```bash
cd /var/www/dms
git status -sb
git fetch --all --prune
git log --oneline HEAD..origin/main
git diff --name-only HEAD..origin/main
```

Jika `git status` bukan clean (ada `M` / `??`), pilih salah satu:

- buang perubahan: `git restore <file>` atau `git reset --hard`
- atau stash: `git stash -u` (guna bila betul-betul perlu)

***

## 3) VM — Pull update (fast-forward sahaja)

```bash
cd /var/www/dms
git pull --ff-only
git log --oneline --decorate -n 3
```

***

## 4) VM — Deploy FRONTEND (bila ada perubahan dalam `frontend/`)

Build standard:

```bash
cd /var/www/dms/frontend
npm ci
npm run build
```

### Workaround: Rollup optional dependency bug (build fail)

Jika build keluar error `Cannot find module @rollup/rollup-linux-x64-gnu`, buat:

```bash
cd /var/www/dms/frontend
rm -rf node_modules
npm ci --include=optional
npm i --no-save @rollup/rollup-linux-x64-gnu
npm run build
```

Pastikan repo di VM kekal clean (tak sengaja modify lockfile):

```bash
cd /var/www/dms
git status -sb
```

***

## 5) VM — Deploy BACKEND (bila ada perubahan dalam `backend/`)

```bash
cd /var/www/dms/backend
npm ci
npx prisma migrate deploy
pm2 restart dms-backend --update-env
```

Semak backend hidup:

```bash
curl -s https://dms.clbgroups.com/api/system/health -k | head -c 300; echo
pm2 list | sed -n '1,25p'
pm2 logs dms-backend --lines 50
```

Nota:

- Kalau edit `.env`, restart guna `--update-env` (kalau tidak, PM2 mungkin tak reload env baru).
- Upload dir yang digunakan backend ikut `.env`:
  - `UPLOAD_DIR=/srv/dms-storage`

***

## 6) Quick verification (lepas deploy)

```bash
curl -sI https://dms.clbgroups.com -k | tr -d '\r' | sed -n '1,12p'
curl -s https://dms.clbgroups.com/api/ -k | head -c 250; echo
```

Test upload static serving (optional):

```bash
echo ok | sudo tee /srv/dms-storage/health-test.txt >/dev/null
curl -s https://dms.clbgroups.com/uploads/health-test.txt -k
```

***

## 7) Rollback cepat (kalau update rosak)

Cari commit sebelum update:

```bash
cd /var/www/dms
git log --oneline -n 10
```

Rollback:

```bash
cd /var/www/dms
git reset --hard <OLD_SHA>
```

Lepas rollback, buat semula step yang relevant:

- Frontend: `npm ci && npm run build`
- Backend: `npm ci && npx prisma migrate deploy && pm2 restart dms-backend --update-env`

***

## 8) Troubleshooting ringkas

- **`fatal: not a git repository`**
  - You run command dalam folder salah. Pastikan: `cd /var/www/dms` (VM) atau `cd C:\Users\USER\Desktop\DocumentManagementSystem` (PC).
- **`git pull`** **tak boleh sebab ada local changes**
  - `git status -sb` → `git restore <file>` atau `git stash -u`.
- **Frontend build fail** **`@rollup/rollup-linux-x64-gnu`**
  - Guna workaround dalam Part 4.
- **502 / API down**
  - `pm2 list`, `pm2 logs dms-backend --lines 100`.
- **Migration fail**
  - Run `npx prisma migrate deploy` dan baca error, jangan paksa restart tanpa settle migration.

