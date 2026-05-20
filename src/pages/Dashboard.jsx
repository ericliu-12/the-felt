import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessions } from '../hooks/useSessions'
import { usePlayers }  from '../hooks/usePlayers'
import LoadingState from '../components/LoadingState'
import ErrorBanner  from '../components/ErrorBanner'
import CumulativeChart from '../components/CumulativeChart'
import SessionBarChart from '../components/SessionBarChart'
import styles from './Dashboard.module.css'

function fmt(n) {
  const s = Math.abs(n).toFixed(2)
  return n >= 0 ? `+$${s}` : `-$${s}`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { sessions, loading: sLoad, error: sErr } = useSessions()
  const { players,  loading: pLoad, error: pErr } = usePlayers()

  const leaderboard = useMemo(() => {
    const totals = {}
    sessions
      .filter(s => s.status === 'closed')
      .forEach(s => {
        s.session_entries?.forEach(e => {
          if (e.cashout !== null) {
            totals[e.player_id] = (totals[e.player_id] || 0) + (e.cashout - e.total_buyin)
          }
        })
      })
    return players
      .map(p => ({ ...p, total: totals[p.id] ?? 0 }))
      .sort((a, b) => b.total - a.total)
  }, [sessions, players])

  const recentSession = sessions[0] ?? null

  if (sLoad || pLoad) return <LoadingState rows={6} />
  const error = sErr || pErr

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>Leaderboard</h1>
        <button className={styles.newBtn} onClick={() => navigate('/sessions/new')}>
          + New Session
        </button>
      </div>

      <ErrorBanner message={error} />

      <div className={`${styles.card} ${styles.leaderboard}`}>
        {leaderboard.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
            No sessions yet. Start one!
          </p>
        )}
        {leaderboard.map((p, idx) => (
          <div key={p.id} className={styles.leaderRow} onClick={() => navigate(`/players/${p.id}`)}>
            <span className={`${styles.rank} ${idx < 3 ? styles.top : ''}`}>{idx + 1}</span>
            <span className={styles.playerName}>{p.name}</span>
            <span className={`${styles.profit} mono ${p.total >= 0 ? 'profit' : 'loss'}`}>
              {fmt(p.total)}
            </span>
          </div>
        ))}
      </div>

      {sessions.length > 0 && (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Cumulative P&amp;L</span>
          <div className={styles.card}>
            <CumulativeChart sessions={sessions} players={players} />
          </div>
        </div>
      )}

      {recentSession && (
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Most Recent Session</span>
          <div
            className={styles.card}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/sessions/${recentSession.id}`)}
          >
            <div className={styles.recentSession}>
              <div className={styles.sessionMeta}>
                <span className={styles.sessionName}>{recentSession.name}</span>
                <span className={`${styles.statusBadge} ${styles[recentSession.status]}`}>
                  {recentSession.status}
                </span>
              </div>
              <div className={styles.sessionStats}>
                <span>{new Date(recentSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>
                <span>{recentSession.session_entries?.length ?? 0} players</span>
                <span className="mono">
                  ${recentSession.session_entries?.reduce((s, e) => s + e.total_buyin, 0).toFixed(2)} pot
                </span>
              </div>
              {recentSession.status === 'closed' && recentSession.session_entries?.length > 0 && (
                <SessionBarChart entries={
                  recentSession.session_entries.map(e => ({
                    ...e,
                    playerName: e.players?.name ?? 'Unknown',
                  }))
                } />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
