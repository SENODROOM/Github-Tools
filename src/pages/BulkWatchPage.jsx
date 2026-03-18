import { useState } from 'react'
import { useGH } from '../context/GHContext'
import PageHeader from '../components/PageHeader'
import RepoSelector from '../components/RepoSelector'
import ProgressLog from '../components/ProgressLog'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'

export default function BulkWatchPage() {
  const { api, fetchAllRepos } = useGH()
  const [repos, setRepos] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState([])
  const [fetched, setFetched] = useState(false)
  const [mode, setMode] = useState('watch')

  async function load() {
    setLoading(true)
    try {
      const data = await fetchAllRepos()
      setRepos(data)
      setFetched(true)
      const allNames = new Set(data.map(r => r.full_name))
      setSelected(allNames)
    } catch {}
    setLoading(false)
  }

  function toggle(name) {
    setSelected(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n })
  }
  function selectAll(list) { setSelected(s => { const n = new Set(s); list.forEach(r => n.add(r.full_name)); return n }) }
  function deselectAll(list) { setSelected(s => { const n = new Set(s); list.forEach(r => n.delete(r.full_name)); return n }) }

  async function run() {
    const list = repos.filter(r => selected.has(r.full_name))
    setProgress(list.map(r => ({ name: r.full_name, status: 'pending' })))
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
  }

  return (
    <div>
      <PageHeader
        title="Bulk Watch"
        desc="Watch, ignore, or unsubscribe from all your repos at once. Impossible to do in bulk from GitHub's UI."
        actions={
          <button className="btn-secondary btn-sm" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner spinner-sm" />Loading...</> : <><RefreshCw size={13} />Load repos</>}
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[
          { id: 'watch', icon: Eye, label: 'Watch (All Activity)', desc: 'Get notified on all events', color: 'var(--green)' },
          { id: 'ignore', icon: EyeOff, label: 'Ignore', desc: 'Mute all notifications', color: 'var(--red)' },
          { id: 'unwatch', icon: EyeOff, label: 'Unsubscribe', desc: 'Remove subscription', color: 'var(--text3)' },
        ].map(({ id, icon: Icon, label, desc, color }) => (
          <div
            key={id}
            onClick={() => setMode(id)}
            className="card"
            style={{
              cursor: 'pointer', padding: '14px 16px',
              border: mode === id ? `1px solid ${color}` : '1px solid var(--border)',
              background: mode === id ? 'var(--bg3)' : 'var(--bg2)',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Icon size={14} color={color} />
              <span style={{ fontWeight: 500, fontSize: 13 }}>{label}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{desc}</div>
          </div>
        ))}
      </div>

      {!fetched ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
          <Eye size={28} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          <p style={{ marginBottom: 16, fontSize: 13 }}>Load your repos to get started</p>
          <button className="btn-primary" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner" />Loading...</> : 'Load my repos'}
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <RepoSelector
              repos={repos}
              selected={selected}
              onToggle={toggle}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
            />
          </div>
          <button className="btn-primary" disabled={selected.size === 0} onClick={run} style={{ marginBottom: 16 }}>
            <Eye size={14} />Apply to {selected.size} repo{selected.size !== 1 ? 's' : ''}
          </button>
          <ProgressLog items={progress} />
        </>
      )}
    </div>
  )
}
