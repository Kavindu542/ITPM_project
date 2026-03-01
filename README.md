# ITPM_PROJECT (MERN + Vite)

## Setup

### 1) Server

- Create `server/.env` and set:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `CLIENT_ORIGIN` (default `http://localhost:5173`)
  - `GEMINI_API_KEY` (required for AI search + scan/autofill)
  - `GEMINI_MODEL` (optional; prefer a Flash model to reduce free-tier quota hits, e.g. `gemini-2.0-flash` or `gemini-1.5-flash`)

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
