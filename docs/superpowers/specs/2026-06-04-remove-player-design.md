# Remove Player, Duplicate Prevention & Bar Chart Fix — Design Spec

**Date:** 2026-06-04

## Problems

1. Users can accidentally add a player twice (or the wrong player) to an open session. There is no way to remove an entry from the UI.
2. No database-level unique constraint prevents duplicate `(session_id, player_id)` entries in `session_entries`.
3. The session results bar chart breaks visually at ~11 players — horizontal name labels overlap and the fixed 180px height is too short.

## Goals

1. Add a × remove button to each player row, available to anyone on open sessions.
2. Add a unique constraint on `session_entries(session_id, player_id)` to make duplicates impossible at the database level.
3. Switch the bar chart to a horizontal layout that scales cleanly with any number of players.

## Scope

- Remove: open sessions only. Closed sessions are immutable from the UI; admins can reopen first.
- No admin gate on remove — any user can remove a player from an open session.
- No confirmation dialog — re-adding via the picker is immediate, so accidental removal is low-cost.

---

## Feature 1: Remove Player Button

### Data layer — no changes

`deleteEntry(entryId)` already exists in `useSession.js` and is already returned from the hook.

### `SessionDetail.jsx` changes

1. Destructure `deleteEntry` from `useSession` (already in the return value, just unused).
2. Add `handleRemoveEntry(entryId)` — calls `deleteEntry(entryId)`, surfaces errors via `setMutErr`.
3. In the entries table, add a 5th column:
   - Header: blank `<span>` in `.tableHead` for alignment.
   - Row: a `×` `<button className={styles.removeBtn}>` rendered only when `isOpen`. Its `onClick` calls `handleRemoveEntry(e.id)` and `stopPropagation()` to prevent row navigation to the player page.

### `SessionDetail.module.css` changes

Add `.removeBtn`:
- No background, no border.
- Muted red (`var(--red)`), low opacity at rest, full on hover.
- Sized to not disrupt row height.

### Error handling

On Supabase error, `handleRemoveEntry` catches and sets `mutErr`, surfaced via the existing `<ErrorBanner>`.

---

## Feature 2: Duplicate Prevention

### Supabase migration

Add a unique constraint on `session_entries(session_id, player_id)`. This is a one-line SQL migration run in the Supabase dashboard SQL editor:

```sql
ALTER TABLE session_entries
  ADD CONSTRAINT session_entries_session_player_unique
  UNIQUE (session_id, player_id);
```

The app-level picker already disables added players visually (`disabled={addedIds.has(p.id)}`), so no UI changes are needed. The constraint is a safety net for race conditions or any direct inserts.

---

## Feature 3: Bar Chart Fix

### Problem

`SessionBarChart` uses a vertical bar layout (bars pointing up) with player names on the XAxis. At 11+ players on a mobile-width screen, names overlap and become unreadable. The fixed `height={180}` is also too short.

### Fix — horizontal bar chart

Switch to Recharts `layout="vertical"`:
- Player names move to the **YAxis** (left side), one per row.
- Bars extend **horizontally** to the right.
- Dollar values on the XAxis (bottom).
- Height scales dynamically: `Math.max(180, entries.length * 40)` px — gives ~40px per player row.
- No external API changes — `SessionBarChart` still receives the same `entries` prop.

### `SessionBarChart.jsx` changes

- Add `layout="vertical"` to `<BarChart>`.
- Swap axis roles: `<YAxis type="category" dataKey="name">`, `<XAxis type="number">`.
- Set `height` dynamically based on player count.
- Keep existing color logic (green/red per profit sign) and tooltip unchanged.

---

## Testing

- **Remove:** open a session, remove a player, verify entry disappears and picker re-enables that player. Verify × not visible on closed session.
- **Duplicate:** run the migration, attempt to insert a duplicate entry directly — verify it is rejected.
- **Chart:** view a closed session with 11 players, verify all names are visible and bars are readable.
