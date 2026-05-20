# GTO Trainer — Design Spec

## Goal

Add a stateless quiz feature to The Felt that presents poker spots (preflop and postflop), asks the user to pick the correct GTO action, and teaches them when they're wrong.

## Architecture

No database involvement. The feature is entirely client-side:

- `src/data/scenarios.js` — exported array of scenario objects (the question bank)
- `src/pages/TrainerPage.jsx` — quiz UI, random scenario selection, answer/feedback state
- `src/pages/TrainerPage.module.css` — styles matching the app's dark theme
- Add "GTO Trainer" route (`/trainer`) to `src/App.jsx`
- Add "GTO Trainer" menu item to `src/components/Layout.jsx`

## Scenario Data Shape

```js
{
  id: 'pf-001',           // unique string
  category: 'preflop',    // 'preflop' | 'postflop'
  situation: "6-max cash, 100BB deep. Folded to you on the BTN.",
  hand: "A7o",            // hole cards, always shown
  board: null,            // postflop only: e.g. "Kh 7d 2c" — null for preflop
  options: ["Fold", "Raise 2.5x", "Limp"],   // 2–4 strings
  correct: "Raise 2.5x",  // must exactly match one entry in options
  explanation: "A7o is a profitable BTN open in 6-max. You have position, fold equity, and good equity vs calling ranges. Limping is exploitable."
}
```

The scenario bank covers:
- **Preflop (~25 scenarios):** BTN/CO/HJ opens, SB/BB vs steal, 3bet spots (value and bluff), facing 3bets (call/4bet/fold), squeeze spots
- **Postflop (~20 scenarios):** C-bet decisions (dry vs wet boards), facing c-bets (call/raise/fold), turn barrel vs check-back, river value bet sizing, bluff-catch spots

All scenarios assume 6-max cash game, 100BB effective, rake-free (standard GTO study baseline).

## Quiz Flow

1. On page load, a random scenario is selected from the full bank.
2. The UI shows:
   - Category badge (PREFLOP / POSTFLOP)
   - Situation description
   - Hand (e.g. "A♥ 7♦")
   - Board cards if postflop (e.g. "K♥ 7♦ 2♣")
   - Action buttons (one per option)
3. User taps an action.
4. Buttons lock. The correct button turns green; if the user was wrong, their button turns red.
5. Explanation text animates in below the buttons.
6. A "Next Hand →" button appears to advance.
7. Session score (e.g. "4 / 6 correct") is shown in the header area of the page throughout.
8. On "Next Hand", a new random scenario loads. The same scenario will not repeat until all scenarios have been seen (Fisher-Yates shuffle of the full deck, cycling when exhausted).

## UI Components

**TrainerPage** manages all state:
- `scenario` — current scenario object
- `selected` — the option string the user picked, or null
- `score` — `{ correct: number, total: number }`
- `seen` — index queue (shuffled, refilled when empty)

No child components needed — the page is self-contained and small enough to keep in one file.

## Styling

Matches existing app conventions (CSS Modules, dark theme variables):
- Situation card: `var(--bg-card)` background, same border/radius as other cards
- Hand display: large monospace text, suit symbols colored (♥♦ red, ♠♣ white)
- Board cards: same style, slightly smaller
- Action buttons: pill-shaped, `var(--bg-elevated)` default → green (`var(--green)`) on correct, red (`var(--red)`) on wrong, disabled after pick
- Explanation: muted text, fades in after answer
- Score: small counter top-right of page, `var(--text-muted)`

## What This Is Not

- No solver integration — answers are hand-authored, not computed
- No user accounts or progress persistence — score resets on page reload
- No range matrix UI — action-level multiple choice only
- No tournament spots — cash game only for the initial scenario bank
