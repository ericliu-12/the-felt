# Remove Player, Duplicate Prevention & Bar Chart Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a × remove button to player rows on open sessions, prevent duplicate player entries at the database level, and fix the session results bar chart so it displays cleanly with 11+ players.

**Architecture:** Three independent tasks. Task 1 is a manual Supabase SQL migration with no code changes. Task 2 adds a remove button to `SessionDetail` by wiring the already-implemented `deleteEntry` hook function to a new UI element. Task 3 swaps `SessionBarChart` from a vertical to a horizontal Recharts layout with dynamic height.

**Tech Stack:** React 19, CSS Modules, Recharts, Supabase

---

## File Map

| File | Change | Purpose |
|------|--------|---------|
| Supabase SQL editor | Manual migration | Add unique constraint on `session_entries(session_id, player_id)` |
| `src/pages/SessionDetail.jsx` | Modify | Wire `deleteEntry`, add `handleRemoveEntry`, add × button column |
| `src/pages/SessionDetail.module.css` | Modify | Add `.removeBtn` style, update grid to 5 columns |
| `src/components/SessionBarChart.jsx` | Modify | Switch to horizontal layout, dynamic height |

---

## Task 1: Supabase unique constraint

**Files:**
- Manual: Supabase dashboard SQL editor

No code changes — this is a database migration run directly in Supabase.

- [ ] **Step 1: Run the migration in Supabase**

Open the Supabase dashboard → SQL editor, and run:

```sql
ALTER TABLE session_entries
  ADD CONSTRAINT session_entries_session_player_unique
  UNIQUE (session_id, player_id);
```

Expected: the statement completes with no error. If it errors with "duplicate key" it means there are already duplicate rows that need to be removed first (delete the extras manually, then re-run).

- [ ] **Step 2: Verify the constraint exists**

In the Supabase dashboard → Table Editor → `session_entries` → Indexes, confirm `session_entries_session_player_unique` appears.

- [ ] **Step 3: Commit a record of the migration**

Create `supabase/migrations/20260604_unique_session_player.sql` (create the `supabase/migrations/` directory if it doesn't exist):

```sql
-- Prevent duplicate player entries in the same session
ALTER TABLE session_entries
  ADD CONSTRAINT session_entries_session_player_unique
  UNIQUE (session_id, player_id);
```

```bash
git add supabase/migrations/20260604_unique_session_player.sql
git commit -m "chore: add unique constraint on session_entries(session_id, player_id)"
```

---

## Task 2: Remove player button

**Files:**
- Modify: `src/pages/SessionDetail.jsx`
- Modify: `src/pages/SessionDetail.module.css`

Context: `deleteEntry(entryId)` is already implemented in `useSession.js` and already returned from the hook — it just isn't used anywhere. The table currently has a 4-column grid (`1fr 90px 90px 80px`). We add a 5th column (`32px`) for the × button, visible only when the session is open.

- [ ] **Step 1: Add `.removeBtn` to `SessionDetail.module.css`**

Append to the end of `src/pages/SessionDetail.module.css`:

```css
.removeBtn {
  background: none;
  border: none;
  color: var(--red);
  opacity: 0.4;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.25rem;
  transition: opacity var(--transition);
}

.removeBtn:hover { opacity: 1; }
```

- [ ] **Step 2: Update the grid columns in `SessionDetail.module.css`**

Change `.tableHead` from:

```css
.tableHead {
  display: grid;
  grid-template-columns: 1fr 90px 90px 80px;
  padding: 0.5rem 1rem;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
}
```

To:

```css
.tableHead {
  display: grid;
  grid-template-columns: 1fr 90px 90px 80px 32px;
  padding: 0.5rem 1rem;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
}
```

Change `.entryRow` from:

```css
.entryRow {
  display: grid;
  grid-template-columns: 1fr 90px 90px 80px;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: background var(--transition);
}
```

To:

```css
.entryRow {
  display: grid;
  grid-template-columns: 1fr 90px 90px 80px 32px;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: background var(--transition);
}
```

- [ ] **Step 3: Destructure `deleteEntry` and add `handleRemoveEntry` in `SessionDetail.jsx`**

Change line 19 from:

```jsx
  const { session, entries, loading, error, addEntry, updateEntry, closeSession, renameSession, reopenSession } = useSession(id)
```

To:

```jsx
  const { session, entries, loading, error, addEntry, updateEntry, closeSession, renameSession, reopenSession, deleteEntry } = useSession(id)
```

Then add `handleRemoveEntry` directly after the `handleReopen` function (around line 91):

```jsx
  async function handleRemoveEntry(entryId) {
    setMutErr(null)
    try { await deleteEntry(entryId) } catch (e) { setMutErr(e.message) }
  }
```

- [ ] **Step 4: Add the 5th column to the table header**

In the JSX, find the `.tableHead` div:

```jsx
        <div className={styles.tableHead}>
          <span className={styles.th}>Player</span>
          <span className={styles.th}>Buy-in</span>
          <span className={styles.th}>Cash-out</span>
          <span className={styles.th}>Net</span>
        </div>
```

Replace with:

```jsx
        <div className={styles.tableHead}>
          <span className={styles.th}>Player</span>
          <span className={styles.th}>Buy-in</span>
          <span className={styles.th}>Cash-out</span>
          <span className={styles.th}>Net</span>
          <span className={styles.th} />
        </div>
```

- [ ] **Step 5: Add the × button to each entry row**

Find the closing `</div>` of the `entryRow` map (after the `netAmount` span). The current row ends like:

```jsx
              <span
                className={styles.netAmount}
                style={{ color: net === null ? 'var(--text-muted)' : net >= 0 ? 'var(--green)' : 'var(--red)' }}
              >
                {net === null ? '—' : net >= 0 ? `+$${net.toFixed(2)}` : `-$${Math.abs(net).toFixed(2)}`}
              </span>
            </div>
```

Replace with:

```jsx
              <span
                className={styles.netAmount}
                style={{ color: net === null ? 'var(--text-muted)' : net >= 0 ? 'var(--green)' : 'var(--red)' }}
              >
                {net === null ? '—' : net >= 0 ? `+$${net.toFixed(2)}` : `-$${Math.abs(net).toFixed(2)}`}
              </span>
              {isOpen && (
                <button
                  className={styles.removeBtn}
                  onClick={ev => { ev.stopPropagation(); handleRemoveEntry(e.id) }}
                  aria-label={`Remove ${e.playerName}`}
                >
                  ×
                </button>
              )}
            </div>
```

- [ ] **Step 6: Start dev server and manually verify**

```bash
npm run dev
```

Open an open session. Verify:
1. Each player row has a faint `×` on the right.
2. Hovering the `×` makes it fully red.
3. Clicking `×` removes the entry and the player reappears as available in the picker below.
4. Clicking the player name area still navigates to the player page (stopPropagation works).
5. Open a closed session — verify no `×` buttons appear.

- [ ] **Step 7: Commit**

```bash
git add src/pages/SessionDetail.jsx src/pages/SessionDetail.module.css
git commit -m "feat: add remove player button to open sessions"
```

---

## Task 3: Bar chart horizontal layout

**Files:**
- Modify: `src/components/SessionBarChart.jsx`

Context: The current chart uses the default Recharts vertical layout (bars pointing up) with player names on XAxis. With 11+ players on a mobile-width screen the labels overlap. Switching to `layout="vertical"` puts names on YAxis (left), bars extend right, and height scales per player so every name is always visible.

- [ ] **Step 1: Replace `SessionBarChart.jsx` with horizontal layout**

Replace the full contents of `src/components/SessionBarChart.jsx` with:

```jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer,
} from 'recharts'

export default function SessionBarChart({ entries }) {
  const data = entries
    .filter(e => e.cashout !== null)
    .map(e => ({
      name:   e.playerName,
      profit: parseFloat((e.cashout - e.total_buyin).toFixed(2)),
    }))
    .sort((a, b) => b.profit - a.profit)

  if (!data.length) return null

  const height = Math.max(180, data.length * 40)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <XAxis
          type="number"
          tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${v}`}
        />
        <Tooltip
          contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }}
          labelStyle={{ color: 'var(--text)' }}
          itemStyle={{ color: 'var(--text)' }}
          formatter={v => [`$${Number(v).toFixed(2)}`, 'Profit']}
        />
        <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.profit >= 0 ? 'var(--green)' : 'var(--red)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Start dev server and manually verify**

```bash
npm run dev
```

Open a closed session with multiple players. Verify:
1. All player names are visible on the left axis, one per row.
2. Bars extend horizontally — green for positive, red for negative.
3. Dollar values show on the bottom axis.
4. Tooltip still shows on hover with the correct profit value.
5. With 11 players, no names overlap and the chart is fully readable.

- [ ] **Step 3: Commit**

```bash
git add src/components/SessionBarChart.jsx
git commit -m "fix: switch session bar chart to horizontal layout for readability"
```
