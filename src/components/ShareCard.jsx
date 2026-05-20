import { forwardRef } from 'react'
import styles from './ShareCard.module.css'

const ShareCard = forwardRef(function ShareCard({ sessionName, date, entries, totalPot, settlement }, ref) {
  const winner = entries[0] ?? null

  return (
    <div ref={ref} className={styles.card}>
      <div className={styles.header}>
        <span className={styles.brand}>THE FELT</span>
        <span className={styles.sessionMeta}>{sessionName} · {date}</span>
      </div>

      {winner && (
        <div className={styles.winnerRow}>
          <span className={styles.trophy}>🏆</span>
          <span className={styles.winnerName}>{winner.name}</span>
          <span className={styles.winnerNet}>
            {winner.net >= 0
              ? `+$${winner.net.toFixed(2)}`
              : `-$${Math.abs(winner.net).toFixed(2)}`}
          </span>
        </div>
      )}

      <div className={styles.divider} />

      <div className={styles.playerList}>
        {entries.map((e, i) => (
          <div key={i} className={styles.playerRow}>
            <span className={styles.rank}>{i + 1}.</span>
            <span className={styles.playerName}>{e.name}</span>
            <span
              className={styles.net}
              style={{ color: e.net >= 0 ? '#4caf7d' : '#e05252' }}
            >
              {e.net >= 0
                ? `+$${e.net.toFixed(2)}`
                : `-$${Math.abs(e.net).toFixed(2)}`}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.divider} />

      <div className={styles.potRow}>
        <span className={styles.potLabel}>Pot</span>
        <span className={styles.potAmount}>${totalPot.toFixed(2)}</span>
      </div>

      {settlement.length > 0 && (
        <>
          <div className={styles.divider} />
          <div className={styles.settlementSection}>
            <span className={styles.settlementTitle}>Settlements</span>
            {settlement.map((t, i) => (
              <div key={i} className={styles.settlementRow}>
                <span className={styles.settleName}>{t.from}</span>
                <span className={styles.settleArrow}>→</span>
                <span className={styles.settleName}>{t.to}</span>
                <span className={styles.settleAmount}>${t.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
})

export default ShareCard
