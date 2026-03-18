import { useState, useEffect, useCallback } from 'react'
import { useGH } from '../context/GHContext'
import PageHeader from '../components/PageHeader'
import { Bell, GitPullRequest, AlertCircle, Check, X, ExternalLink, RefreshCw, Filter, CheckCheck, Inbox } from 'lucide-react'

const REASONS = {
  assign:           { label: 'Assigned',     color: 'tag-purple' },
  author:           { label: 'Author',        color: 'tag-blue' },
  comment:          { label: 'Comment',       color: 'tag-gray' },
  mention:          { label: 'Mention',       color: 'tag-amber' },
  review_requested: { label: 'Review',        color: 'tag-purple' },
  subscribed:       { label: 'Subscribed',    color: 'tag-gray' },
  team_mention:     { label: 'Team mention',  color: 'tag-blue' },
  state_change:     { label: 'State change',  color: 'tag-green' },
}

function NotifRow({ n, onRead, reading }) {
  const reason  = REASONS[n.reason] || { label: n.reason, color: 'tag-gray' }
  const isPR    = n.subject.type === 'PullRequest'
  const isIssue = n.subject.type === 'Issue'
  const urlNum  = n.subject.url?.match(/\/(\d+)$/)
  const htmlUrl = n.subject.url
    ?.replace('api.github.com/repos', 'github.com')
    .replace('/pulls/', '/pull/')

  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 16px',
        borderBottom: '1px solid var(--border)',
        background: hovered ? 'var(--bg4)' : 'transparent',
        transition: 'background 0.15s',
        animation: 'fadeIn 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ marginTop: 2, flexShrink: 0 }}>
        {isPR    ? <GitPullRequest size={14} color="var(--blue)"  /> :
         isIssue ? <AlertCircle   size={14} color="var(--amber)" /> :
                   <Bell          size={14} color="var(--text3)" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {n.subject.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{n.repository.full_name}</span>
          {urlNum && <span style={{ fontSize: 11, color: 'var(--text3)' }}>#{urlNum[1]}</span>}
          <span className={`tag ${reason.color}`} style={{ fontSize: 10 }}>{reason.label}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center', opacity: hovered ? 1 : 0.6, transition: 'opacity 0.15s' }}>
        <span style={{ fontSize: 10, color: 'var(--text3)', marginRight: 4 }}>
          {new Date(n.updated_at).toLocaleDateString()}
        </span>
        {htmlUrl && (
          <a href={htmlUrl} target="_blank" rel="noopener noreferrer">
            <button className="btn-ghost btn-icon btn-sm" title="Open on GitHub"><ExternalLink size={11} /></button>
          </a>
        )}
        <button className="btn-ghost btn-icon btn-sm" onClick={() => onRead(n.id)} disabled={reading} title="Mark as read">
          {reading ? <div className="spinner spinner-sm" /> : <X size={11} />}
        </button>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { api } = useGH()
  const [notifs, setNotifs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [search, setSearch]   = useState('')
  const [reading, setReading] = useState(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let all = [], page = 1
      while (true) {
        const data = await api(`/notifications?per_page=50&page=${page}&all=false`)
        if (!data.length) break
        all = all.concat(data)
        if (data.length < 50) break
        page++
      }
      setNotifs(all)
    } catch {}
    setLoading(false)
  }, [api])

  useEffect(() => { load() }, [])

  async function markRead(id) {
    setReading(m => new Set([...m, id]))
    try {
      await api(`/notifications/threads/${id}`, { method: 'PATCH' })
      setNotifs(n => n.filter(x => x.id !== id))
    } catch {}
    setReading(m => { const s = new Set(m); s.delete(id); return s })
  }

  async function markAllRead() {
    setLoading(true)
    try {
      await api('/notifications', { method: 'PUT', body: { last_read_at: new Date().toISOString() } })
      setNotifs([])
    } catch {}
    setLoading(false)
  }

  const filtered = notifs.filter(n => {
    const type = n.subject.type.toLowerCase().replace('pullrequest','pr')
    const matchType = filter === 'all' || type.includes(filter)
    const matchSearch =
      n.repository.full_name.toLowerCase().includes(search.toLowerCase()) ||
      n.subject.title.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const prCount    = notifs.filter(n => n.subject.type === 'PullRequest').length
  const issueCount = notifs.filter(n => n.subject.type === 'Issue').length
  const otherCount = notifs.length - prCount - issueCount

  // Group by repo
  const grouped = filtered.reduce((acc, n) => {
    const repo = n.repository.full_name
    if (!acc[repo]) acc[repo] = []
    acc[repo].push(n)
    return acc
  }, {})

  return (
    <div>
      <PageHeader
        title="Notifications"
        desc="Your unread GitHub notifications — mark, filter, and open in one place."
        actions={
          <>
            <button className="btn-secondary btn-sm" onClick={load} disabled={loading}>
              {loading ? <><div className="spinner spinner-sm" /></> : <RefreshCw size={13} />}
              Refresh
            </button>
            {notifs.length > 0 && (
              <button className="btn-green btn-sm" onClick={markAllRead}>
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Total',  value: notifs.length, icon: '🔔', color: 'var(--accent)' },
          { label: 'PRs',    value: prCount,        icon: '⤴',  color: 'var(--blue)' },
          { label: 'Issues', value: issueCount,     icon: '●',  color: 'var(--amber)' },
          { label: 'Other',  value: otherCount,     icon: '⋯',  color: 'var(--text3)' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card stat-card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text2)' }}>{label}</span>
              <span style={{ fontSize: 13, color }}>{icon}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'var(--mono)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          placeholder="Search notifications..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180 }}
        />
        {['all','pr','issue'].map(f => (
          <button
            key={f}
            className={filter === f ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'pr' ? 'PRs' : 'Issues'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', padding: '48px 0', color: 'var(--text2)' }}>
          <div className="spinner spinner-lg" /> Loading notifications...
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <Inbox size={36} style={{ margin: '0 auto 12px', color: 'var(--text3)', display: 'block' }} />
          <p style={{ fontSize: 14, color: 'var(--text2)' }}>
            {notifs.length === 0 ? "You're all caught up! 🎉" : 'No notifications match.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(grouped).map(([repo, items]) => (
            <div key={repo} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{repo}</span>
                <span className="tag tag-gray" style={{ fontSize: 10 }}>{items.length}</span>
              </div>
              {items.map(n => (
                <NotifRow key={n.id} n={n} onRead={markRead} reading={reading.has(n.id)} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
