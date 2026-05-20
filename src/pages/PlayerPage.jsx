import { useParams, useNavigate } from 'react-router-dom'
import { usePlayerStats } from '../hooks/usePlayerStats'
import LoadingState from '../components/LoadingState'
import ErrorBanner  from '../components/ErrorBanner'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import styles from './PlayerPage.module.css'

function fmt(n, showSign = true) {
  const abs = Math.abs(n).toFixed(2)
  if (!showSign) return `$${abs}`
  return n >= 0 ? `+$${abs}` : `-$${abs}`
}

export default function PlayerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { player, stats, history, loading, error } = usePlayerStats(id)

  if (loading) return <LoadingState rows={8} />

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate('/')}>← Leaderboard</button>

      <ErrorBanner message={error} />

      {player && <h1 className={styles.name}>{player.name}</h1>}

      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total P&amp;L</span>
            <span className={`${styles.statValue} ${stats.totalProfit >= 0 ? 'profit' : 'loss'}`}>
              {fmt(stats.totalProfit)}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Sessions</span>
            <span className={styles.statValue}>{stats.sessionsPlayed}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Win Rate</span>
            <span className={styles.statValue}>{(stats.winRate * 100).toFixed(0)}%</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Avg / Session</span>
            <span className={`${styles.statValue} ${stats.avgProfit >= 0 ? 'profit' : 'loss'}`}>
              {fmt(stats.avgProfit)}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Best Session</span>
            <span className={`${styles.statValue} profit`}>{fmt(stats.biggestWin)}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Worst Session</span>
            <span className={`${styles.statValue} ${stats.biggestLoss < 0 ? 'loss' : 'profit'}`}>
              {fmt(stats.biggestLoss, false)}
            </span>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <>
          <span className={styles.sectionTitle}>Cumulative P&amp;L</span>
          <div className={styles.card}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={history} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="sessionName"
                  tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${v}`}
                />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }}
                  formatter={(v) => [`$${Number(v).toFixed(2)}`]}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="var(--gold)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--gold)', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {history.length > 0 && (
        <>
          <span className={styles.sectionTitle}>Session History</span>
          <div className={styles.historyTable}>
            <div className={styles.historyHead}>
              <span className={styles.th}>Session</span>
              <span className={styles.th}>Buy-in</span>
              <span className={styles.th}>Cash-out</span>
              <span className={styles.th}>Net</span>
            </div>
            {[...history].reverse().map(h => (
              <div key={h.sessionId} className={styles.historyRow} onClick={() => navigate(`/sessions/${h.sessionId}`)}>
                <div>
                  <div className={styles.sessionName}>{h.sessionName}</div>
                  <div className={styles.sessionDate}>
                    {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                  </div>
                </div>
                <span className={styles.mono}>${h.buyin.toFixed(2)}</span>
                <span className={styles.mono}>${h.cashout.toFixed(2)}</span>
                <span className={`${styles.mono} ${h.profit >= 0 ? 'profit' : 'loss'}`}>
                  {fmt(h.profit)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {history.length === 0 && !loading && (
        <p className={styles.emptyState}>No closed sessions yet.</p>
      )}
    </div>
  )
}
