import { useState } from 'react'
import { useGH } from '../context/GHContext'
import PageHeader from '../components/PageHeader'
import RepoSelector from '../components/RepoSelector'
import ProgressLog from '../components/ProgressLog'
import { Zap, RefreshCw, Info, Play, Eye } from 'lucide-react'

const EVENT_OPTIONS = [
  { id: 'pull_request', label: 'Pull Requests', color: 'tag-blue',   desc: 'Opened, closed, merged' },
  { id: 'issues',       label: 'Issues',        color: 'tag-amber',  desc: 'Opened, closed, edited' },
  { id: 'push',         label: 'Push',          color: 'tag-green',  desc: 'Commits pushed' },
  { id: 'release',      label: 'Releases',      color: 'tag-purple', desc: 'Published, drafted' },
  { id: 'discussion',   label: 'Discussions',   color: 'tag-gray',   desc: 'Created, answered' },
]

export default function WebhooksPage() {
  const { api, fetchAllRepos, user } = useGH()
  const [repos, setRepos]         = useState([])
  const [selected, setSelected]   = useState(new Set())
  const [loading, setLoading]     = useState(false)
  const [running, setRunning]     = useState(false)
  const [progress, setProgress]   = useState([])
  const [fetched, setFetched]     = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [events, setEvents]       = useState(new Set(['pull_request', 'issues']))

  async function load() {
    setLoading(true)
    try {
      const data = await fetchAllRepos()
      setRepos(data)
      setFetched(true)
    } catch {}
    setLoading(false)
  }

  function toggle(name)      { setSelected(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n }) }
  function selectAll(list)   { setSelected(s => { const n = new Set(s); list.forEach(r => n.add(r.full_name));    return n }) }
  function deselectAll(list) { setSelected(s => { const n = new Set(s); list.forEach(r => n.delete(r.full_name)); return n }) }
  function toggleEvent(id)   { setEvents(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n }) }

  async function setup() {
    const evList = [...events]
    if (!evList.length || !webhookUrl) return
    const list = repos.filter(r => selected.has(r.full_name))
    setProgress(list.map(r => ({ name: r.full_name, status: 'pending' })))
    setRunning(true)
    for (let i = 0; i < list.length; i++) {
      const r = list[i]
      try {
        const existing = await api(`/repos/${r.full_name}/hooks`)
        const hook = existing.find(h => h.config?.url === webhookUrl)
        if (hook) {
          await api(`/repos/${r.full_name}/hooks/${hook.id}`, {
            method: 'PATCH',
            body: { active: true, events: evList, config: { ...hook.config, content_type: 'json' } }
          })
          setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'ok', msg: 'updated' } : x))
        } else {
          await api(`/repos/${r.full_name}/hooks`, {
            method: 'POST',
            body: { name: 'web', active: true, events: evList, config: { url: webhookUrl, content_type: 'json', insecure_ssl: '0' } }
          })
          setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'ok', msg: 'created' } : x))
        }
      } catch (e) {
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'error', msg: e.message } : x))
      }
    }
    setRunning(false)
  }

  async function setupWatching() {
    const list = repos.filter(r => selected.has(r.full_name))
    setProgress(list.map(r => ({ name: r.full_name, status: 'pending' })))
    setRunning(true)
    for (let i = 0; i < list.length; i++) {
      try {
        await api(`/repos/${list[i].full_name}/subscription`, { method: 'PUT', body: { subscribed: true, ignored: false } })
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'ok', msg: 'watching' } : x))
      } catch (e) {
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'error', msg: e.message } : x))
      }
    }
    setRunning(false)
  }

  return (
    <div>
      <PageHeader
        title="Webhook Setup"
        desc="Register web hooks on multiple repos at once. Choose exactly which events to listen for."
        actions={
          <button className="btn-secondary btn-sm" onClick={load} disabled={loading || running}>
            {loading ? <><div className="spinner spinner-sm" />Loading...</> : <><RefreshCw size={13} />Load repos</>}
          </button>
        }
      />

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Configuration</div>

        {/* URL */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Webhook URL (payload destination)</label>
          <input
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://your-server.com/webhook"
          />
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>
            Use <strong style={{ color: 'var(--text2)' }}>webhook.site</strong>, <strong style={{ color: 'var(--text2)' }}>pipedream.com</strong>, or your own server to receive and forward payloads.
          </div>
        </div>

        {/* Events */}
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>Events to listen for</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EVENT_OPTIONS.map(({ id, label, color, desc }) => {
            const active = events.has(id)
            return (
              <div
                key={id}
                onClick={() => toggleEvent(id)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 3,
                  padding: '9px 13px', borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer', transition: 'all 0.18s var(--ease)',
                  background: active ? 'var(--accent-dim)' : 'var(--bg3)',
                  border: active ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                  transform: active ? 'translateY(-1px)' : 'none',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 500, color: active ? 'var(--accent)' : 'var(--text2)' }}>{label}</span>
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>{desc}</span>
              </div>
            )
          })}
        </div>

        <div style={{
          marginTop: 14, background: 'var(--bg4)', borderRadius: 'var(--radius-sm)',
          padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <Info size={12} color="var(--text3)" style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
            Webhooks fire raw JSON POST requests to your URL. Need simple email notifications? Use the <strong style={{ color: 'var(--text2)' }}>Watch repos</strong> button below instead.
          </div>
        </div>
      </div>

      {!fetched ? (
        <div className="card" style={{ textAlign: 'center', padding: '52px 24px' }}>
          <Zap size={32} style={{ margin: '0 auto 14px', display: 'block', color: 'var(--text3)' }} />
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>Load repos to set up webhooks</p>
          <button className="btn-primary" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner" />Loading...</> : 'Load my repos'}
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <RepoSelector repos={repos} selected={selected} onToggle={toggle} onSelectAll={selectAll} onDeselectAll={deselectAll} />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              disabled={selected.size === 0 || !webhookUrl || events.size === 0 || running}
              onClick={setup}
            >
              {running ? <><div className="spinner" />Running...</> : <><Zap size={13} />Register webhooks on {selected.size} repo{selected.size !== 1 ? 's' : ''}</>}
            </button>
            <button className="btn-secondary" disabled={selected.size === 0 || running} onClick={setupWatching}>
              <Eye size={13} />Watch {selected.size} repo{selected.size !== 1 ? 's' : ''}
            </button>
          </div>
          <ProgressLog items={progress} />
        </>
      )}
    </div>
  )
}
