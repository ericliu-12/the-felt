import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer,
} from 'recharts'

export default function SessionBarChart({ entries }) {
  const data = entries
    .filter(e => e.cashout !== null)
    .map(e => ({
      name:   e.playerName,
      profit: parseFloat((e.cashout - e.total_buyin).toFixed(2)),
    }))
    .sort((a, b) => b.profit - a.profit)

  if (!data.length) return null

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
          axisLine={false}
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
          formatter={v => [`$${Number(v).toFixed(2)}`, 'Profit']}
        />
        <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.profit >= 0 ? 'var(--green)' : 'var(--red)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
