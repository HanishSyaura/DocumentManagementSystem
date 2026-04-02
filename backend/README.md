# DMS Backend (scaffold)

This folder contains a minimal Express + Prisma backend scaffold for the Document Management System.

Quick start (after installing Node dependencies):

```powershell
cd backend
npm install
npx prisma generate
# set your DATABASE_URL in .env
npm run dev
```

Endpoints are minimal placeholders in `src/routes/`.
