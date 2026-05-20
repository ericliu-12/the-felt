# The Felt — Design Spec

**Date:** 2026-05-20  
**Status:** Approved

---

## Overview

A mobile-first poker night tracker called "The Felt." A React + Vite SPA backed by Supabase Postgres with real-time subscriptions. No auth — a hardcoded `GROUP_ID` UUID scopes all data, acting as a shared secret key for a friend group. Deployed to Vercel as a static site.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite |
| Routing | React Router |
| Charts | Recharts |
| Backend | Supabase (Postgres + real-time) |
| Deployment | Vercel (static site, env vars in dashboard) |
| Auth | None — GROUP_ID as shared namespace |

---

## Database Schema

```sql
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
  status text default 'open', -- 'open' | 'closed'
  created_at timestamptz default now()
);

-- Entries (buy-ins and cash-outs per player per session)
create table session_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  total_buyin numeric not null default 0,
  cashout numeric,  -- null until session is closed
  created_at timestamptz default now()
);
```

RLS disabled on all tables. `group_id` on players and sessions is the only access control.

---

## Architecture

### Data Flow

1. App boots → each page mounts its hook(s) → hooks fetch from Supabase scoped by `GROUP_ID`
2. Hook sets up a Supabase real-time channel subscription on mount, tears it down on unmount
3. Real-time events push directly into React state via `useState` + `useEffect`
4. Mutations are plain async Supabase calls; real-time subscription handles the state refresh
5. Settlement computed client-side from `session_entries` data on the session detail page

### File Structure

```
src/
  lib/
    supabase.js       — Supabase client init (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
    constants.js      — GROUP_ID and other config constants
    settlement.js     — debt minimization algorithm
  hooks/
    usePlayers.js     — all players for GROUP_ID, real-time
    useSessions.js    — all sessions for GROUP_ID, real-time
    useSession.js     — single session + entries joined with player names, real-time
    usePlayerStats.js — derived all-time stats for one player
  pages/
    Dashboard.jsx     — leaderboard, charts, recent session, New Session CTA
    Sessions.jsx      — sessions list
    SessionDetail.jsx — session detail (open or closed)
    NewSession.jsx    — 4-step wizard
    PlayerPage.jsx    — player stats + history
  components/
    (reusable UI: buttons, cards, inputs, charts, settlement display, etc.)
```

---

## Custom Hooks

Each hook returns `{ data, loading, error }`.

| Hook | Table(s) | Real-time |
|---|---|---|
| `usePlayers()` | `players` | Yes — full table subscription |
| `useSessions()` | `sessions` | Yes — full table subscription |
| `useSession(id)` | `sessions` + `session_entries` | Yes — filtered by `session_id` |
| `usePlayerStats(playerId)` | `session_entries` (all sessions) | No — computed on navigation |

---

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Leaderboard, cumulative profit chart, most recent session card, New Session CTA |
| `/sessions` | Sessions | All sessions with date, player count, total pot |
| `/sessions/new` | NewSession | 4-step wizard (step in local state, not URL) |
| `/sessions/:id` | SessionDetail | Buy-ins, cash-outs (editable while open), settlement (closed only) |
| `/players/:id` | PlayerPage | Stats, profit/loss chart, session history table |

### New Session Wizard Steps

1. Name + date form → creates session row in Supabase on submit
2. Add players + buy-in amounts (edit total_buyin in place; players can re-buy by updating the number)
3. Enter cash-out for each player
4. View settlement — displayed as "Alex pays Jamie $40"; button to mark session as closed

The session row exists in Supabase from step 1 onward, so the wizard is a guided entry into the session detail flow. Refreshing after step 1 lands on `/sessions/:id` which fully supports all editing.

---

## Settlement Algorithm

Implemented in `src/lib/settlement.js`.

**Input:** array of `{ playerId, name, cashout, total_buyin }`  
**Output:** array of `{ from: name, to: name, amount: number }`

**Algorithm:**
1. Compute `net = cashout - total_buyin` for each player
2. Skip players where `net === 0`
3. Sort creditors (`net > 0`) and debtors (`net < 0`) by absolute value descending
4. Two-pointer greedy loop:
   - Transfer `min(|debt|, credit)` from largest debtor to largest creditor
   - Reduce both balances; advance pointer when one hits zero
   - Repeat until all balances are zero
5. Work in cents internally (multiply by 100, round) to avoid floating-point drift

**Constraint:** Settlement only shown for closed sessions. Close button only enabled when all players have a cashout value.

---

## Charts (Recharts)

| Chart | Location | Description |
|---|---|---|
| Cumulative P&L line chart | Dashboard | Multi-line, one line per player, toggleable. X-axis = sessions chronologically. Players hold last value flat between sessions they didn't attend. |
| Session bar chart | SessionDetail (+ compact preview on Dashboard for most recent session) | Per-player profit/loss for that session |
| Individual P&L curve | PlayerPage | Single player's cumulative profit over time |

---

## Design Direction

**Aesthetic:** luxury casino meets underground card room — dark, moody, sharp.

- Background: near-black (`#0a0a0a` or similar)
- Primary accent: gold/amber for highlights, profits, CTAs
- Red for losses, green for wins
- Subtle felt-texture or noise overlay on background
- Display font: Playfair Display (Google Fonts) for headings
- Number font: tabular monospace for all financial figures (column alignment)
- Mobile-first: all core flows work at 390px; touch targets ≥ 44px
- Smooth view transitions

---

## Error Handling & Edge Cases

- Loading skeletons on all data-fetching hooks while `loading === true`
- Non-blocking error banner if Supabase is unreachable (no offline queue)
- Closing a session requires all players to have cashout values; button is disabled otherwise
- Players cannot be deleted from the roster (prevents orphaned session history)
- Floating-point: all monetary arithmetic done in cents, displayed as 2-decimal currency
- Profit/loss line chart: continuous line, holds last value flat for sessions a player didn't attend

---

## Deployment

- Hosted on Vercel as a static site
- Environment variables set in Vercel dashboard:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_GROUP_ID`
- Build command: `npm run build`
- Output directory: `dist`

---

## Output Artifacts

- Full working React app per the file structure above
- `SETUP.md` at project root covering:
  1. Creating the Supabase project and running schema SQL
  2. Filling in the `.env` file
  3. Running locally (`npm install`, `npm run dev`)
  4. Deploying to Vercel with env vars
- Public GitHub repo with incremental commits per feature
