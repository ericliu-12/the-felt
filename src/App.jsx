import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import NewSession from './pages/NewSession'
import SessionDetail from './pages/SessionDetail'
import PlayerPage from './pages/PlayerPage'
import TrainerPage from './pages/TrainerPage'
import { useAdminMode } from './hooks/useAdminMode'

function AdminRoute({ element }) {
  const { isAdmin } = useAdminMode()
  return isAdmin ? element : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"              element={<Dashboard />} />
          <Route path="/sessions"      element={<Sessions />} />
          <Route path="/sessions/new"  element={<NewSession />} />
          <Route path="/sessions/:id"  element={<SessionDetail />} />
          <Route path="/players/:id"   element={<PlayerPage />} />
          <Route path="/trainer"       element={<AdminRoute element={<TrainerPage />} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
