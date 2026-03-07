# ITPM_PROJECT (MERN + Vite)

## Setup

### 1) Server

- Create `server/.env` and set:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `CLIENT_ORIGIN` (default `http://localhost:5173`)
  - `BLOB_READ_WRITE_TOKEN` (required for file uploads)
  - `STUDY_MATERIAL_UPLOAD_MAX_MB` (optional, default `4`)
  - `LIBRARY_UPLOAD_MAX_MB` (optional, default `4`)

Commands:

- `cd server`
- `npm install`
- `npm run dev`

### 2) Client

Commands:

- `cd client`
- `npm install`
- `npm run dev`

Then open: `http://localhost:5173`

## Vercel Deployment Notes

- Deploy `client` and `server` as separate Vercel projects.
- Frontend (`client`) env:
  - `VITE_API_URL=https://<your-backend>.vercel.app`
- Backend (`server`) env:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `CLIENT_ORIGIN=https://<your-frontend>.vercel.app`
  - `BLOB_READ_WRITE_TOKEN`
  - `NODE_ENV=production`

### Upload Behavior on Vercel

- File uploads are stored in Vercel Blob storage (no local disk writes).
- Serverless upload defaults are intentionally small (`4MB` per file).
- Increase limits with caution using env vars above if your deployment tier allows it.
