import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

const COLORS = [
  '#c9a84c', '#4caf7d', '#e05252', '#7b9fe0', '#e07bb0', '#7be0d4',
  '#e09c5a', '#9b7be0', '#5ae0a0', '#e0d45a', '#5ab8e0', '#e07b5a',
  '#a0e05a', '#e05ab8',
]

const MAX_TOOLTIP = 8

function makeTooltip(hidden) {
  return function CompactTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    const visible = [...payload]
      .filter(e => !hidden.has(e.dataKey))
      .sort((a, b) => b.value - a.value)
    if (!visible.length) return null
    const shown = visible.slice(0, MAX_TOOLTIP)
    const extra = visible.length - shown.length
    return (
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '0.5rem 0.75rem',
        fontSize: 11,
        maxWidth: 200,
        maxHeight: 180,
        overflowY: 'hidden',
        pointerEvents: 'none',
      }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</p>
        {shown.map((entry, i) => (
          <p key={i} style={{ color: entry.color, margin: '0.1rem 0', whiteSpace: 'nowrap' }}>
            {entry.name}: {entry.value >= 0 ? `+$${Number(entry.value).toFixed(2)}` : `-$${Math.abs(entry.value).toFixed(2)}`}
          </p>
        ))}
        {extra > 0 && (
          <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0', fontStyle: 'italic' }}>+{extra} more</p>
        )}
      </div>
    )
  }
}

export default function CumulativeChart({ sessions, players }) {
  const [hidden, setHidden] = useState(new Set())

  const chartData = useMemo(() => {
    const closed = sessions
      .filter(s => s.status === 'closed' && s.session_entries?.length > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    if (!closed.length) return []

    const cumulatives = {}
    players.forEach(p => { cumulatives[p.id] = 0 })

    return closed.map(session => {
      const point = { name: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) }
      players.forEach(p => {
        const entry = session.session_entries?.find(e => e.player_id === p.id)
        if (entry && entry.cashout !== null) {
          cumulatives[p.id] += entry.cashout - entry.total_buyin
        }
        point[p.id] = parseFloat(cumulatives[p.id].toFixed(2))
      })
      return point
    })
  }, [sessions, players])

  function togglePlayer(playerId) {
    setHidden(prev => {
      const next = new Set(prev)
      next.has(playerId) ? next.delete(playerId) : next.add(playerId)
      return next
    })
  }

  if (!chartData.length) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>No closed sessions yet.</p>
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => v < 0 ? `-$${Math.abs(v)}` : `$${v}`}
          />
          <Tooltip content={makeTooltip(hidden)} />
          {players.map((p, idx) => (
            <Line
              key={p.id}
              type="monotone"
              dataKey={p.id}
              name={p.name}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={hidden.has(p.id) ? 0 : 2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 0.625rem', marginTop: '0.625rem', paddingLeft: '0.5rem' }}>
        {players.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => togglePlayer(p.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.125rem 0',
              opacity: hidden.has(p.id) ? 0.3 : 1,
              fontSize: 11,
              color: 'var(--text-muted)',
              transition: 'opacity 0.15s',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[idx % COLORS.length], flexShrink: 0, display: 'inline-block' }} />
            {p.name}
          </button>
        ))}
      </div>
    </div>
  )
}
