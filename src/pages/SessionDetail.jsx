import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSession }    from '../hooks/useSession'
import { usePlayers }    from '../hooks/usePlayers'
import { useAdminMode }  from '../hooks/useAdminMode'
import { computeSettlement } from '../lib/settlement'
import { prepareCardEntries } from '../lib/shareCard'
import html2canvas from 'html2canvas'
import LoadingState      from '../components/LoadingState'
import ErrorBanner       from '../components/ErrorBanner'
import SettlementDisplay from '../components/SettlementDisplay'
import SessionBarChart   from '../components/SessionBarChart'
import ShareCard         from '../components/ShareCard'
import styles from './SessionDetail.module.css'

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, entries, loading, error, addEntry, updateEntry, closeSession, renameSession, reopenSession } = useSession(id)
  const { players, addPlayer } = usePlayers()
  const { isAdmin } = useAdminMode()
  const [mutErr, setMutErr]       = useState(null)
  const [newName, setNewName]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [renaming, setRenaming]   = useState(false)
  const [renameVal, setRenameVal] = useState('')
  const [sharing, setSharing]   = useState(false)
  const [copying, setCopying]   = useState(false)
  const cardRef = useRef(null)

  if (loading) return <LoadingState rows={6} />
  if (!session) return <p style={{ color: 'var(--text-muted)', padding: '2rem' }}>Session not found.</p>

  const isOpen = session.status === 'open'
  const allCashedOut = entries.length > 0 && entries.every(e => e.cashout !== null)
  const addedIds = new Set(entries.map(e => e.player_id))

  const totalIn = entries.reduce((s, e) => s + e.total_buyin, 0)
  const totalOut = entries.reduce((s, e) => s + (e.cashout ?? 0), 0)
  const balanceDiff = Math.round((totalOut - totalIn) * 100) / 100

  const settlement = !isOpen
    ? computeSettlement(entries.map(e => ({ name: e.playerName, totalBuyin: e.total_buyin, cashout: e.cashout ?? 0 })))
    : []

  const cardEntries = !isOpen ? prepareCardEntries(entries) : []
  const cardDate = new Date(session.date).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })

  async function handleUpdateBuyin(entryId, val) {
    const n = parseFloat(val)
    if (isNaN(n) || n < 0) return
    setMutErr(null)
    try { await updateEntry(entryId, { total_buyin: n }) } catch (e) { setMutErr(e.message) }
  }

  async function handleUpdateCashout(entryId, val) {
    const n = parseFloat(val)
    if (isNaN(n) || n < 0) return
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

  async function handleRename() {
    if (!renameVal.trim() || renameVal.trim() === session.name) { setRenaming(false); return }
    setSaving(true); setMutErr(null)
    try { await renameSession(renameVal); setRenaming(false) } catch (e) { setMutErr(e.message) } finally { setSaving(false) }
  }

  async function handleReopen() {
    if (!confirm('Reopen this session? Players will be able to edit cash-outs again.')) return
    setSaving(true); setMutErr(null)
    try { await reopenSession() } catch (e) { setMutErr(e.message) } finally { setSaving(false) }
  }

  async function handleShare() {
    if (sharing) return
    setSharing(true)
    try {
      await document.fonts.ready
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#1a1a1a' })
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      const safeName = session.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      const file = new File([blob], `the-felt-${safeName}.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: session.name })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setSharing(false)
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopying(true)
      setTimeout(() => setCopying(false), 2000)
    } catch {
      // clipboard unavailable — fail silently
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <button className={styles.backBtn} onClick={() => navigate('/sessions')}>
            ← Sessions
          </button>
          {renaming ? (
            <div className={styles.renameRow}>
              <input
                className={styles.renameInput}
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false) }}
                autoFocus
              />
              <button className={styles.renameSave} onClick={handleRename} disabled={saving}>Save</button>
              <button className={styles.renameCancel} onClick={() => setRenaming(false)}>Cancel</button>
            </div>
          ) : (
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{session.name}</h1>
              {isAdmin && (
                <button className={styles.editBtn} onClick={() => { setRenameVal(session.name); setRenaming(true) }}>
                  Edit
                </button>
              )}
            </div>
          )}
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
                    type="number" min="0" step="0.01"
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
                    type="number" min="0" step="0.01"
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
                {net === null ? '—' : net >= 0 ? `+$${net.toFixed(2)}` : `-$${Math.abs(net).toFixed(2)}`}
              </span>
            </div>
          )
        })}
      </div>

      {isOpen && entries.length > 0 && (
        <div className={styles.balanceRow}>
          <div>
            <span className={styles.balanceLabel}>In</span>
            ${totalIn.toFixed(2)}
          </div>
          <div style={{ textAlign: 'center' }}>
            <span className={styles.balanceLabel}>Out</span>
            ${totalOut.toFixed(2)}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={styles.balanceLabel}>Diff</span>
            <span style={{ color: balanceDiff === 0 ? 'var(--green)' : 'var(--red)' }}>
              {balanceDiff === 0 ? '✓ $0.00' : `${balanceDiff > 0 ? '+' : '-'}$${Math.abs(balanceDiff).toFixed(2)}`}
            </span>
          </div>
        </div>
      )}

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
          <button className={styles.closeBtn} disabled={!allCashedOut || saving} onClick={handleClose}>
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
          {entries.length > 0 && (
            <div className={`${styles.discrepancyBadge} ${balanceDiff === 0 ? styles.balanced : styles.discrepancy}`}>
              {balanceDiff === 0
                ? 'Balanced — totals match'
                : `Discrepancy: ${balanceDiff > 0 ? '+' : '-'}$${Math.abs(balanceDiff).toFixed(2)} (in $${totalIn.toFixed(2)}, out $${totalOut.toFixed(2)})`
              }
            </div>
          )}
          <span className={styles.sectionTitle}>Settlement</span>
          <SettlementDisplay transactions={settlement} />
          <div className={styles.shareRow}>
            <button className={styles.shareBtn} onClick={handleShare} disabled={sharing}>
              {sharing ? 'Preparing…' : 'Share Image'}
            </button>
            <button className={styles.shareBtn} onClick={handleCopyLink}>
              {copying ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <span className={styles.sectionTitle}>Session Results</span>
          <SessionBarChart entries={entries} />
          {isAdmin && (
            <button className={styles.reopenBtn} onClick={handleReopen} disabled={saving}>
              {saving ? 'Reopening…' : 'Reopen Session'}
            </button>
          )}
          <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none' }}>
            <ShareCard
              ref={cardRef}
              sessionName={session.name}
              date={cardDate}
              entries={cardEntries}
              totalPot={totalIn}
              settlement={settlement}
            />
          </div>
        </>
      )}
    </div>
  )
}
