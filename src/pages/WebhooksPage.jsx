import { useState } from 'react'
import { useGH } from '../context/GHContext'
import PageHeader from '../components/PageHeader'
import RepoSelector from '../components/RepoSelector'
import ProgressLog from '../components/ProgressLog'
import { Zap, RefreshCw, Info } from 'lucide-react'

const RELAY_BASE = 'https://smee.io'

export default function WebhooksPage() {
  const { api, fetchAllRepos, user } = useGH()
  const [repos, setRepos] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState([])
  const [fetched, setFetched] = useState(false)
  const [email, setEmail] = useState('')
  const [wantPR, setWantPR] = useState(true)
  const [wantIssue, setWantIssue] = useState(true)
  const [wantPush, setWantPush] = useState(false)
  const [wantRelease, setWantRelease] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')

  async function load() {
    setLoading(true)
    try {
      const data = await fetchAllRepos()
      setRepos(data)
      setFetched(true)
      if (user?.email) setEmail(user.email)
    } catch {}
    setLoading(false)
  }

  function toggle(name) { setSelected(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n }) }
  function selectAll(list) { setSelected(s => { const n = new Set(s); list.forEach(r => n.add(r.full_name)); return n }) }
  function deselectAll(list) { setSelected(s => { const n = new Set(s); list.forEach(r => n.delete(r.full_name)); return n }) }

  const events = [
    wantPR && 'pull_request',
    wantIssue && 'issues',
    wantPush && 'push',
    wantRelease && 'release',
  ].filter(Boolean)

  async function setup() {
    if (!events.length) return
    const url = webhookUrl || `https://webhook.site/unique-${Math.random().toString(36).slice(2,10)}`
    const list = repos.filter(r => selected.has(r.full_name))
    setProgress(list.map(r => ({ name: r.full_name, status: 'pending' })))

    for (let i = 0; i < list.length; i++) {
      const r = list[i]
      try {
        // Check existing hooks
        const existing = await api(`/repos/${r.full_name}/hooks`)
        const hook = existing.find(h => h.config?.url?.includes(url.split('/')[2] || ''))

        if (hook) {
          await api(`/repos/${r.full_name}/hooks/${hook.id}`, {
            method: 'PATCH',
            body: { active: true, events, config: { ...hook.config, content_type: 'json' } }
          })
          setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'ok', msg: 'updated' } : x))
        } else {
          await api(`/repos/${r.full_name}/hooks`, {
            method: 'POST',
            body: {
              name: 'web', active: true, events,
              config: { url, content_type: 'json', insecure_ssl: '0' }
            }
          })
          setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'ok', msg: 'created' } : x))
        }
      } catch (e) {
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'error', msg: e.message } : x))
      }
    }
  }

  async function setupWatching() {
    const list = repos.filter(r => selected.has(r.full_name))
    setProgress(list.map(r => ({ name: r.full_name, status: 'pending' })))
    for (let i = 0; i < list.length; i++) {
      const r = list[i]
      try {
        await api(`/repos/${r.full_name}/subscription`, { method: 'PUT', body: { subscribed: true, ignored: false } })
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'ok', msg: 'watching' } : x))
      } catch (e) {
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'error', msg: e.message } : x))
      }
    }
  }

  return (
    <div>
      <PageHeader
        title="Webhook Setup"
        desc="Register web hooks on multiple repos at once. Configure what events to listen to."
        actions={
          <button className="btn-secondary btn-sm" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner spinner-sm" />Loading...</> : <><RefreshCw size={13} />Load repos</>}
          </button>
        }
      />

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Configuration</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Webhook URL (payload destination)</label>
            <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://your-server.com/webhook" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Notify email (for GitHub watching)</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Events to listen for</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Pull Requests', val: wantPR, set: setWantPR, cls: 'tag-blue' },
            { label: 'Issues', val: wantIssue, set: setWantIssue, cls: 'tag-amber' },
            { label: 'Push', val: wantPush, set: setWantPush, cls: 'tag-green' },
            { label: 'Releases', val: wantRelease, set: setWantRelease, cls: 'tag-purple' },
          ].map(({ label, val, set, cls }) => (
            <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} style={{ width: 14, height: 14, accentColor: 'var(--accent)' }} />
              <span className={`tag ${val ? cls : 'tag-gray'}`}>{label}</span>
            </label>
          ))}
        </div>

        <div style={{ marginTop: 14, background: 'var(--bg4)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Info size={13} color="var(--text3)" style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
            Webhook URL receives raw JSON payloads. Use a service like <strong style={{ color: 'var(--text2)' }}>webhook.site</strong>, <strong style={{ color: 'var(--text2)' }}>pipedream.com</strong>, or your own server to forward them to email. Or use "Watch repos" below for simple GitHub email notifications.
          </div>
        </div>
      </div>

      {!fetched ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
          <Zap size={28} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          <p style={{ marginBottom: 16, fontSize: 13 }}>Load your repos to set up webhooks</p>
          <button className="btn-primary" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner" />Loading...</> : 'Load my repos'}
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <RepoSelector repos={repos} selected={selected} onToggle={toggle} onSelectAll={selectAll} onDeselectAll={deselectAll} />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-primary" disabled={selected.size === 0 || !webhookUrl || !events.length} onClick={setup}>
              <Zap size={14} />Register webhooks on {selected.size} repo{selected.size !== 1 ? 's' : ''}
            </button>
            <button className="btn-secondary" disabled={selected.size === 0} onClick={setupWatching}>
              Watch {selected.size} repo{selected.size !== 1 ? 's' : ''} (GitHub notifications)
            </button>
          </div>

          <ProgressLog items={progress} />
        </>
      )}
    </div>
  )
}
