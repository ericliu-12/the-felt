import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSession(id) {
  const [session, setSession] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!id) return
    let mounted = true
    setSession(null)
    setEntries([])
    setLoading(true)

    async function load() {
      const [{ data: s, error: sErr }, { data: e, error: eErr }] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', id).single(),
        supabase.from('session_entries').select('*, players(name)').eq('session_id', id),
      ])

      if (!mounted) return

      if (sErr || eErr) {
        setError((sErr || eErr).message)
      } else {
        setError(null)
        setSession(s)
        setEntries(
          e
            .map(entry => ({ ...entry, playerName: entry.players?.name ?? 'Unknown' }))
            .sort((a, b) => a.playerName.localeCompare(b.playerName) || a.id.localeCompare(b.id))
        )
      }
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel(`session-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions',       filter: `id=eq.${id}` },         load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_entries', filter: `session_id=eq.${id}` }, load)
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [id])

  async function addEntry(playerId) {
    const { error } = await supabase
      .from('session_entries')
      .insert({ session_id: id, player_id: playerId, total_buyin: 0 })
    if (error) throw new Error(error.message)
  }

  async function updateEntry(entryId, updates) {
    const { error } = await supabase
      .from('session_entries')
      .update(updates)
      .eq('id', entryId)
    if (error) throw new Error(error.message)
  }

  async function closeSession() {
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'closed' })
      .eq('id', id)
    if (error) throw new Error(error.message)
  }

  async function deleteEntry(entryId) {
    const { error } = await supabase
      .from('session_entries')
      .delete()
      .eq('id', entryId)
    if (error) throw new Error(error.message)
  }

  return { session, entries, loading, error, addEntry, updateEntry, closeSession, deleteEntry }
}
