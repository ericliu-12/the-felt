# Remove Player from Session — Design Spec

**Date:** 2026-06-04

## Problem

Users can accidentally add a player twice (or add the wrong player) to an open session. There is currently no way to remove an entry without going to Supabase directly.

## Goal

Add a × remove button to each player row in the session detail view, available to anyone on open sessions only.

## Scope

- Open sessions only. Closed sessions are immutable from the UI; admins can reopen first if a correction is needed.
- No admin gate — any user can remove a player from an open session.
- No confirmation dialog — re-adding via the player picker below is immediate, so accidental removal is low-cost.

## Architecture

### Data layer — no changes

`deleteEntry(entryId)` already exists in `useSession.js` and is already returned from the hook. Nothing to add.

### `SessionDetail.jsx` changes

1. Destructure `deleteEntry` from the `useSession` hook return value (it's already there, just unused).
2. Add `handleRemoveEntry(entryId)` — calls `deleteEntry(entryId)`, surfaces errors via `setMutErr`.
3. In the entries table, add a 5th column:
   - Header: blank `<span>` in `.tableHead` for alignment.
   - Row: a `×` `<button className={styles.removeBtn}>` rendered only when `isOpen`. Its `onClick` calls `handleRemoveEntry(e.id)` and `stopPropagation()` to prevent row navigation to the player page.

### `SessionDetail.module.css` changes

Add `.removeBtn`:
- No background, no border.
- Small muted-red color (`var(--red)`), low opacity at rest, full opacity on hover.
- Sized to not disrupt row height.

## Error handling

On Supabase error, `handleRemoveEntry` catches and sets `mutErr`, which surfaces via the existing `<ErrorBanner>`.

## Testing

Manual: open a session, add a player twice, remove one via ×, verify only one entry remains and the player picker re-enables that player. Verify × buttons do not appear on a closed session.
