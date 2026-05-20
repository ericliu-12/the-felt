import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = ['#c9a84c', '#4caf7d', '#e05252', '#7b9fe0', '#e07bb0', '#7be0d4']

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
      const point = { name: session.name }
      players.forEach(p => {
        const entry = session.session_entries?.find(e => e.player_id === p.id)
        if (entry && entry.cashout !== null) {
          cumulatives[p.id] += entry.cashout - entry.total_buyin
        }
        point[p.name] = parseFloat(cumulatives[p.id].toFixed(2))
      })
      return point
    })
  }, [sessions, players])

  function togglePlayer(playerName) {
    setHidden(prev => {
      const next = new Set(prev)
      next.has(playerName) ? next.delete(playerName) : next.add(playerName)
      return next
    })
  }

  if (!chartData.length) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>No closed sessions yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
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
          tickFormatter={v => `$${v}`}
        />
        <Tooltip
          contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }}
          labelStyle={{ color: 'var(--text-muted)', fontSize: 12 }}
          formatter={(v, name) => [`$${Number(v).toFixed(2)}`, name]}
        />
        <Legend
          onClick={e => togglePlayer(e.value)}
          wrapperStyle={{ fontSize: 12, cursor: 'pointer' }}
        />
        {players.map((p, idx) => (
          <Line
            key={p.id}
            type="monotone"
            dataKey={p.name}
            stroke={COLORS[idx % COLORS.length]}
            strokeWidth={hidden.has(p.name) ? 0 : 2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
