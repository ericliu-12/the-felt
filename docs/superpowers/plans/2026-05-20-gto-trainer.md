# GTO Trainer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/trainer` page to The Felt that quizzes players on GTO poker decisions and explains the correct answer.

**Architecture:** A single new route backed by a static scenario bank (`src/data/scenarios.js`) with no database involvement. `TrainerPage.jsx` manages a Fisher-Yates shuffled queue for no-repeat ordering and tracks a session score in local state.

**Tech Stack:** React 19, CSS Modules, Vitest, existing app routing (React Router 7)

---

## Codebase Context

This is a React 19 + Vite app using CSS Modules and React Router 7. All pages live in `src/pages/`, data hooks in `src/hooks/`, and tests use Vitest with jsdom. CSS uses dark-theme variables defined in `src/index.css`:
- `--bg-card: #161616`, `--bg-elevated: #1f1f1f`, `--border: #2a2a2a`
- `--gold: #c9a84c`, `--green: #4caf7d`, `--red: #e05252`
- `--text: #f0ece3`, `--text-muted: #6b6b6b`
- `--radius: 8px`, `--radius-lg: 16px`, `--transition: 200ms ease`
- `--font-display: 'Playfair Display'`, `--font-mono: 'JetBrains Mono'`
- Utility classes: `.profit` (green), `.loss` (red), `.gold`, `.muted`, `.mono`

Existing page pattern: `export default function PageName()` in `src/pages/PageName.jsx` with co-located `PageName.module.css`.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/data/scenarios.js` | Exported array of 40 scenario objects |
| Create | `src/data/scenarios.test.js` | Validates every scenario has correct shape |
| Create | `src/pages/TrainerPage.jsx` | Quiz UI — state, shuffle, feedback |
| Create | `src/pages/TrainerPage.module.css` | Page styles |
| Modify | `src/App.jsx` | Add `/trainer` route |
| Modify | `src/components/Layout.jsx` | Add "GTO Trainer" menu item |

---

## Task 1: Scenario data file + validation tests

**Files:**
- Create: `src/data/scenarios.js`
- Create: `src/data/scenarios.test.js`

### Scenario object shape

Every object must satisfy:
```js
{
  id: string,          // unique, e.g. 'pf-01'
  category: 'preflop' | 'postflop',
  situation: string,   // describes position, stack depth, action
  hand: string,        // e.g. 'A♠ K♦' — always shown
  board: string|null,  // null for preflop; e.g. 'K♥ 7♦ 2♣' for postflop
  options: string[],   // 2–4 choices
  correct: string,     // MUST exactly match one entry in options
  explanation: string, // shown after answer
}
```

- [ ] **Step 1: Write the failing tests**

Create `src/data/scenarios.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { scenarios } from './scenarios'

describe('scenarios data', () => {
  it('exports a non-empty array', () => {
    expect(Array.isArray(scenarios)).toBe(true)
    expect(scenarios.length).toBeGreaterThan(0)
  })

  it('every scenario has required string fields', () => {
    for (const s of scenarios) {
      expect(typeof s.id, s.id).toBe('string')
      expect(typeof s.situation, s.id).toBe('string')
      expect(typeof s.hand, s.id).toBe('string')
      expect(typeof s.explanation, s.id).toBe('string')
    }
  })

  it('every scenario has category preflop or postflop', () => {
    for (const s of scenarios) {
      expect(['preflop', 'postflop'], s.id).toContain(s.category)
    }
  })

  it('every scenario has 2–4 options', () => {
    for (const s of scenarios) {
      expect(s.options.length, s.id).toBeGreaterThanOrEqual(2)
      expect(s.options.length, s.id).toBeLessThanOrEqual(4)
    }
  })

  it('correct exactly matches one option in every scenario', () => {
    for (const s of scenarios) {
      expect(s.options, `${s.id} correct="${s.correct}" not in options`).toContain(s.correct)
    }
  })

  it('all ids are unique', () => {
    const ids = scenarios.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('preflop scenarios have null board', () => {
    for (const s of scenarios.filter(s => s.category === 'preflop')) {
      expect(s.board, s.id).toBeNull()
    }
  })

  it('postflop scenarios have a non-null board string', () => {
    for (const s of scenarios.filter(s => s.category === 'postflop')) {
      expect(typeof s.board, s.id).toBe('string')
    }
  })

  it('has at least 10 preflop and 10 postflop scenarios', () => {
    const pre  = scenarios.filter(s => s.category === 'preflop').length
    const post = scenarios.filter(s => s.category === 'postflop').length
    expect(pre).toBeGreaterThanOrEqual(10)
    expect(post).toBeGreaterThanOrEqual(10)
  })
})
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
npm test -- scenarios.test.js
```

Expected: FAIL — "Cannot find module './scenarios'"

- [ ] **Step 3: Create `src/data/scenarios.js` with 40 scenarios**

```js
export const scenarios = [
  // ── PREFLOP (22 spots) ──────────────────────────────────────────────────

  {
    id: 'pf-01', category: 'preflop',
    situation: '6-max cash, 100BB. Folded to you on the BTN.',
    hand: 'A♠ 7♦', board: null,
    options: ['Fold', 'Limp', 'Raise to 2.5bb'],
    correct: 'Raise to 2.5bb',
    explanation: 'A7o is a profitable BTN open — you can raise ~40% of hands here. Limping is exploitable and leaves money on the table.',
  },
  {
    id: 'pf-02', category: 'preflop',
    situation: '6-max cash, 100BB. Folded to you on the BTN.',
    hand: '7♣ 2♦', board: null,
    options: ['Fold', 'Raise to 2.5bb'],
    correct: 'Fold',
    explanation: '72o is the worst hand in poker — no straight potential, no flush draw, dominated by everything. Always fold.',
  },
  {
    id: 'pf-03', category: 'preflop',
    situation: '6-max cash, 100BB. Folded to you on the BTN.',
    hand: 'K♥ 9♥', board: null,
    options: ['Fold', 'Raise to 2.5bb'],
    correct: 'Raise to 2.5bb',
    explanation: 'K9s is a solid BTN open. It has good equity, nut flush potential, and plays well postflop in position.',
  },
  {
    id: 'pf-04', category: 'preflop',
    situation: '6-max cash, 100BB. Folded to you on the BTN.',
    hand: 'Q♠ J♦', board: null,
    options: ['Fold', 'Raise to 2.5bb'],
    correct: 'Raise to 2.5bb',
    explanation: 'QJo has good equity, two high cards, and position. Comfortable BTN open.',
  },
  {
    id: 'pf-05', category: 'preflop',
    situation: '6-max cash, 100BB. Folded to you on the CO.',
    hand: 'J♦ T♦', board: null,
    options: ['Fold', 'Raise to 2.5bb'],
    correct: 'Raise to 2.5bb',
    explanation: 'JTs is a premium suited connector — open from any position. Excellent playability, strong equity, and makes the nuts often.',
  },
  {
    id: 'pf-06', category: 'preflop',
    situation: '6-max cash, 100BB. Folded to you on the CO.',
    hand: 'K♣ 5♦', board: null,
    options: ['Fold', 'Raise to 2.5bb'],
    correct: 'Fold',
    explanation: 'K5o is too weak for a CO open. CO opens ~25-28% and K5o misses that cut — it lacks connectivity and is dominated too often by AK and KQ.',
  },
  {
    id: 'pf-07', category: 'preflop',
    situation: '6-max cash, 100BB. Folded to you on the HJ.',
    hand: 'A♦ Q♠', board: null,
    options: ['Fold', 'Raise to 2.5bb'],
    correct: 'Raise to 2.5bb',
    explanation: 'AQo opens from every position. Two high cards, strong equity, and plenty of fold equity.',
  },
  {
    id: 'pf-08', category: 'preflop',
    situation: '6-max cash, 100BB. Folded to you on the HJ.',
    hand: 'J♣ 8♦', board: null,
    options: ['Fold', 'Raise to 2.5bb'],
    correct: 'Fold',
    explanation: 'J8o is too loose for HJ. The HJ opens around 20% — J8o lacks the equity and connectivity to be profitable here.',
  },
  {
    id: 'pf-09', category: 'preflop',
    situation: '6-max cash, 100BB. Folded to you UTG.',
    hand: 'T♠ T♦', board: null,
    options: ['Fold', 'Raise to 2.5bb'],
    correct: 'Raise to 2.5bb',
    explanation: 'TT opens from every position — it\'s a strong pair that frequently has the best hand preflop and plays well as an overpair postflop.',
  },
  {
    id: 'pf-10', category: 'preflop',
    situation: '6-max cash, 100BB. Folded to you UTG.',
    hand: 'K♦ J♠', board: null,
    options: ['Fold', 'Raise to 2.5bb'],
    correct: 'Fold',
    explanation: 'KJo is a fold UTG in most GTO solutions. UTG opens ~14-16% and KJo is dominated by AJ, KQ, and AK too often to be profitable from the tightest position.',
  },
  {
    id: 'pf-11', category: 'preflop',
    situation: '6-max cash, 100BB. Folded to you on the SB.',
    hand: 'A♣ 4♣', board: null,
    options: ['Fold', 'Complete', 'Raise to 3bb'],
    correct: 'Raise to 3bb',
    explanation: 'From the SB you must 3bet or fold — completing lets the BB see a free flop and is exploitable. A4s is strong enough to raise: it has a nut flush draw and wheel potential.',
  },
  {
    id: 'pf-12', category: 'preflop',
    situation: '6-max cash, 100BB. CO opens to 2.5bb. Action on BTN, SB, then you in BB.',
    hand: '8♥ 8♦', board: null,
    options: ['Fold', 'Call', '3-bet to 8bb'],
    correct: 'Call',
    explanation: '88 is a call from the BB. The pot odds are excellent, 88 is too strong to fold, but 3betting is marginal since it blocks no strong hands. Calling and set-mining is the clean line.',
  },
  {
    id: 'pf-13', category: 'preflop',
    situation: '6-max cash, 100BB. BTN opens to 2.5bb, folds to you in the SB.',
    hand: 'A♦ 5♦', board: null,
    options: ['Fold', 'Call', '3-bet to 9bb'],
    correct: '3-bet to 9bb',
    explanation: 'From the SB, GTO is 3bet or fold — calling is weak. A5s is a perfect 3bet bluff: it blocks AK/AQ, has nut flush potential, and forces the BTN to play out of position vs a re-raise.',
  },
  {
    id: 'pf-14', category: 'preflop',
    situation: '6-max cash, 100BB. CO opens to 2.5bb, folds to you on the BTN.',
    hand: 'A♥ J♥', board: null,
    options: ['Fold', 'Call', '3-bet to 8bb'],
    correct: '3-bet to 8bb',
    explanation: 'AJs is a 3bet from BTN vs CO. You have a strong hand, position, and can extract value. 3betting also denies the blinds from realizing equity.',
  },
  {
    id: 'pf-15', category: 'preflop',
    situation: '6-max cash, 100BB. HJ opens to 2.5bb, folds to you on the BTN.',
    hand: 'K♣ Q♣', board: null,
    options: ['Fold', 'Call', '3-bet to 8bb'],
    correct: '3-bet to 8bb',
    explanation: 'KQs is a 3bet vs HJ open. It\'s a premium hand — 3betting builds the pot in position and denies equity from the blinds.',
  },
  {
    id: 'pf-16', category: 'preflop',
    situation: '6-max cash, 100BB. You open CO to 2.5bb, BTN 3-bets to 8bb. Folds back to you.',
    hand: 'Q♠ Q♥', board: null,
    options: ['Fold', 'Call', '4-bet to 22bb'],
    correct: '4-bet to 22bb',
    explanation: 'QQ is always a 4bet vs a BTN 3bet. The BTN 3bet range is wide, and QQ crushes it. 4betting for value and protection is mandatory.',
  },
  {
    id: 'pf-17', category: 'preflop',
    situation: '6-max cash, 100BB. You open BTN to 2.5bb, BB 3-bets to 9bb. Action on you.',
    hand: 'A♠ Q♦', board: null,
    options: ['Fold', 'Call', '4-bet to 25bb'],
    correct: 'Call',
    explanation: 'AQo calls a BB 3bet. Folding is too tight; 4betting is too aggressive since BB\'s 3bet range often includes AK and QQ+. Calling in position and playing postflop is the balanced line.',
  },
  {
    id: 'pf-18', category: 'preflop',
    situation: '6-max cash, 100BB. You open BTN to 2.5bb, SB 3-bets to 9bb. Action on you.',
    hand: 'K♦ J♦', board: null,
    options: ['Fold', 'Call', '4-bet to 25bb'],
    correct: 'Fold',
    explanation: 'KJo folds to a SB 3bet. SB only 3bets strong hands, and KJo is dominated by AJ, KQ, AA, and KK too often. It has poor playability vs a strong range.',
  },
  {
    id: 'pf-19', category: 'preflop',
    situation: '6-max cash, 100BB. CO opens to 2.5bb, BTN 3-bets to 8bb. Folds back to you in CO.',
    hand: 'J♠ J♦', board: null,
    options: ['Fold', 'Call', '4-bet to 22bb'],
    correct: 'Call',
    explanation: 'JJ calls a BTN 3bet. It\'s too strong to fold but 4betting runs into QQ/KK/AA and doesn\'t benefit much from fold equity. Calling in position and playing postflop is cleaner.',
  },
  {
    id: 'pf-20', category: 'preflop',
    situation: '6-max cash, 100BB. BTN opens to 2.5bb, SB folds. Action on you in BB.',
    hand: '9♥ 7♣', board: null,
    options: ['Fold', 'Call', '3-bet to 9bb'],
    correct: 'Call',
    explanation: '97o calls from the BB. You\'re getting 3:1 pot odds, and 97o has enough connectivity and board coverage to call profitably. 3betting is too aggressive for a hand this weak.',
  },
  {
    id: 'pf-21', category: 'preflop',
    situation: '6-max cash, 100BB. CO opens to 2.5bb, BTN folds, SB folds. Action on you in BB.',
    hand: 'Q♦ T♠', board: null,
    options: ['Fold', 'Call', '3-bet to 8bb'],
    correct: 'Call',
    explanation: 'QTo calls from the BB vs a CO open. Pot odds are good, and QTo has decent equity. It\'s not strong enough to 3bet profitably but folding is too tight.',
  },
  {
    id: 'pf-22', category: 'preflop',
    situation: '6-max cash, 100BB. BTN opens to 2.5bb, SB folds. Action on you in BB.',
    hand: '5♣ 2♠', board: null,
    options: ['Fold', 'Call'],
    correct: 'Fold',
    explanation: '52o folds even from the BB. Despite the pot odds, 52o has no high card value and won\'t flop well enough often enough to justify calling.',
  },

  // ── POSTFLOP (18 spots) ─────────────────────────────────────────────────

  {
    id: 'fp-01', category: 'postflop',
    situation: 'BTN vs BB. Single raised pot, 5.5bb. You raised BTN, BB called. BB checks.',
    hand: 'A♠ K♦', board: 'K♥ 7♦ 2♣',
    options: ['Check', 'Bet 2.5bb (small)', 'Bet 4.5bb (large)'],
    correct: 'Bet 2.5bb (small)',
    explanation: 'K72 rainbow heavily favors the BTN range. You have top pair top kicker. A small c-bet (40-50% pot) extracts value and denies equity from gutshots and overcards.',
  },
  {
    id: 'fp-02', category: 'postflop',
    situation: 'CO vs BTN. Single raised pot, 5.5bb. You raised CO, BTN called. You are first to act.',
    hand: 'A♥ Q♦', board: 'Q♠ T♠ 8♥',
    options: ['Check', 'Bet 2.5bb (small)', 'Bet 4.5bb (large)'],
    correct: 'Check',
    explanation: 'QT8 with two spades is a wet board that connects well with the BTN\'s calling range (JTs, 97s, 76s). Checking out of position protects your range and avoids getting check-raised off your equity.',
  },
  {
    id: 'fp-03', category: 'postflop',
    situation: 'BTN vs BB. Single raised pot, 5.5bb. You raised BTN, BB called. BB checks.',
    hand: '9♥ 9♦', board: 'A♦ 6♣ 2♥',
    options: ['Check', 'Bet 2.5bb (small)', 'Bet 4.5bb (large)'],
    correct: 'Bet 2.5bb (small)',
    explanation: 'A62 rainbow strongly favors the BTN raiser\'s range. Even without an ace, c-bet small here — your entire range has an equity advantage, and BB will fold many weak hands that have only a few outs against you.',
  },
  {
    id: 'fp-04', category: 'postflop',
    situation: 'CO vs BTN. Single raised pot, 5.5bb. You raised CO, BTN called. You are first to act.',
    hand: 'K♣ K♠', board: 'J♦ T♣ 9♠',
    options: ['Check', 'Bet 2.5bb (small)', 'Bet 4.5bb (large)'],
    correct: 'Check',
    explanation: 'JT9 is one of the most connected boards possible — it smashes the BTN\'s calling range (QJ, QT, 87, 76). Even with KK, you can\'t comfortably call off vs the BTN\'s straights and two pairs. Check to keep the pot manageable.',
  },
  {
    id: 'fp-05', category: 'postflop',
    situation: 'BTN vs BB. Single raised pot, 5.5bb. You raised BTN, BB called. BB checks.',
    hand: 'A♣ K♦', board: '7♦ 5♣ 2♠',
    options: ['Check', 'Bet 2.5bb (small)', 'Bet 4.5bb (large)'],
    correct: 'Bet 2.5bb (small)',
    explanation: '752 rainbow is an extremely dry board with no draws. Your high-card hands have the most equity here. A small c-bet applies pressure with lots of fold equity — BB has very few strong hands on this board.',
  },
  {
    id: 'fp-06', category: 'postflop',
    situation: 'BB vs BTN. Single raised pot, 5.5bb. BTN c-bets 2.5bb. Action on you.',
    hand: 'K♠ Q♠', board: 'A♥ J♣ 3♦',
    options: ['Fold', 'Call', 'Raise'],
    correct: 'Call',
    explanation: 'KQs has a gutshot (any T makes broadway), backdoor flush draw, and an overcard. Against a small c-bet on AJ3, this is a clear call — you have too much equity to fold and not enough made hand to raise.',
  },
  {
    id: 'fp-07', category: 'postflop',
    situation: 'BB vs BTN. Single raised pot, 5.5bb. BTN c-bets 2.5bb. Action on you.',
    hand: '6♦ 5♦', board: 'T♦ 8♣ 2♠',
    options: ['Fold', 'Call', 'Raise'],
    correct: 'Call',
    explanation: '65d has an open-ended straight draw (any 4 or 9). Despite being out of position, you have 8 outs to the straight. Calling to realize that equity is correct — folding gives up too much.',
  },
  {
    id: 'fp-08', category: 'postflop',
    situation: 'BTN vs CO. Single raised pot, 5.5bb. CO c-bets 2.5bb. Action on you.',
    hand: 'J♥ T♥', board: 'A♠ K♦ Q♥',
    options: ['Fold', 'Call', 'Raise'],
    correct: 'Raise',
    explanation: 'JT on AKQ gives you the Broadway straight — the absolute nuts. You must raise here. Calling might let the board pair, reducing your hand\'s value and allowing cheaper draws to get there.',
  },
  {
    id: 'fp-09', category: 'postflop',
    situation: 'BB vs BTN. Single raised pot, 5.5bb. BTN c-bets 4bb. Action on you.',
    hand: '4♣ 4♦', board: 'Q♠ 9♦ 4♠',
    options: ['Fold', 'Call', 'Raise'],
    correct: 'Raise',
    explanation: 'Bottom set on Q94 with a flush draw is a monster — raise to protect. Calling lets every spade, 8, T, J, or K come off for free. Charge draws now while you\'re a huge favorite.',
  },
  {
    id: 'fp-10', category: 'postflop',
    situation: 'BB vs BTN. Single raised pot, 5.5bb. BTN c-bets 2.5bb. Action on you.',
    hand: 'A♥ 7♣', board: 'K♠ 8♦ 3♣',
    options: ['Fold', 'Call', 'Raise'],
    correct: 'Fold',
    explanation: 'A7o with no pair and no draw on K83 is an easy fold. You have 3 outs to top pair at best (with a weak kicker), no flush potential, and no straight draws. Not enough equity to continue vs a c-bet.',
  },
  {
    id: 'fp-11', category: 'postflop',
    situation: 'BTN vs BB. Flop K♥ 7♦ 2♣. You bet, BB called. Pot: 10.5bb. Turn: 3♥. BB checks.',
    hand: 'A♠ K♠', board: 'K♥ 7♦ 2♣ 3♥',
    options: ['Check', 'Bet 4bb (medium)', 'Bet 8bb (large)'],
    correct: 'Bet 4bb (medium)',
    explanation: 'Top pair top kicker on a board that changed little (3h adds only a backdoor flush). Continue betting for value — your hand is very likely best. A medium bet extracts value from second pair and Kx without over-committing.',
  },
  {
    id: 'fp-12', category: 'postflop',
    situation: 'CO vs BTN. Flop 8♦ 6♣ 4♠. You checked, BTN bet, you called. Pot: 10.5bb. Turn: K♥. Action on you.',
    hand: 'J♠ T♦', board: '8♦ 6♣ 4♠ K♥',
    options: ['Check', 'Donk-bet 5bb', 'Check-raise'],
    correct: 'Check',
    explanation: 'The K is a blank for your JT straight draw (still need a 7 or 9). You\'re out of position with a draw — check to control the pot. Donk-betting or check-raising as a draw out of position is too aggressive and spews chips.',
  },
  {
    id: 'fp-13', category: 'postflop',
    situation: 'BTN vs BB. Flop 7♥ 5♦ 2♣. You bet, BB called. Pot: 10.5bb. Turn: 7♠. BB checks.',
    hand: 'A♦ Q♦', board: '7♥ 5♦ 2♣ 7♠',
    options: ['Check', 'Bet 4bb (medium)', 'Bet 8bb (large)'],
    correct: 'Check',
    explanation: 'The 7 pairs the board, which is bad for AQ — no pair, no draw. The BB\'s calling range contains more 7x hands than yours. Your equity has decreased significantly; check back and reassess on the river.',
  },
  {
    id: 'fp-14', category: 'postflop',
    situation: 'BTN vs BB. Board K♥ 7♦ 2♣ 3♥ 9♠. BB checks the river. Pot: 10.5bb.',
    hand: 'K♦ Q♣', board: 'K♥ 7♦ 2♣ 3♥ 9♠',
    options: ['Check', 'Bet 4bb (small)', 'Bet 9bb (large)'],
    correct: 'Bet 4bb (small)',
    explanation: 'Top pair on a bricked board — thin value bet. KQ is likely best but isn\'t a monster. A small bet gets called by worse kings, second pair, and stubborn floats. A large bet mostly folds out worse hands and only gets called by better.',
  },
  {
    id: 'fp-15', category: 'postflop',
    situation: 'BTN vs BB. Board A♦ 7♣ 2♠ J♥ 5♦. BB checks the river. Pot: 15bb.',
    hand: 'Q♠ T♠', board: 'A♦ 7♣ 2♠ J♥ 5♦',
    options: ['Check', 'Bet 6bb (bluff)', 'Bet 13bb (bluff)'],
    correct: 'Bet 6bb (bluff)',
    explanation: 'QTs missed everything but has excellent blocker properties — Q and T block QJ and QT hands the BB called with. A small river bluff with these blockers is higher EV than checking and losing at showdown.',
  },
  {
    id: 'fp-16', category: 'postflop',
    situation: 'BB vs BTN. Board J♦ T♣ 8♠ 2♥ 6♦. You check the river, BTN bets 10bb into 15bb.',
    hand: 'J♥ 9♠', board: 'J♦ T♣ 8♠ 2♥ 6♦',
    options: ['Fold', 'Call', 'Raise'],
    correct: 'Call',
    explanation: 'Top pair is a bluff-catcher here. You beat all bluffs (Q9, 97, A9, QT) and lose to straights and two pairs. Facing 10bb into 15bb you need 29% equity — you have enough against a balanced BTN range to call.',
  },
  {
    id: 'fp-17', category: 'postflop',
    situation: 'BB vs BTN. Board K♣ K♦ 7♠ 2♥ J♦. You check the river, BTN bets 12bb into 15bb.',
    hand: '8♥ 8♦', board: 'K♣ K♦ 7♠ 2♥ J♦',
    options: ['Fold', 'Call', 'Raise'],
    correct: 'Fold',
    explanation: 'Pocket 8s on KK72J is a weak hand vs an 80% pot river bet. BTN is polarized — they have Kx, JJ, or bluffs. At this sizing you need to be right 44% of the time. 88 loses to all value and wins only vs bluffs — the math doesn\'t work, fold.',
  },
  {
    id: 'fp-18', category: 'postflop',
    situation: 'BTN vs BB. Board Q♠ Q♦ 5♣ 9♥ 2♠. BB checks the river. Pot: 12bb.',
    hand: '9♦ 9♣', board: 'Q♠ Q♦ 5♣ 9♥ 2♠',
    options: ['Check', 'Bet 4bb (small)', 'Bet 10bb (large)'],
    correct: 'Bet 10bb (large)',
    explanation: '99 makes nines full of queens — a monster. The only hands that beat you are QQ or Q9, both extremely rare. Bet large: you want to get called by Qx, 55, and weaker full houses. Checking leaves significant value on the table.',
  },
]
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
npm test -- scenarios.test.js
```

Expected: all 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/scenarios.js src/data/scenarios.test.js
git commit -m "feat: add GTO trainer scenario bank with 40 scenarios"
```

---

## Task 2: TrainerPage component

**Files:**
- Create: `src/pages/TrainerPage.jsx`
- Create: `src/pages/TrainerPage.module.css`

- [ ] **Step 1: Create `src/pages/TrainerPage.module.css`**

```css
.page { display: flex; flex-direction: column; gap: 1rem; }

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title { font-size: 1.5rem; color: var(--text); }

.score {
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  color: var(--gold);
}

.badge {
  display: inline-block;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.2rem 0.625rem;
  border-radius: 999px;
  width: fit-content;
}

.pre  { background: rgba(201, 168, 76, 0.12);  color: var(--gold); }
.post { background: rgba(76, 175, 125, 0.12);  color: var(--green); }

.situationCard {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.situation {
  font-size: 0.9375rem;
  color: var(--text);
  line-height: 1.55;
}

.hands { display: flex; flex-direction: column; gap: 0.75rem; }

.handLabel {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.375rem;
}

.cards { display: flex; gap: 0.5rem; }

.cardToken {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

.redSuit { color: var(--red); }

.options { display: flex; flex-direction: column; gap: 0.5rem; }

.optBtn {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  color: var(--text);
  font-size: 0.9375rem;
  font-weight: 500;
  text-align: left;
  transition: border-color var(--transition), background var(--transition);
}

.optBtn:hover:not(:disabled) {
  border-color: var(--gold-dim);
  background: var(--bg-card);
  cursor: pointer;
}

.optBtn:disabled { cursor: default; }

.correct {
  border-color: var(--green) !important;
  background: rgba(76, 175, 125, 0.1) !important;
  color: var(--green) !important;
}

.wrong {
  border-color: var(--red) !important;
  background: rgba(224, 82, 82, 0.1) !important;
  color: var(--red) !important;
}

.dim { opacity: 0.35; }

.feedback {
  border-radius: var(--radius-lg);
  padding: 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  border: 1px solid;
}

.feedbackCorrect {
  background: rgba(76, 175, 125, 0.08);
  border-color: rgba(76, 175, 125, 0.25);
}

.feedbackWrong {
  background: rgba(224, 82, 82, 0.08);
  border-color: rgba(224, 82, 82, 0.25);
}

.feedbackTitle { font-weight: 700; font-size: 0.9375rem; }
.feedbackCorrect .feedbackTitle { color: var(--green); }
.feedbackWrong   .feedbackTitle { color: var(--red); }

.explanation { font-size: 0.875rem; color: var(--text); line-height: 1.55; }

.nextBtn {
  background: var(--gold);
  color: #0d0d0d;
  border: none;
  border-radius: var(--radius);
  padding: 0.625rem 1.25rem;
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  align-self: flex-start;
  margin-top: 0.25rem;
  cursor: pointer;
}
```

- [ ] **Step 2: Create `src/pages/TrainerPage.jsx`**

```jsx
import { useState } from 'react'
import { scenarios } from '../data/scenarios'
import styles from './TrainerPage.module.css'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeQueue() {
  return shuffle(scenarios.map((_, i) => i))
}

const RED_SUITS = new Set(['♥', '♦'])

function CardDisplay({ text }) {
  return (
    <div className={styles.cards}>
      {text.split(' ').map((card, i) => {
        const suit = card.slice(-1)
        return (
          <span key={i} className={`${styles.cardToken} ${RED_SUITS.has(suit) ? styles.redSuit : ''}`}>
            {card}
          </span>
        )
      })}
    </div>
  )
}

export default function TrainerPage() {
  const [queue, setQueue]       = useState(makeQueue)
  const [qIdx, setQIdx]         = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore]       = useState({ correct: 0, total: 0 })

  const scenario = scenarios[queue[qIdx]]
  const answered = selected !== null

  function pick(option) {
    if (answered) return
    setSelected(option)
    setScore(s => ({
      correct: s.correct + (option === scenario.correct ? 1 : 0),
      total: s.total + 1,
    }))
  }

  function next() {
    const nextIdx = qIdx + 1
    if (nextIdx >= queue.length) {
      setQueue(makeQueue())
      setQIdx(0)
    } else {
      setQIdx(nextIdx)
    }
    setSelected(null)
  }

  const isCorrect = selected === scenario.correct

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>GTO Trainer</h1>
        {score.total > 0 && (
          <span className={styles.score}>{score.correct}/{score.total}</span>
        )}
      </div>

      <span className={`${styles.badge} ${scenario.category === 'preflop' ? styles.pre : styles.post}`}>
        {scenario.category}
      </span>

      <div className={styles.situationCard}>
        <p className={styles.situation}>{scenario.situation}</p>
        <div className={styles.hands}>
          <div>
            <p className={styles.handLabel}>Your hand</p>
            <CardDisplay text={scenario.hand} />
          </div>
          {scenario.board && (
            <div>
              <p className={styles.handLabel}>Board</p>
              <CardDisplay text={scenario.board} />
            </div>
          )}
        </div>
      </div>

      <div className={styles.options}>
        {scenario.options.map(opt => {
          let state = ''
          if (answered) {
            if (opt === scenario.correct) state = styles.correct
            else if (opt === selected)    state = styles.wrong
            else                          state = styles.dim
          }
          return (
            <button
              key={opt}
              className={`${styles.optBtn} ${state}`}
              onClick={() => pick(opt)}
              disabled={answered}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {answered && (
        <div className={`${styles.feedback} ${isCorrect ? styles.feedbackCorrect : styles.feedbackWrong}`}>
          <p className={styles.feedbackTitle}>
            {isCorrect ? '✓ Correct' : '✗ Incorrect — the correct play is: ' + scenario.correct}
          </p>
          <p className={styles.explanation}>{scenario.explanation}</p>
          <button className={styles.nextBtn} onClick={next}>Next hand →</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify the app builds without errors**

```bash
npm run build 2>&1 | tail -5
```

Expected: output ends with no errors and shows `dist/` file sizes.

- [ ] **Step 4: Commit**

```bash
git add src/pages/TrainerPage.jsx src/pages/TrainerPage.module.css
git commit -m "feat: add TrainerPage component with quiz flow"
```

---

## Task 3: Wire up the route and navigation

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Layout.jsx`

### Current `src/App.jsx` (for reference):

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import NewSession from './pages/NewSession'
import SessionDetail from './pages/SessionDetail'
import PlayerPage from './pages/PlayerPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"              element={<Dashboard />} />
          <Route path="/sessions"      element={<Sessions />} />
          <Route path="/sessions/new"  element={<NewSession />} />
          <Route path="/sessions/:id"  element={<SessionDetail />} />
          <Route path="/players/:id"   element={<PlayerPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

### Current `src/components/Layout.jsx` menu section (for reference):

```jsx
{menuOpen && (
  <nav className={styles.menu}>
    <button className={styles.menuItem} onClick={() => go('/')}>Home</button>
    <button className={styles.menuItem} onClick={() => go('/sessions')}>Sessions</button>
  </nav>
)}
```

- [ ] **Step 1: Add the `/trainer` route to `src/App.jsx`**

Replace the full file with:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import NewSession from './pages/NewSession'
import SessionDetail from './pages/SessionDetail'
import PlayerPage from './pages/PlayerPage'
import TrainerPage from './pages/TrainerPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"              element={<Dashboard />} />
          <Route path="/sessions"      element={<Sessions />} />
          <Route path="/sessions/new"  element={<NewSession />} />
          <Route path="/sessions/:id"  element={<SessionDetail />} />
          <Route path="/players/:id"   element={<PlayerPage />} />
          <Route path="/trainer"       element={<TrainerPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Add "GTO Trainer" to the hamburger menu in `src/components/Layout.jsx`**

Find this block:
```jsx
{menuOpen && (
  <nav className={styles.menu}>
    <button className={styles.menuItem} onClick={() => go('/')}>Home</button>
    <button className={styles.menuItem} onClick={() => go('/sessions')}>Sessions</button>
  </nav>
)}
```

Replace it with:
```jsx
{menuOpen && (
  <nav className={styles.menu}>
    <button className={styles.menuItem} onClick={() => go('/')}>Home</button>
    <button className={styles.menuItem} onClick={() => go('/sessions')}>Sessions</button>
    <button className={styles.menuItem} onClick={() => go('/trainer')}>GTO Trainer</button>
  </nav>
)}
```

- [ ] **Step 3: Run the full test suite**

```bash
npm test
```

Expected: all tests pass (scenarios + settlement).

- [ ] **Step 4: Start the dev server and manually verify**

```bash
npm run dev
```

Check:
1. Open the hamburger menu — "GTO Trainer" appears as the third item
2. Tap "GTO Trainer" — navigates to `/trainer`
3. A scenario loads with category badge, situation text, hand cards, and option buttons
4. Tap a wrong answer — that button turns red, correct button turns green, dimmed buttons appear, explanation is shown, "Next hand →" button appears
5. Tap a correct answer — button turns green, explanation shown
6. Tap "Next hand →" — new scenario loads, buttons reset
7. Score counter appears in the header after first answer
8. After answering all 40 scenarios, the queue reshuffles and continues

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/components/Layout.jsx
git commit -m "feat: wire GTO trainer route and add to nav menu"
```

- [ ] **Step 6: Push**

```bash
git push
```
