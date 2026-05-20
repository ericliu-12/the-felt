import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import NewSession from './pages/NewSession'
import SessionDetail from './pages/SessionDetail'
import PlayerPage from './pages/PlayerPage'

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
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
