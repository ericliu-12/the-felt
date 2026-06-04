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

  const height = Math.max(180, data.length * 40)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <XAxis
          type="number"
          tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${v}`}
        />
        <Tooltip
          contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }}
          labelStyle={{ color: 'var(--text)' }}
          itemStyle={{ color: 'var(--text)' }}
          formatter={v => [`$${Number(v).toFixed(2)}`, 'Profit']}
        />
        <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.profit >= 0 ? 'var(--green)' : 'var(--red)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
