import styles from './SettlementDisplay.module.css'

export default function SettlementDisplay({ transactions }) {
  if (!transactions?.length) {
    return <p className={styles.empty}>Everyone is square — no payments needed.</p>
  }
  return (
    <div className={styles.list}>
      {transactions.map((t, i) => (
        <div key={i} className={styles.item}>
          <span className={styles.from}>{t.from}</span>
          <span className={styles.verb}>pays</span>
          <span className={styles.to}>{t.to}</span>
          <span className={styles.amount}>${t.amount.toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}
