# The Felt — Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to provision (~1 minute)
3. In the SQL Editor, run the following schema:

````sql
-- Players
create table players (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  name text not null,
  created_at timestamptz default now()
);

-- Sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  name text not null,
  date date not null,
  status text default 'open',
  created_at timestamptz default now()
);

-- Entries
create table session_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  total_buyin numeric not null default 0,
  cashout numeric,
  created_at timestamptz default now()
);

-- Disable RLS (no auth needed)
alter table players disable row level security;
alter table sessions disable row level security;
alter table session_entries disable row level security;
````

4. Enable Realtime for all three tables:
   - Go to **Database → Replication**
   - Under "Supabase Realtime", enable `players`, `sessions`, and `session_entries`

## 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your values from **Project Settings → API** in Supabase:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GROUP_ID=<generate a UUID — run: node -e "console.log(crypto.randomUUID())">
```

Share the same `VITE_GROUP_ID` with everyone in your group — it's the shared key that connects all devices to the same data.

## 3. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## 4. Deploy to Vercel

1. Push the repo to GitHub (already done if you followed the plan)
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo
3. In the project settings, add these **Environment Variables**:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
   - `VITE_GROUP_ID` → the same UUID you used locally
4. Click **Deploy**

The `vercel.json` in the repo handles SPA routing automatically.

## Sharing with Friends

Share the Vercel URL. Anyone who opens it sees the same data in real time — no login needed. The `VITE_GROUP_ID` in the deployed env vars is the shared secret.
