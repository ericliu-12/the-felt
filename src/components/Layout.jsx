import { Outlet, NavLink } from 'react-router-dom'
import styles from './Layout.module.css'

export default function Layout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.logo}>The Felt</span>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <nav className={styles.bottomNav}>
        <NavLink
          to="/"
          end
          className={({ isActive }) => isActive ? styles.active : ''}
        >
          Home
        </NavLink>
        <NavLink
          to="/sessions"
          className={({ isActive }) => isActive ? styles.active : ''}
        >
          Sessions
        </NavLink>
      </nav>
    </div>
  )
}
