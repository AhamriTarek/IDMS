# IDMS Backend Deployment Guide

This backend is configured to deploy on **Render** with a **Supabase**
PostgreSQL database. Static files are served by **WhiteNoise** and the
WSGI server is **Gunicorn**.

## Prerequisites
- Supabase account with a PostgreSQL project created
- Render account connected to the GitHub repository
- Production values for all sensitive env vars (see `.env.example`)

## 1. Supabase setup
1. Go to <https://supabase.com> → **New Project** (free tier is fine).
2. Choose a region close to Render (e.g. `eu-west`) and save the database
   password somewhere secure — Supabase will not show it again.
3. In the project: **Settings → Database → Connection string → URI**.
4. Copy the URI; it looks like:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   ```
5. (Optional) Tighten access: **Settings → Database → Network Restrictions**
   and allow Render's outbound IPs once known.

## 2. Render setup
1. **Dashboard → New → Web Service** and connect the GitHub repo.
2. Configure the service:
   - **Root Directory:** `backend`
   - **Runtime:** Python
   - **Build Command:** `./build.sh`
   - **Start Command:** `gunicorn idms.wsgi:application`
3. Add the following **Environment Variables**:

   | Key | Value |
   |---|---|
   | `PYTHON_VERSION` | `3.11.6` |
   | `DEBUG` | `False` |
   | `SECRET_KEY` | generate a fresh long random string |
   | `DATABASE_URL` | the Supabase URI from step 1 |
   | `ALLOWED_HOSTS` | `your-app.onrender.com` (Render also injects `RENDER_EXTERNAL_HOSTNAME` automatically) |
   | `CORS_ALLOWED_ORIGINS` | comma-separated production frontend URL(s) |
   | `GEMINI_API_KEY` | your key |
   | `GOOGLE_CLIENT_ID` | your client id |
   | `GOOGLE_CLIENT_SECRET` | your client secret |
   | `ADMIN_EMAILS` | comma-separated admin emails |

   Alternatively, commit-deploy with `backend/render.yaml` (Infrastructure-as-Code)
   and fill the `sync: false` values in the dashboard.

## 3. First deploy
On every push to the configured branch, Render runs `build.sh` which:
1. Installs `requirements.txt`
2. Runs `collectstatic --no-input` (WhiteNoise picks them up)
3. Runs `migrate` against the Supabase database

Then it boots `gunicorn idms.wsgi:application` on the port Render assigns.

## 4. Post-deploy checks
- `GET https://your-app.onrender.com/admin/` → Django admin login screen
- Run `python manage.py createsuperuser` in the Render shell to create
  the first admin account on the Supabase DB.
- Verify HTTPS is forced (the `if not DEBUG:` block in `settings.py`
  enables `SECURE_SSL_REDIRECT` and HSTS).

## 5. Local development parity
Set the same `DATABASE_URL` in `backend/.env` to point at Supabase, or use
a local PostgreSQL with the `DB_*` env vars. The legacy MySQL config has
been removed — install PostgreSQL locally (or use Supabase) for dev.
