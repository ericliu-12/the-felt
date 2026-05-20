# Session Recap Share Card — Design Spec

## Goal

Add a share flow to the SessionDetail page (closed sessions only) that lets any user download a PNG results card and copy a direct link to the session.

## Architecture

All client-side. No new routes or backend changes.

**New files:**
- `src/components/ShareCard.jsx` — off-screen div that renders the card layout; captured by html2canvas
- `src/components/ShareCard.module.css` — card styles (fixed-width, dark theme, avoids CSS variables where html2canvas may not resolve them — uses literal hex/rgb values)

**Modified files:**
- `src/pages/SessionDetail.jsx` — add share button row and ShareCard mount (closed sessions only)
- `src/pages/SessionDetail.module.css` — styles for the share button row
- `package.json` — add `html2canvas` dependency

## ShareCard Data Shape

`ShareCard` receives all data it needs as props — it does not fetch:

```js
{
  sessionName: string,      // e.g. "Friday Night"
  date: string,             // formatted: "May 16, 2026"
  entries: [                // sorted by net descending (winners first)
    { name: string, net: number }   // net = cashout - total_buyin
  ],
  totalPot: number,         // sum of all total_buyin values
  settlement: [             // from existing computeSettlement()
    { from: string, to: string, amount: number }
  ]
}
```

## Card Layout

Fixed width: **360px**. Height: auto (grows with player count).

```
┌─────────────────────────────────┐
│  THE FELT                (logo) │
│  Friday Night · May 16, 2026    │
├─────────────────────────────────┤
│  🏆  Alex          +$120.00     │  ← winner callout (gold, large)
├─────────────────────────────────┤
│  1.  Alex          +$120.00     │
│  2.  Sam            +$30.00     │
│  3.  Dana           -$50.00     │
│  4.  Mike          -$100.00     │
├─────────────────────────────────┤
│  Pot  $300.00                   │
├─────────────────────────────────┤
│  Settlements                    │
│  Mike → Alex  $100.00           │
│  Dana → Sam    $50.00           │
└─────────────────────────────────┘
```

- Background: `#1a1a1a` (matches `--bg-card`)
- Winner callout: `#c9a84c` (matches `--gold`), bold, 1.25rem
- Profit values: `#4caf7d` (matches `--green`) / `#e05252` (matches `--red`)
- Muted text: `#888` (matches `--text-muted`)
- Font: system monospace for numbers; sans-serif for labels (avoids external font load issues)

## Share Buttons

Rendered below the Settlement section on closed sessions. Two side-by-side pill buttons:

- **Download Image** — calls `html2canvas(cardRef.current, { scale: 2 })` then triggers PNG download as `the-felt-[session-name].png`. Before capture, waits for `document.fonts.ready` to ensure fonts are loaded.
- **Copy Link** — calls `navigator.clipboard.writeText(window.location.href)`, then shows inline confirmation text "Copied!" for 2 seconds.

The `ShareCard` div is mounted off-screen (`position: absolute; left: -9999px`) so it exists in the DOM for capture but is invisible to the user.

## State

In `SessionDetail.jsx`:
- `copying` — boolean, drives the "Copied!" label on the copy button

No other new state needed. `html2canvas` is called on-demand inside the download handler.

## What This Is Not

- No native share sheet (Web Share API) — download + clipboard covers both mobile and desktop simply
- No server-side image generation
- No new Supabase queries — all data already loaded in SessionDetail
