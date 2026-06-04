import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAdminMode } from '../hooks/useAdminMode'
import AdminModal from './AdminModal'
import styles from './Layout.module.css'

export default function Layout() {
  const { isAdmin, unlock, lock } = useAdminMode()
  const [modalOpen, setModalOpen] = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const navigate = useNavigate()

  function go(path) {
    setMenuOpen(false)
    navigate(path)
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button className={styles.logo} onClick={() => go('/')}>The Felt</button>
        <div className={styles.headerRight}>
          <button
            className={`${styles.adminBtn} ${isAdmin ? styles.adminActive : ''}`}
            onClick={() => isAdmin ? lock() : setModalOpen(true)}
          >
            Admin
          </button>
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <span className={`${styles.bar} ${menuOpen ? styles.barTop : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barMid : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.barBot : ''}`} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className={styles.menu}>
          <button className={styles.menuItem} onClick={() => go('/')}>Home</button>
          <button className={styles.menuItem} onClick={() => go('/sessions')}>Sessions</button>
        </nav>
      )}

      <main className={styles.main}>
        <Outlet />
      </main>

      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onUnlock={unlock}
      />
    </div>
  )
}
