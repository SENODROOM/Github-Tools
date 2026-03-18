import { useState, useEffect } from 'react'
import { useGH } from '../context/GHContext'
import PageHeader from '../components/PageHeader'
import { Bell, GitPullRequest, AlertCircle, Check, X, ExternalLink, RefreshCw, Filter } from 'lucide-react'

const REASONS = {
  assign: { label: 'Assigned', color: 'tag-purple' },
  author: { label: 'Author', color: 'tag-blue' },
  comment: { label: 'Comment', color: 'tag-gray' },
  mention: { label: 'Mention', color: 'tag-amber' },
  review_requested: { label: 'Review', color: 'tag-purple' },
  subscribed: { label: 'Subscribed', color: 'tag-gray' },
  team_mention: { label: 'Team', color: 'tag-blue' },
  state_change: { label: 'State change', color: 'tag-green' },
}

export default function NotificationsPage() {
  const { api } = useGH()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [marking, setMarking] = useState(new Set())

  async function load() {
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
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function markRead(id) {
    setMarking(m => new Set([...m, id]))
    try {
      await api(`/notifications/threads/${id}`, { method: 'PATCH' })
      setNotifs(n => n.filter(x => x.id !== id))
    } catch {}
    setMarking(m => { const s = new Set(m); s.delete(id); return s })
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
    const matchType = filter === 'all' || n.subject.type.toLowerCase() === filter
    const matchSearch = n.repository.full_name.toLowerCase().includes(search.toLowerCase()) ||
      n.subject.title.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const prCount = notifs.filter(n => n.subject.type === 'PullRequest').length
  const issueCount = notifs.filter(n => n.subject.type === 'Issue').length
  const otherCount = notifs.length - prCount - issueCount

  return (
    <div>
      <PageHeader
        title="Notifications"
        desc="Your unread GitHub notifications in one place."
        actions={
          <>
            <button className="btn-secondary btn-sm" onClick={load}>
              <RefreshCw size={13} />Refresh
            </button>
            {notifs.length > 0 && (
              <button className="btn-green btn-sm" onClick={markAllRead}>
                <Check size={13} />Mark all read
              </button>
            )}
          </>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total', value: notifs.length, icon: Bell, color: 'var(--accent)' },
          { label: 'Pull Requests', value: prCount, icon: GitPullRequest, color: 'var(--blue)' },
          { label: 'Issues', value: issueCount, icon: AlertCircle, color: 'var(--amber)' },
          { label: 'Other', value: otherCount, icon: Filter, color: 'var(--text3)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
              <Icon size={14} color={color} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="Search by repo or title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        {['all', 'pullrequest', 'issue'].map(f => (
          <button
            key={f}
            className={filter === f ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'pullrequest' ? 'PRs' : 'Issues'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 32, justifyContent: 'center', color: 'var(--text2)' }}>
          <div className="spinner" /> Loading notifications...
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Bell size={32} style={{ marginBottom: 12, color: 'var(--text3)' }} />
          <p>{notifs.length === 0 ? 'No unread notifications — you\'re all caught up!' : 'No notifications match your filter.'}</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.map((n, i) => {
            const reason = REASONS[n.reason] || { label: n.reason, color: 'tag-gray' }
            const isPR = n.subject.type === 'PullRequest'
            const isIssue = n.subject.type === 'Issue'
            const urlNum = n.subject.url?.match(/\/(\d+)$/)
            const htmlUrl = n.subject.url?.replace('api.github.com/repos', 'github.com').replace('/pulls/', '/pull/').replace('/issues/', '/issues/')
            return (
              <div key={n.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg4)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ marginTop: 2, flexShrink: 0 }}>
                  {isPR ? <GitPullRequest size={15} color="var(--blue)" /> : isIssue ? <AlertCircle size={15} color="var(--amber)" /> : <Bell size={15} color="var(--text3)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.subject.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{n.repository.full_name}</span>
                    {urlNum && <span style={{ fontSize: 11, color: 'var(--text3)' }}>#{urlNum[1]}</span>}
                    <span className={`tag ${reason.color}`}>{reason.label}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {new Date(n.updated_at).toLocaleDateString()}
                  </span>
                  <a href={htmlUrl} target="_blank" rel="noopener noreferrer">
                    <button className="btn-ghost btn-icon btn-sm"><ExternalLink size={12} /></button>
                  </a>
                  <button className="btn-ghost btn-icon btn-sm" onClick={() => markRead(n.id)} disabled={marking.has(n.id)}>
                    {marking.has(n.id) ? <div className="spinner spinner-sm" /> : <X size={12} />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
