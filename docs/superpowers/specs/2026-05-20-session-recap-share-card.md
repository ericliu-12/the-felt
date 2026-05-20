# Session Recap Share Card — Design Spec

## Goal

Add a share flow to the SessionDetail page (closed sessions only) that lets any user share a PNG results card (via native share sheet on mobile, PNG download on desktop) and copy a direct link to the session.

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

Rendered below the Settlement section on closed sessions. Two side-by-side pill buttons: **Share Image** and **Copy Link**.

### Share Image

1. Wait for `document.fonts.ready`.
2. Call `html2canvas(cardRef.current, { scale: 2 })` to get a canvas.
3. Convert to blob: `canvas.toBlob(blob => ..., 'image/png')`.
4. **Mobile (Web Share API available):** check `navigator.canShare({ files: [file] })` — if true, call `navigator.share({ files: [file], title: sessionName })`. This opens the iOS/Android share sheet where the user can Save Image to Photos, send via iMessage, AirDrop, etc.
5. **Desktop fallback:** if Web Share API is unavailable or `canShare` returns false, create an `<a>` with `href = URL.createObjectURL(blob)` and `download = "the-felt-[session-name].png"` and click it.

### Copy Link

Calls `navigator.clipboard.writeText(window.location.href)`, then shows inline confirmation text "Copied!" for 2 seconds (driven by `copying` state).

The `ShareCard` div is mounted off-screen (`position: absolute; left: -9999px`) so it exists in the DOM for capture but is invisible to the user.

## State

In `SessionDetail.jsx`:
- `copying` — boolean, drives the "Copied!" label on the copy button
- `sharing` — boolean, prevents double-tap while html2canvas is running

## What This Is Not

- No server-side image generation
- No new Supabase queries — all data already loaded in SessionDetail
