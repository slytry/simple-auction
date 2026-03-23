
# Simple Auction MVP (Supabase + Next.js)

Minimal auction app where one admin creates lots and buyers place bids without registration.

[![Netlify Status](https://api.netlify.com/api/v1/badges/3a74153d-0c59-4d4b-aed1-fe95316bb62d/deploy-status)](https://app.netlify.com/projects/simple-auction/deploys)railway init

## Features

- Admin panel with password protection (`/admin`)
- Create lot with unique slug and shareable URL (`/lot/<slug>`)
- Admin lots page with delivery price editing (`/admin/lots`)
- Public lot page with realtime bid updates
- Bid validation (`current_price + min_step`)
- Anti-sniping: extends end time by +2 minutes if bid arrives in final 2 minutes
- Auction end state with winner
- Basic client-side rate limit (3 seconds between bids per browser)

## Tech

- Next.js (App Router, React)
- Supabase (Postgres + Realtime)
- Minimal CSS

## 1) Supabase Setup

1. Create a new Supabase project.
2. Open SQL Editor and run `supabase/setup.sql`.
3. In project settings, copy:
   - `Project URL`
   - `anon public key`
   - `service_role key`

## 2) Local Run

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Fill env values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
ADMIN_PASSWORD=your_admin_password
NEXT_TELEMETRY_DISABLED=1
```

4. Start app:

```bash
npm run dev
```

Open:
- `http://localhost:3000/admin` for admin
- `http://localhost:3000/lot/<slug>` for buyers

## 3) Deploy to Vercel

1. Push code to GitHub.
2. Import repo in Vercel.
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
4. Deploy.

Use `/admin` on your Vercel domain to create auction lots.

## 4) Deploy to Netlify

For Next.js 13.5+ use zero-config deploy (OpenNext runtime by Netlify).

1. Push code to GitHub.
2. Import repository in Netlify.
3. In **Build & deploy** settings, remove UI overrides for:
   - Build command
   - Publish directory
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
   - `NEXT_TELEMETRY_DISABLED=1`
5. Trigger **Clear cache and deploy site**.

Smoke-check after deploy:
- `/` opens normally
- `/admin` loads login form
- `/admin/lots` is protected without cookie
- `POST /api/admin/login` returns 200 with correct password
- `/lot/<slug>` loads and receives realtime bids

## Notes

- `service_role` key is only used in server routes.
- No buyer auth (MVP by design).
- Realtime requires `lots` and `bids` in `supabase_realtime` publication (included in SQL).
