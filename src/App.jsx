import { Routes, Route, Navigate } from 'react-router-dom'
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

function AppInner() {
  const { token, user, logout } = useGH()
  const { toasts, toast } = useToast()

  if (!token || !user) return <LoginPage />

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar user={user} onLogout={logout} />
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: '36px 40px',
        background: 'var(--bg)',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <Routes>
            <Route path="/github-notifications" element={<NotificationsPage />} />
            <Route path="/github-notifications/bulk-watch" element={<BulkWatchPage />} />
            <Route path="/github-notifications/visibility" element={<VisibilityPage />} />
            <Route path="/github-notifications/topics" element={<TopicsPage />} />
            <Route path="/github-notifications/stars" element={<StarsPage />} />
            <Route path="/github-notifications/webhooks" element={<WebhooksPage />} />
            <Route path="/github-notifications/archive" element={<ArchivePage />} />
            <Route path="*" element={<Navigate to="/github-notifications" replace />} />
          </Routes>
        </div>
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
