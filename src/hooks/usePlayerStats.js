import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { GROUP_ID } from '../lib/constants'

export function usePlayerStats(playerId) {
  const [player,  setPlayer]  = useState(null)
  const [stats,   setStats]   = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!playerId) return
    let mounted = true

    async function load() {
      const [{ data: playerData, error: pErr }, { data: entries, error: eErr }] = await Promise.all([
        supabase.from('players').select('*').eq('id', playerId).single(),
        supabase
          .from('session_entries')
          .select('total_buyin, cashout, sessions(id, name, date, status, group_id)')
          .eq('player_id', playerId),
      ])

      if (!mounted) return

      if (pErr || eErr) {
        setError((pErr || eErr).message)
        setLoading(false)
        return
      }

      setPlayer(playerData)

      // Only closed sessions belonging to this group
      const closed = entries
        .filter(e => e.cashout !== null && e.sessions.status === 'closed' && e.sessions.group_id === GROUP_ID)
        .sort((a, b) => new Date(a.sessions.date) - new Date(b.sessions.date))

      let cumulative = 0
      const hist = closed.map(e => {
        const profit = Math.round((e.cashout - e.total_buyin) * 100) / 100
        cumulative = Math.round((cumulative + profit) * 100) / 100
        return {
          sessionId:   e.sessions.id,
          sessionName: e.sessions.name,
          date:        e.sessions.date,
          profit,
          cumulative,
          buyin:   e.total_buyin,
          cashout: e.cashout,
        }
      })

      const profits = hist.map(h => h.profit)
      const sessionsPlayed = profits.length
      const totalProfit    = Math.round(profits.reduce((s, p) => s + p, 0) * 100) / 100
      const biggestWin     = sessionsPlayed > 0 ? Math.max(...profits) : 0
      const biggestLoss    = sessionsPlayed > 0 ? Math.min(...profits) : 0
      const wins           = profits.filter(p => p > 0).length
      const winRate        = sessionsPlayed > 0 ? wins / sessionsPlayed : 0
      const avgProfit      = sessionsPlayed > 0 ? Math.round((totalProfit / sessionsPlayed) * 100) / 100 : 0

      setHistory(hist)
      setStats({ totalProfit, biggestWin, biggestLoss, sessionsPlayed, winRate, avgProfit })
      setLoading(false)
    }

    load()
    return () => { mounted = false }
  }, [playerId])

  return { player, stats, history, loading, error }
}
