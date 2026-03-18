import { NavLink, useNavigate } from 'react-router-dom'
import { useGH } from '../context/GHContext'
import {
  Bell, Eye, Shield, Tag, Star, GitPullRequest,
  Settings, LogOut, ChevronRight, Zap, Archive
} from 'lucide-react'

const NAV = [
  { to: '/github-notifications', icon: Bell, label: 'Notifications', desc: 'Watch & email alerts' },
  { to: '/github-notifications/bulk-watch', icon: Eye, label: 'Bulk Watch', desc: 'Watch/unwatch all repos' },
  { to: '/github-notifications/visibility', icon: Shield, label: 'Visibility', desc: 'Public ↔ private in bulk' },
  { to: '/github-notifications/topics', icon: Tag, label: 'Topics', desc: 'Tag repos in bulk' },
  { to: '/github-notifications/stars', icon: Star, label: 'Stars', desc: 'Manage starred repos' },
  { to: '/github-notifications/webhooks', icon: Zap, label: 'Webhooks', desc: 'Email on PR & issues' },
  { to: '/github-notifications/archive', icon: Archive, label: 'Bulk Archive', desc: 'Archive inactive repos' },
]

export default function Sidebar({ user, onLogout }) {
  const navigate = useNavigate()

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GitPullRequest size={15} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>GitHub Tools</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>v1.0.0</div>
          </div>
        </div>
      </div>

      {/* User */}
      {user && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={user.avatar_url} alt="" style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.login}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{user.public_repos} repos</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 8px 8px' }}>Tools</div>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/github-notifications'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 'var(--radius-sm)',
              color: isActive ? 'var(--text)' : 'var(--text2)',
              background: isActive ? 'var(--bg4)' : 'transparent',
              marginBottom: 2,
              fontSize: 13, fontWeight: isActive ? 500 : 400,
              transition: 'all 0.12s',
              textDecoration: 'none',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={15} color={isActive ? 'var(--accent)' : 'currentColor'} />
                <span>{label}</span>
                {isActive && <ChevronRight size={12} style={{ marginLeft: 'auto', color: 'var(--text3)' }} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }}>
        <button className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 9 }} onClick={onLogout}>
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
