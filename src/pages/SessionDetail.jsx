import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { usePlayers } from '../hooks/usePlayers'
import { computeSettlement } from '../lib/settlement'
import LoadingState      from '../components/LoadingState'
import ErrorBanner       from '../components/ErrorBanner'
import SettlementDisplay from '../components/SettlementDisplay'
import SessionBarChart   from '../components/SessionBarChart'
import styles from './SessionDetail.module.css'

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, entries, loading, error, addEntry, updateEntry, closeSession, deleteEntry } = useSession(id)
  const { players, addPlayer } = usePlayers()
  const [mutErr, setMutErr]   = useState(null)
  const [newName, setNewName] = useState('')
  const [saving, setSaving]   = useState(false)

  if (loading) return <LoadingState rows={6} />
  if (!session) return <p style={{ color: 'var(--text-muted)', padding: '2rem' }}>Session not found.</p>

  const isOpen = session.status === 'open'
  const allCashedOut = entries.length > 0 && entries.every(e => e.cashout !== null)
  const addedIds = new Set(entries.map(e => e.player_id))

  const settlement = !isOpen
    ? computeSettlement(entries.map(e => ({ name: e.playerName, totalBuyin: e.total_buyin, cashout: e.cashout ?? 0 })))
    : []

  async function handleUpdateBuyin(entryId, val) {
    const n = parseFloat(val)
    if (isNaN(n)) return
    setMutErr(null)
    try { await updateEntry(entryId, { total_buyin: n }) } catch (e) { setMutErr(e.message) }
  }

  async function handleUpdateCashout(entryId, val) {
    const n = parseFloat(val)
    if (isNaN(n)) return
    setMutErr(null)
    try { await updateEntry(entryId, { cashout: n }) } catch (e) { setMutErr(e.message) }
  }

  async function handleClose() {
    setSaving(true); setMutErr(null)
    try { await closeSession() } catch (e) { setMutErr(e.message) } finally { setSaving(false) }
  }

  async function handleAddPlayer(pid) {
    setMutErr(null)
    try { await addEntry(pid) } catch (e) { setMutErr(e.message) }
  }

  async function handleAddNewPlayer() {
    if (!newName.trim()) return
    setSaving(true); setMutErr(null)
    try { await addPlayer(newName.trim()); setNewName('') } catch (e) { setMutErr(e.message) } finally { setSaving(false) }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <button
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontSize: '0.875rem', marginBottom: '0.25rem' }}
            onClick={() => navigate('/sessions')}
          >
            ← Sessions
          </button>
          <h1 className={styles.title}>{session.name}</h1>
          <span className={styles.meta}>
            {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
          </span>
          <span className={`${styles.badge} ${styles[session.status]}`}>{session.status}</span>
        </div>
      </div>

      <ErrorBanner message={error || mutErr} />

      <span className={styles.sectionTitle}>Players</span>
      <div className={styles.entriesTable}>
        <div className={styles.tableHead}>
          <span className={styles.th}>Player</span>
          <span className={styles.th}>Buy-in</span>
          <span className={styles.th}>Cash-out</span>
          <span className={styles.th}>Net</span>
        </div>
        {entries.map(e => {
          const net = e.cashout !== null ? e.cashout - e.total_buyin : null
          return (
            <div
              key={e.id}
              className={styles.entryRow}
              onClick={() => navigate(`/players/${e.player_id}`)}
            >
              <span className={styles.playerName}>{e.playerName}</span>
              <div onClick={ev => ev.stopPropagation()} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {isOpen ? (
                  <input
                    className={styles.amountInput}
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={e.total_buyin}
                    onBlur={ev => handleUpdateBuyin(e.id, ev.target.value)}
                  />
                ) : (
                  <span className={styles.amount}>${e.total_buyin.toFixed(2)}</span>
                )}
              </div>
              <div onClick={ev => ev.stopPropagation()} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {isOpen ? (
                  <input
                    className={styles.amountInput}
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={e.cashout ?? ''}
                    placeholder="—"
                    onBlur={ev => handleUpdateCashout(e.id, ev.target.value)}
                  />
                ) : (
                  <span className={styles.amount}>{e.cashout !== null ? `$${e.cashout.toFixed(2)}` : '—'}</span>
                )}
              </div>
              <span
                className={styles.netAmount}
                style={{ color: net === null ? 'var(--text-muted)' : net >= 0 ? 'var(--green)' : 'var(--red)' }}
              >
                {net === null ? '—' : `${net >= 0 ? '+' : ''}$${Math.abs(net).toFixed(2)}`}
              </span>
            </div>
          )
        })}
      </div>

      {isOpen && (
        <div className={styles.addPlayerSection}>
          <span className={styles.sectionTitle}>Add Player</span>
          <div className={styles.playerPicker}>
            {players.map(p => (
              <button
                key={p.id}
                className={styles.pickerBtn}
                disabled={addedIds.has(p.id)}
                onClick={() => handleAddPlayer(p.id)}
              >
                {p.name} {addedIds.has(p.id) ? '✓' : ''}
              </button>
            ))}
          </div>
          <div className={styles.newPlayerRow}>
            <input
              className={styles.textInput}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="New player name"
              onKeyDown={e => e.key === 'Enter' && handleAddNewPlayer()}
            />
            <button className={styles.addBtn} onClick={handleAddNewPlayer} disabled={!newName.trim()}>
              + Add
            </button>
          </div>
          <button
            className={styles.closeBtn}
            disabled={!allCashedOut || saving}
            onClick={handleClose}
          >
            {saving ? 'Closing…' : 'Close & Settle'}
          </button>
          {!allCashedOut && entries.length > 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center' }}>
              Enter all cash-out amounts to close the session.
            </p>
          )}
        </div>
      )}

      {!isOpen && (
        <>
          <span className={styles.sectionTitle}>Settlement</span>
          <SettlementDisplay transactions={settlement} />
          <span className={styles.sectionTitle}>Session Results</span>
          <SessionBarChart entries={entries} />
        </>
      )}
    </div>
  )
}
