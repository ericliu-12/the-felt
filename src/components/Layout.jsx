import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAdminMode } from '../hooks/useAdminMode'
import AdminModal from './AdminModal'
import styles from './Layout.module.css'

export default function Layout() {
  const { isAdmin, unlock, lock } = useAdminMode()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.logo}>The Felt</span>
        <button
          className={`${styles.adminBtn} ${isAdmin ? styles.adminActive : ''}`}
          onClick={() => isAdmin ? lock() : setModalOpen(true)}
        >
          {isAdmin ? 'Admin' : 'Admin'}
        </button>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <nav className={styles.bottomNav}>
        <NavLink to="/" end className={({ isActive }) => isActive ? styles.active : ''}>
          Home
        </NavLink>
        <NavLink to="/sessions" className={({ isActive }) => isActive ? styles.active : ''}>
          Sessions
        </NavLink>
      </nav>
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onUnlock={unlock}
      />
    </div>
  )
}
