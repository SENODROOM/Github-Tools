import { useState } from 'react'
import { useGH } from '../context/GHContext'
import PageHeader from '../components/PageHeader'
import RepoSelector from '../components/RepoSelector'
import ProgressLog from '../components/ProgressLog'
import { Archive, RefreshCw, Clock, AlertTriangle, Play, RotateCcw } from 'lucide-react'

export default function ArchivePage() {
  const { api, fetchAllRepos } = useGH()
  const [repos, setRepos]         = useState([])
  const [selected, setSelected]   = useState(new Set())
  const [loading, setLoading]     = useState(false)
  const [running, setRunning]     = useState(false)
  const [progress, setProgress]   = useState([])
  const [fetched, setFetched]     = useState(false)
  const [mode, setMode]           = useState('archive')
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

  function toggle(name)      { setSelected(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n }) }
  function selectAll(list)   { setSelected(s => { const n = new Set(s); list.forEach(r => n.add(r.full_name));    return n }) }
  function deselectAll(list) { setSelected(s => { const n = new Set(s); list.forEach(r => n.delete(r.full_name)); return n }) }

  function autoSelect() {
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - inactiveMonths)
    const inactive = repos.filter(r => !r.archived && new Date(r.pushed_at) < cutoff)
    setSelected(new Set(inactive.map(r => r.full_name)))
  }

  async function run() {
    if (!confirmed) return
    const archiving = mode === 'archive'
    const list = repos.filter(r => selected.has(r.full_name))
    setProgress(list.map(r => ({ name: r.full_name, status: 'pending' })))
    setRunning(true)
    for (let i = 0; i < list.length; i++) {
      const r = list[i]
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
    setRunning(false)
    setConfirmed(false)
  }

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - inactiveMonths)
  const inactiveCount  = repos.filter(r => !r.archived && new Date(r.pushed_at) < cutoff).length
  const archivedCount  = repos.filter(r => r.archived).length
  const activeCount    = repos.filter(r => !r.archived).length

  return (
    <div>
      <PageHeader
        title="Bulk Archive"
        desc="Archive stale repos or unarchive them in batch. GitHub forces you to do this one by one."
        actions={
          <button className="btn-secondary btn-sm" onClick={load} disabled={loading || running}>
            {loading ? <><div className="spinner spinner-sm" />Loading...</> : <><RefreshCw size={13} />Load repos</>}
          </button>
        }
      />

      {/* Mode toggle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20, maxWidth: 420 }}>
        {[
          { id: 'archive',   icon: Archive,    label: 'Archive repos',   color: 'var(--amber)', dim: 'var(--amber-dim)',  border: 'var(--amber-border)' },
          { id: 'unarchive', icon: RotateCcw,  label: 'Unarchive repos', color: 'var(--green)', dim: 'var(--green-dim)',  border: 'var(--green-border)' },
        ].map(({ id, icon: Icon, label, color, dim, border }) => (
          <div
            key={id}
            onClick={() => { setMode(id); setConfirmed(false) }}
            style={{
              padding: '13px 16px', borderRadius: 'var(--radius)',
              background: mode === id ? dim : 'var(--bg2)',
              border: `1px solid ${mode === id ? border : 'var(--border)'}`,
              cursor: 'pointer', transition: 'all 0.2s var(--ease)',
              display: 'flex', alignItems: 'center', gap: 10,
              transform: mode === id ? 'translateY(-1px)' : 'none',
              boxShadow: mode === id ? `0 4px 14px ${color}22` : 'none',
            }}
          >
            <Icon size={15} color={mode === id ? color : 'var(--text3)'} />
            <span style={{ fontWeight: 500, fontSize: 13, color: mode === id ? 'var(--text)' : 'var(--text2)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      {fetched && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'Total',    value: repos.length,    color: 'var(--text)' },
            { label: 'Active',   value: activeCount,     color: 'var(--green)' },
            { label: 'Archived', value: archivedCount,   color: 'var(--text3)' },
            { label: `Inactive ${inactiveMonths}mo+`, value: inactiveCount, color: 'var(--amber)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card stat-card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)', color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Warning */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'flex-start',
        background: 'var(--amber-dim)', border: '1px solid var(--amber-border)',
        borderRadius: 'var(--radius)', padding: '11px 14px', marginBottom: 16,
      }}>
        <AlertTriangle size={14} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: 'var(--amber)', lineHeight: 1.6 }}>
          Archiving makes repos read-only — pushes, issues, and PRs are disabled. Repos remain visible and can be unarchived later.
        </div>
      </div>

      {!fetched ? (
        <div className="card" style={{ textAlign: 'center', padding: '52px 24px' }}>
          <Archive size={32} style={{ margin: '0 auto 14px', display: 'block', color: 'var(--text3)' }} />
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>Load repos to manage archives</p>
          <button className="btn-primary" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner" />Loading...</> : 'Load my repos'}
          </button>
        </div>
      ) : (
        <>
          {/* Auto-select strip */}
          {mode === 'archive' && (
            <div className="card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '12px 14px' }}>
              <Clock size={13} color="var(--text3)" />
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>Auto-select inactive for more than</span>
              <input
                type="number" value={inactiveMonths}
                onChange={e => setInactiveMonths(Number(e.target.value))}
                style={{ width: 64, fontSize: 12 }}
                min={1} max={120}
              />
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>months</span>
              <button className="btn-secondary btn-sm" onClick={autoSelect}>
                <Clock size={12} /> Select {inactiveCount} inactive repos
              </button>
            </div>
          )}

          <div className="card" style={{ marginBottom: 12 }}>
            <RepoSelector repos={repos} selected={selected} onToggle={toggle} onSelectAll={selectAll} onDeselectAll={deselectAll} />
          </div>

          {selected.size > 0 && (
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border2)',
              borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 12,
              animation: 'fadeUp 0.2s var(--ease)',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, userSelect: 'none' }}>
                <input
                  type="checkbox" checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                I want to <strong style={{ color: mode === 'archive' ? 'var(--amber)' : 'var(--green)' }}>{mode}</strong>{' '}
                {selected.size} repo{selected.size !== 1 ? 's' : ''}
              </label>
            </div>
          )}

          <button
            className="btn-primary"
            disabled={selected.size === 0 || !confirmed || running}
            onClick={run}
          >
            {running
              ? <><div className="spinner" />Applying...</>
              : <><Archive size={13} />{mode === 'archive' ? 'Archive' : 'Unarchive'} {selected.size} repo{selected.size !== 1 ? 's' : ''}</>}
          </button>
          <ProgressLog items={progress} />
        </>
      )}
    </div>
  )
}
