import { useNavigate } from 'react-router-dom'
import { useSessions } from '../hooks/useSessions'
import LoadingState from '../components/LoadingState'
import ErrorBanner  from '../components/ErrorBanner'
import styles from './Sessions.module.css'

export default function Sessions() {
  const navigate = useNavigate()
  const { sessions, loading, error } = useSessions()

  if (loading) return <LoadingState rows={5} />

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Sessions</h1>
        <button className={styles.newBtn} onClick={() => navigate('/sessions/new')}>
          + New
        </button>
      </div>

      <ErrorBanner message={error} />

      {sessions.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No sessions yet</p>
          <p>Create your first game to get started.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {sessions.map(s => {
            const pot = s.session_entries?.reduce((sum, e) => sum + e.total_buyin, 0) ?? 0
            const playerCount = s.session_entries?.length ?? 0
            return (
              <div key={s.id} className={styles.sessionCard} onClick={() => navigate(`/sessions/${s.id}`)}>
                <div className={styles.cardTop}>
                  <span className={styles.name}>{s.name}</span>
                  <span className={`${styles.badge} ${styles[s.status]}`}>{s.status}</span>
                </div>
                <div className={styles.meta}>
                  <span>{new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>
                  <span>{playerCount} player{playerCount !== 1 ? 's' : ''}</span>
                  <span className={styles.pot}>${pot.toFixed(2)} pot</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
