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
