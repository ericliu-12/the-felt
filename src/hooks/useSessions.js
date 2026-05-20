import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { GROUP_ID } from '../lib/constants'

export function useSessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          session_entries(
            id,
            player_id,
            total_buyin,
            cashout,
            players(name)
          )
        `)
        .eq('group_id', GROUP_ID)
        .order('date', { ascending: false })

      if (!mounted) return
      if (error) setError(error.message)
      else { setError(null); setSessions(data) }
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel('sessions-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions',       filter: `group_id=eq.${GROUP_ID}` }, load)
      // session_entries has no group_id column so can't filter server-side; any group's change triggers a reload
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_entries' }, load)
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  async function createSession(name, date) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({ name: name.trim(), date, group_id: GROUP_ID, status: 'open' })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  async function deleteSession(id) {
    const { error } = await supabase.from('sessions').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  return { sessions, loading, error, createSession, deleteSession }
}
