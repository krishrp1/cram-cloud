# NoteShare (Cram Cloud)

A full-stack student notes sharing and discussion platform. A Node/Express
JSON API backend and a Flask server-rendered frontend that proxies all API
calls through a server-side session (the browser never sees the JWT).

## Features

- Email/password authentication (JWT, issued by the backend, never exposed to the browser)
- Role-based access control (student / admin)
- Semester-scoped PDF notes repository, with per-note comments
- Community discussion forum (threads + replies)
- Admin dashboard (upload/delete notes, manage users)

## Tech Stack

- **Backend**: Node.js, TypeScript, Express, Prisma, PyJWT-equivalent (`jsonwebtoken`), Supabase (Postgres)
- **Frontend**: Flask, Jinja2 templates, vanilla JS, `requests` (server-side proxy to the backend)

There is no frontend build step — the frontend is server-rendered HTML/CSS/JS
served directly by Flask. The backend is plain Node/Express (no Next.js/React).

## Local setup

### 1. Backend (API, port 8000)

```bash
cd backend
npm install
cp .env.example .env   # then fill in DATABASE_URL, DIRECT_URL and JWT_SECRET
npx prisma migrate dev --name init   # creates the tables in Supabase
npm run dev
```

Requires a Supabase project. `DATABASE_URL` is the transaction-mode pooler
(port 6543, `pgbouncer=true`) used at runtime; `DIRECT_URL` is the
session-mode pooler (port 5432) used only by `prisma migrate`. Both come
from the Supabase project's Connect dialog. For production, build once
(`npm run build`) and run `npm start`, and use `npx prisma migrate deploy`
instead of `migrate dev`.

### 2. Frontend (port 3000)

```bash
cd frontend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in SECRET_KEY and BACKEND_URL
python app.py
```

Then open http://localhost:3000.

## Environment variables

See `backend/.env.example` and `frontend/.env.example`. Neither `.env` file
should ever be committed — both are gitignored. `JWT_SECRET` and `SECRET_KEY`
must be long random values in any deployed environment; the app refuses to
start without them.

## Production

- Backend: `npm run build && npm start` (compiled Node, no dev-server reload).
  Frontend: run behind a production WSGI server (`gunicorn`, included in
  `frontend/requirements.txt`), not the Flask dev server.
- Set `NODE_ENV=production` (backend) and `FLASK_ENV=production` (frontend).
- Set `CORS_ORIGINS` (backend) to the frontend's real origin.
- Serve both services over HTTPS — `SESSION_COOKIE_SECURE` is enabled
  automatically when `FLASK_ENV=production`.
- The admin role cannot be self-assigned via `/register`; promote a user to
  admin directly in the database.
