import styles from './LoadingState.module.css'

export default function LoadingState({ rows = 4 }) {
  return (
    <div className={styles.container}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className={styles.bar}
          style={{ width: `${70 + (i % 3) * 10}%`, opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  )
}
