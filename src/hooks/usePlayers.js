import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { GROUP_ID } from '../lib/constants'

export function usePlayers() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('group_id', GROUP_ID)
        .order('name')

      if (!mounted) return
      if (error) setError(error.message)
      else { setError(null); setPlayers(data) }
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel('players-all')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `group_id=eq.${GROUP_ID}` },
        load
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  async function addPlayer(name) {
    const { error } = await supabase
      .from('players')
      .insert({ name: name.trim(), group_id: GROUP_ID })
    if (error) throw new Error(error.message)
  }

  return { players, loading, error, addPlayer }
}
