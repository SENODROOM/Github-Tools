import { useState } from 'react'
import { useGH } from '../context/GHContext'
import PageHeader from '../components/PageHeader'
import RepoSelector from '../components/RepoSelector'
import ProgressLog from '../components/ProgressLog'
import { Eye, EyeOff, BellOff, RefreshCw, Play } from 'lucide-react'

const MODES = [
  {
    id: 'watch',
    icon: Eye,
    label: 'Watch All Activity',
    desc: 'Get notified on every event — issues, PRs, releases, commits.',
    color: 'var(--green)',
    dimColor: 'var(--green-dim)',
    borderColor: 'var(--green-border)',
  },
  {
    id: 'ignore',
    icon: BellOff,
    label: 'Ignore',
    desc: 'Mute all notifications from selected repos.',
    color: 'var(--red)',
    dimColor: 'var(--red-dim)',
    borderColor: 'var(--red-border)',
  },
  {
    id: 'unwatch',
    icon: EyeOff,
    label: 'Unsubscribe',
    desc: 'Remove subscription entirely — only get notified if mentioned.',
    color: 'var(--text3)',
    dimColor: 'var(--bg4)',
    borderColor: 'var(--border2)',
  },
]

export default function BulkWatchPage() {
  const { api, fetchAllRepos } = useGH()
  const [repos, setRepos]     = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState([])
  const [fetched, setFetched] = useState(false)
  const [mode, setMode]       = useState('watch')

  async function load() {
    setLoading(true)
    try {
      const data = await fetchAllRepos()
      setRepos(data)
      setFetched(true)
      setSelected(new Set(data.map(r => r.full_name)))
    } catch {}
    setLoading(false)
  }

  function toggle(name) {
    setSelected(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n })
  }
  function selectAll(list)   { setSelected(s => { const n = new Set(s); list.forEach(r => n.add(r.full_name));    return n }) }
  function deselectAll(list) { setSelected(s => { const n = new Set(s); list.forEach(r => n.delete(r.full_name)); return n }) }

  async function run() {
    const list = repos.filter(r => selected.has(r.full_name))
    setProgress(list.map(r => ({ name: r.full_name, status: 'pending' })))
    setRunning(true)
    for (let i = 0; i < list.length; i++) {
      const r = list[i]
      try {
        if (mode === 'watch') {
          await api(`/repos/${r.full_name}/subscription`, { method: 'PUT', body: { subscribed: true, ignored: false } })
        } else if (mode === 'ignore') {
          await api(`/repos/${r.full_name}/subscription`, { method: 'PUT', body: { subscribed: false, ignored: true } })
        } else {
          await api(`/repos/${r.full_name}/subscription`, { method: 'DELETE' })
        }
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'ok', msg: mode } : x))
      } catch (e) {
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'error', msg: e.message } : x))
      }
    }
    setRunning(false)
  }

  const currentMode = MODES.find(m => m.id === mode)

  return (
    <div>
      <PageHeader
        title="Bulk Watch"
        desc="Watch, ignore, or unsubscribe from all your repos in one go. GitHub has no bulk option for this."
        actions={
          <button className="btn-secondary btn-sm" onClick={load} disabled={loading || running}>
            {loading ? <><div className="spinner spinner-sm" />Loading...</> : <><RefreshCw size={13} />Load repos</>}
          </button>
        }
      />

      {/* Mode picker */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 24 }}>
        {MODES.map(({ id, icon: Icon, label, desc, color, dimColor, borderColor }) => (
          <div
            key={id}
            onClick={() => setMode(id)}
            style={{
              padding: '14px 16px', borderRadius: 'var(--radius)',
              background: mode === id ? dimColor : 'var(--bg2)',
              border: `1px solid ${mode === id ? borderColor : 'var(--border)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s var(--ease)',
              transform: mode === id ? 'translateY(-2px)' : 'none',
              boxShadow: mode === id ? `0 4px 16px ${color}22` : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <Icon size={15} color={mode === id ? color : 'var(--text3)'} />
              <span style={{ fontWeight: 500, fontSize: 13, color: mode === id ? 'var(--text)' : 'var(--text2)' }}>{label}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>

      {!fetched ? (
        <div className="card" style={{ textAlign: 'center', padding: '52px 24px' }}>
          <Eye size={32} style={{ margin: '0 auto 14px', display: 'block', color: 'var(--text3)' }} />
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>Load your repos to get started</p>
          <button className="btn-primary" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner" />Loading...</> : 'Load my repos'}
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <RepoSelector
              repos={repos} selected={selected}
              onToggle={toggle} onSelectAll={selectAll} onDeselectAll={deselectAll}
            />
          </div>

          <button
            className="btn-primary"
            disabled={selected.size === 0 || running}
            onClick={run}
            style={{ marginBottom: 4 }}
          >
            {running
              ? <><div className="spinner" />Running...</>
              : <><Play size={13} />{currentMode?.label} on {selected.size} repo{selected.size !== 1 ? 's' : ''}</>}
          </button>

          <ProgressLog items={progress} />
        </>
      )}
    </div>
  )
}
