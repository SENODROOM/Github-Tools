import { useState } from 'react'
import { useGH } from '../context/GHContext'
import PageHeader from '../components/PageHeader'
import RepoSelector from '../components/RepoSelector'
import ProgressLog from '../components/ProgressLog'
import { Archive, RefreshCw, Clock, AlertTriangle } from 'lucide-react'

export default function ArchivePage() {
  const { api, fetchAllRepos } = useGH()
  const [repos, setRepos] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState([])
  const [fetched, setFetched] = useState(false)
  const [mode, setMode] = useState('archive')
  const [inactiveMonths, setInactiveMonths] = useState(12)
  const [confirmed, setConfirmed] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchAllRepos()
      setRepos(data)
      setFetched(true)
    } catch {}
    setLoading(false)
  }

  function autoSelectInactive() {
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - inactiveMonths)
    const inactive = repos.filter(r => !r.archived && new Date(r.pushed_at) < cutoff)
    setSelected(new Set(inactive.map(r => r.full_name)))
  }

  function toggle(name) { setSelected(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n }) }
  function selectAll(list) { setSelected(s => { const n = new Set(s); list.forEach(r => n.add(r.full_name)); return n }) }
  function deselectAll(list) { setSelected(s => { const n = new Set(s); list.forEach(r => n.delete(r.full_name)); return n }) }

  async function run() {
    if (!confirmed) return
    const list = repos.filter(r => selected.has(r.full_name))
    setProgress(list.map(r => ({ name: r.full_name, status: 'pending' })))
    for (let i = 0; i < list.length; i++) {
      const r = list[i]
      const archiving = mode === 'archive'
      try {
        if (r.archived === archiving) {
          setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'skip', msg: 'already ' + (archiving ? 'archived' : 'active') } : x))
          continue
        }
        await api(`/repos/${r.full_name}`, { method: 'PATCH', body: { archived: archiving } })
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'ok', msg: archiving ? 'archived' : 'unarchived' } : x))
      } catch (e) {
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'error', msg: e.message } : x))
      }
    }
    setConfirmed(false)
  }

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - inactiveMonths)
  const inactiveCount = repos.filter(r => !r.archived && new Date(r.pushed_at) < cutoff).length
  const archivedCount = repos.filter(r => r.archived).length

  return (
    <div>
      <PageHeader
        title="Bulk Archive"
        desc="Archive inactive repos in one click, or unarchive them. GitHub requires doing this one at a time."
        actions={
          <button className="btn-secondary btn-sm" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner spinner-sm" />Loading...</> : <><RefreshCw size={13} />Load repos</>}
          </button>
        }
      />

      {fetched && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total repos', value: repos.length },
            { label: `Inactive ${inactiveMonths}+ months`, value: inactiveCount },
            { label: 'Already archived', value: archivedCount },
          ].map(({ label, value }) => (
            <div key={label} className="card" style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20, maxWidth: 400 }}>
        {[
          { id: 'archive', label: 'Archive repos', color: 'var(--amber)' },
          { id: 'unarchive', label: 'Unarchive repos', color: 'var(--green)' },
        ].map(({ id, label, color }) => (
          <div key={id} onClick={() => setMode(id)} className="card" style={{
            cursor: 'pointer', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8,
            border: mode === id ? `1px solid ${color}` : '1px solid var(--border)',
            background: mode === id ? 'var(--bg3)' : 'var(--bg2)', transition: 'all 0.15s',
          }}>
            <Archive size={14} color={color} />
            <span style={{ fontWeight: 500, fontSize: 13 }}>{label}</span>
          </div>
        ))}
      </div>

      {!fetched ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
          <Archive size={28} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          <p style={{ marginBottom: 16, fontSize: 13 }}>Load repos to manage archives</p>
          <button className="btn-primary" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner" />Loading...</> : 'Load my repos'}
          </button>
        </div>
      ) : (
        <>
          {mode === 'archive' && (
            <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Clock size={14} color="var(--text3)" />
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>Auto-select repos inactive for</span>
              <input type="number" value={inactiveMonths} onChange={e => setInactiveMonths(Number(e.target.value))}
                style={{ width: 70 }} min={1} max={120} />
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>months</span>
              <button className="btn-secondary btn-sm" onClick={autoSelectInactive}>
                <Clock size={12} />Auto-select {inactiveCount}
              </button>
            </div>
          )}

          <div className="card" style={{ marginBottom: 16 }}>
            <RepoSelector repos={repos} selected={selected} onToggle={toggle} onSelectAll={selectAll} onDeselectAll={deselectAll} />
          </div>

          <div style={{ background: 'var(--amber-dim)', border: '1px solid rgba(240,180,90,0.25)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 8 }}>
            <AlertTriangle size={14} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: 'var(--amber)' }}>
              Archiving disables pushes, issues, and PRs. The repo remains visible but read-only.
            </div>
          </div>

          {selected.size > 0 && (
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ width: 14, height: 14, accentColor: 'var(--accent)' }} />
                I want to {mode} {selected.size} repo{selected.size !== 1 ? 's' : ''}
              </label>
            </div>
          )}

          <button className="btn-primary" disabled={selected.size === 0 || !confirmed} onClick={run}>
            <Archive size={14} />
            {mode === 'archive' ? 'Archive' : 'Unarchive'} {selected.size} repo{selected.size !== 1 ? 's' : ''}
          </button>
          <ProgressLog items={progress} />
        </>
      )}
    </div>
  )
}
