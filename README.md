# The Felt

A mobile-first poker night tracker for groups. Track buy-ins, cash-outs, session history, and cumulative P&L — no accounts required.

**Live:** [the-felt.vercel.app](https://the-felt.vercel.app)

---

## Features

- **Sessions** — create open sessions, add players with buy-ins and rebuys, close out with final cash amounts
- **Leaderboard** — running P&L across all closed sessions with win rate and per-player stats
- **Cumulative P&L chart** — multi-player line chart showing profit/loss over time
- **Player profiles** — individual session history, best/worst sessions, personal P&L chart
- **Discrepancy detection** — closed sessions flag when the pot doesn't balance
- **Real-time sync** — all changes reflect live across devices via Supabase Realtime
- **Admin mode** — PIN-protected controls for deleting sessions, renaming sessions/players, and reopening closed sessions

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, CSS Modules |
| Routing | React Router 7 |
| Charts | Recharts |
| Backend | Supabase (Postgres + Realtime) |
| Hosting | Vercel |

## Local Setup

**1. Clone and install**

```bash
git clone https://github.com/ericliu-12/the-felt.git
cd the-felt
npm install
```

**2. Create a Supabase project**

Go to [supabase.com](https://supabase.com), create a new project, and run the schema below in the SQL editor.

<details>
<summary>Database schema</summary>

```sql
create table players (
  id uuid primary key default gen_random_uuid(),
  group_id text not null,
  name text not null,
  created_at timestamptz default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  group_id text not null,
  name text not null,
  date date not null default current_date,
  status text not null default 'open',
  created_at timestamptz default now()
);

create table session_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  total_buyin numeric not null default 0,
  cashout numeric,
  created_at timestamptz default now()
);
```

Enable Realtime on all three tables in the Supabase dashboard under **Database → Replication**.

</details>

**3. Configure environment**

```bash
cp .env.example .env
```

Fill in `.env`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GROUP_ID=your-group-name
VITE_ADMIN_PIN=1234
```

`GROUP_ID` is a plain string that scopes all data — every group using the same deployment just needs a different value here.

**4. Run**

```bash
npm run dev
```

## Project Structure

```
src/
  hooks/          # Data fetching and mutations (Supabase)
  components/     # Shared UI components
  pages/          # Route-level components
  lib/            # Supabase client, constants
```

## Admin Mode

Tap **Admin** in the header and enter the PIN set in `VITE_ADMIN_PIN`. Admin mode persists for the browser session and unlocks:

- Delete sessions
- Rename sessions and players
- Reopen closed sessions

## Deployment

Deploy to Vercel with one click — set the four env vars in the Vercel project settings and it works out of the box.
