import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { GHProvider, useGH } from './context/GHContext'
import { useToast } from './hooks/useToast'
import ToastContainer from './components/ToastContainer'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import NotificationsPage from './pages/NotificationsPage'
import BulkWatchPage from './pages/BulkWatchPage'
import VisibilityPage from './pages/VisibilityPage'
import TopicsPage from './pages/TopicsPage'
import StarsPage from './pages/StarsPage'
import WebhooksPage from './pages/WebhooksPage'
import ArchivePage from './pages/ArchivePage'
import StreakViewerPage from './pages/StreakViewerPage'
import RepoHealthPage from './pages/RepoHealthPage'

function AppInner() {
  const { token, user, logout } = useGH()
  const { toasts } = useToast()

  if (!token || !user) return <LoginPage />

  return (
    <div className="app-root">
      <Sidebar user={user} onLogout={logout} />
      <main className="app-main">
        <Routes>
          <Route path="/github-notifications"            element={<div className="app-page"><NotificationsPage /></div>} />
          <Route path="/github-notifications/streak"     element={<StreakViewerPage />} />
          <Route path="/github-notifications/bulk-watch" element={<div className="app-page"><BulkWatchPage /></div>} />
          <Route path="/github-notifications/visibility" element={<div className="app-page"><VisibilityPage /></div>} />
          <Route path="/github-notifications/topics"     element={<div className="app-page"><TopicsPage /></div>} />
          <Route path="/github-notifications/stars"      element={<div className="app-page"><StarsPage /></div>} />
          <Route path="/github-notifications/webhooks"   element={<div className="app-page"><WebhooksPage /></div>} />
          <Route path="/github-notifications/archive"    element={<div className="app-page"><ArchivePage /></div>} />
          <Route path="/github-notifications/health"     element={<div className="app-page"><RepoHealthPage /></div>} />
          <Route path="*"                                element={<Navigate to="/github-notifications" replace />} />
        </Routes>
      </main>
      <ToastContainer toasts={toasts} />
    </div>
  )
}

export default function App() {
  return (
    <GHProvider>
      <AppInner />
    </GHProvider>
  )
}
