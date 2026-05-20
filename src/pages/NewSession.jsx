import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessions }  from '../hooks/useSessions'
import { usePlayers }   from '../hooks/usePlayers'
import { useSession }   from '../hooks/useSession'
import { computeSettlement } from '../lib/settlement'
import SettlementDisplay from '../components/SettlementDisplay'
import ErrorBanner from '../components/ErrorBanner'
import styles from './NewSession.module.css'

const STEP_LABELS = ['Name & Date', 'Add Players', 'Cash Outs', 'Settlement']

export default function NewSession() {
  const navigate = useNavigate()
  const [step, setStep]           = useState(1)
  const [sessionId, setSessionId] = useState(null)
  const [name, setName]           = useState('')
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10))
  const [mutErr, setMutErr]       = useState(null)
  const [saving, setSaving]       = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')

  const { createSession } = useSessions()
  const { players, addPlayer } = usePlayers()
  const { entries, addEntry, updateEntry, closeSession, deleteEntry } =
    useSession(sessionId)

  async function handleStep1() {
    if (!name.trim()) return
    setSaving(true)
    setMutErr(null)
    try {
      const s = await createSession(name, date)
      setSessionId(s.id)
      setStep(2)
    } catch (e) {
      setMutErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddExistingPlayer(playerId) {
    const alreadyAdded = entries.some(e => e.player_id === playerId)
    if (alreadyAdded) return
    setMutErr(null)
    try {
      await addEntry(playerId)
    } catch (e) {
      setMutErr(e.message)
    }
  }

  async function handleAddNewPlayer() {
    if (!newPlayerName.trim()) return
    setSaving(true)
    setMutErr(null)
    try {
      await addPlayer(newPlayerName.trim())
      setNewPlayerName('')
    } catch (e) {
      setMutErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleBuyinChange(entryId, value) {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) return
    setMutErr(null)
    try {
      await updateEntry(entryId, { total_buyin: num })
    } catch (e) {
      setMutErr(e.message)
    }
  }

  async function handleCashoutChange(entryId, value) {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) return
    setMutErr(null)
    try {
      await updateEntry(entryId, { cashout: num })
    } catch (e) {
      setMutErr(e.message)
    }
  }

  async function handleClose() {
    setSaving(true)
    setMutErr(null)
    try {
      await closeSession()
      setStep(4)
    } catch (e) {
      setMutErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const allCashedOut = entries.length > 0 && entries.every(e => e.cashout !== null)

  const settlement = step === 4 ? computeSettlement(
    entries.map(e => ({ name: e.playerName, totalBuyin: e.total_buyin, cashout: e.cashout ?? 0 }))
  ) : []

  const addedPlayerIds = new Set(entries.map(e => e.player_id))

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => {
          if (step === 1) navigate('/sessions')
          else if (step > 1 && sessionId) navigate(`/sessions/${sessionId}`)
          else setStep(s => s - 1)
        }}>←</button>
        <div>
          <div className={styles.stepLabel}>Step {step} of 4 — {STEP_LABELS[step - 1]}</div>
        </div>
      </div>

      <div className={styles.steps}>
        {[1, 2, 3, 4].map(n => (
          <div key={n} className={`${styles.stepDot} ${n <= step ? styles.active : ''}`} />
        ))}
      </div>

      <ErrorBanner message={mutErr} />

      {step === 1 && (
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Session Name</label>
            <input
              className={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Friday Night Poker"
              onKeyDown={e => e.key === 'Enter' && handleStep1()}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Date</label>
            <input
              className={styles.input}
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <button className={styles.primaryBtn} onClick={handleStep1} disabled={!name.trim() || saving}>
            {saving ? 'Creating…' : 'Create Session →'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className={styles.form}>
          <div className={styles.playerList}>
            {entries.map(e => (
              <div key={e.id} className={styles.playerRow}>
                <span className={styles.playerRowName}>{e.playerName}</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Buy-in $</span>
                <input
                  className={styles.amountInput}
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={e.total_buyin}
                  onBlur={ev => handleBuyinChange(e.id, ev.target.value)}
                />
                <button className={styles.removeBtn} onClick={() => deleteEntry(e.id)}>×</button>
              </div>
            ))}
          </div>

          <div>
            <div className={styles.label} style={{ marginBottom: '0.375rem' }}>Add from roster</div>
            <div className={styles.existingPlayers}>
              {players.map(p => (
                <button
                  key={p.id}
                  className={styles.existingPlayerBtn}
                  disabled={addedPlayerIds.has(p.id)}
                  onClick={() => handleAddExistingPlayer(p.id)}
                >
                  {p.name} {addedPlayerIds.has(p.id) ? '✓' : ''}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.addPlayerRow}>
            <input
              className={styles.input}
              value={newPlayerName}
              onChange={e => setNewPlayerName(e.target.value)}
              placeholder="New player name"
              onKeyDown={e => e.key === 'Enter' && handleAddNewPlayer()}
            />
            <button className={styles.addBtn} onClick={handleAddNewPlayer} disabled={!newPlayerName.trim() || saving}>
              + Add
            </button>
          </div>

          <button
            className={styles.primaryBtn}
            disabled={entries.length === 0}
            onClick={() => setStep(3)}
          >
            Enter Cash-outs →
          </button>
          <button className={styles.secondaryBtn} onClick={() => navigate(`/sessions/${sessionId}`)}>
            Save & finish later
          </button>
        </div>
      )}

      {step === 3 && (
        <div className={styles.form}>
          <div className={styles.playerList}>
            {entries.map(e => (
              <div key={e.id} className={styles.playerRow}>
                <span className={styles.playerRowName}>{e.playerName}</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Cash-out $</span>
                <input
                  className={styles.amountInput}
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={e.cashout ?? ''}
                  placeholder="—"
                  onBlur={ev => handleCashoutChange(e.id, ev.target.value)}
                />
              </div>
            ))}
          </div>
          <button
            className={styles.primaryBtn}
            disabled={!allCashedOut || saving}
            onClick={handleClose}
          >
            {saving ? 'Settling…' : 'Close & Settle →'}
          </button>
          <button className={styles.secondaryBtn} onClick={() => setStep(2)}>← Back</button>
        </div>
      )}

      {step === 4 && (
        <div className={styles.form}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>Settlement</h2>
          <SettlementDisplay transactions={settlement} />
          <button className={styles.primaryBtn} onClick={() => navigate(`/sessions/${sessionId}`)}>
            View Session →
          </button>
        </div>
      )}
    </div>
  )
}
