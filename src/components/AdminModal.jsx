import { useState } from 'react'
import styles from './AdminModal.module.css'

export default function AdminModal({ isOpen, onClose, onUnlock }) {
  const [pin, setPin]     = useState('')
  const [error, setError] = useState(false)

  if (!isOpen) return null

  function handleSubmit(e) {
    e.preventDefault()
    const ok = onUnlock(pin)
    if (ok) {
      setPin(''); setError(false); onClose()
    } else {
      setError(true); setPin('')
    }
  }

  function handleClose() {
    setPin(''); setError(false); onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>Admin Mode</h2>
        <p className={styles.sub}>Enter PIN to unlock admin actions</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={`${styles.pinInput} ${error ? styles.pinError : ''}`}
            type="password"
            value={pin}
            onChange={e => { setPin(e.target.value); setError(false) }}
            placeholder="••••"
            autoFocus
          />
          {error && <p className={styles.errorMsg}>Incorrect PIN</p>}
          <button className={styles.submitBtn} type="submit" disabled={!pin}>
            Unlock
          </button>
        </form>
      </div>
    </div>
  )
}
