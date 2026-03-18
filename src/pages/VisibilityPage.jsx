import { useState } from 'react'
import { useGH } from '../context/GHContext'
import PageHeader from '../components/PageHeader'
import RepoSelector from '../components/RepoSelector'
import ProgressLog from '../components/ProgressLog'
import { Shield, Lock, Unlock, AlertTriangle, RefreshCw, Play } from 'lucide-react'

export default function VisibilityPage() {
  const { api, fetchAllRepos } = useGH()
  const [repos, setRepos]       = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading]   = useState(false)
  const [running, setRunning]   = useState(false)
  const [progress, setProgress] = useState([])
  const [fetched, setFetched]   = useState(false)
  const [target, setTarget]     = useState('private')
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

  async function run() {
    if (!confirmed) return
    const list = repos.filter(r => selected.has(r.full_name))
    setProgress(list.map(r => ({ name: r.full_name, status: 'pending' })))
    setRunning(true)
    for (let i = 0; i < list.length; i++) {
      const r = list[i]
      try {
        if ((target === 'private') === r.private) {
          setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'skip', msg: 'already ' + target } : x))
          continue
        }
        await api(`/repos/${r.full_name}`, { method: 'PATCH', body: { private: target === 'private' } })
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'ok', msg: 'now ' + target } : x))
      } catch (e) {
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'error', msg: e.message } : x))
      }
    }
    setRunning(false)
    setConfirmed(false)
  }

  const stats = {
    public:  repos.filter(r => !r.private).length,
    private: repos.filter(r =>  r.private).length,
  }

  return (
    <div>
      <PageHeader
        title="Bulk Visibility"
        desc="Change dozens of repos from public to private (or vice versa) in one shot. No GitHub UI equivalent."
        actions={
          <button className="btn-secondary btn-sm" onClick={load} disabled={loading || running}>
            {loading ? <><div className="spinner spinner-sm" />Loading...</> : <><RefreshCw size={13} />Load repos</>}
          </button>
        }
      />

      {/* Warning */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'flex-start',
        background: 'var(--amber-dim)', border: '1px solid var(--amber-border)',
        borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 20,
      }}>
        <AlertTriangle size={15} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: 'var(--amber)', lineHeight: 1.6 }}>
          <strong>Making repos private</strong> may break forks, integrations, and GitHub Pages.
          Making public exposes full commit history permanently.
        </div>
      </div>

      {/* Target toggle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20, maxWidth: 400 }}>
        {[
          { id: 'private', icon: Lock,   label: 'Make Private', color: 'var(--amber)',  dim: 'var(--amber-dim)',  border: 'var(--amber-border)' },
          { id: 'public',  icon: Unlock, label: 'Make Public',  color: 'var(--blue)',   dim: 'var(--blue-dim)',   border: 'var(--blue-border)' },
        ].map(({ id, icon: Icon, label, color, dim, border }) => (
          <div
            key={id}
            onClick={() => { setTarget(id); setConfirmed(false) }}
            style={{
              padding: '14px 16px', borderRadius: 'var(--radius)',
              background: target === id ? dim : 'var(--bg2)',
              border: `1px solid ${target === id ? border : 'var(--border)'}`,
              cursor: 'pointer', transition: 'all 0.2s var(--ease)',
              display: 'flex', alignItems: 'center', gap: 10,
              transform: target === id ? 'translateY(-1px)' : 'none',
              boxShadow: target === id ? `0 4px 12px ${color}22` : 'none',
            }}
          >
            <Icon size={16} color={target === id ? color : 'var(--text3)'} />
            <span style={{ fontWeight: 500, fontSize: 13, color: target === id ? 'var(--text)' : 'var(--text2)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Stats summary */}
      {fetched && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',   value: repos.length,   color: 'var(--text)' },
            { label: 'Public',  value: stats.public,   color: 'var(--blue)' },
            { label: 'Private', value: stats.private,  color: 'var(--amber)' },
            { label: 'Selected', value: selected.size, color: 'var(--accent)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: '7px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
              <span style={{ color: 'var(--text3)' }}>{label}: </span>
              <span style={{ fontWeight: 600, color, fontFamily: 'var(--mono)' }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {!fetched ? (
        <div className="card" style={{ textAlign: 'center', padding: '52px 24px' }}>
          <Shield size={32} style={{ margin: '0 auto 14px', display: 'block', color: 'var(--text3)' }} />
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>Load repos to change visibility</p>
          <button className="btn-primary" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner" />Loading...</> : 'Load my repos'}
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <RepoSelector repos={repos} selected={selected} onToggle={toggle} onSelectAll={selectAll} onDeselectAll={deselectAll} />
          </div>

          {selected.size > 0 && (
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border2)',
              borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 14,
              animation: 'fadeUp 0.2s var(--ease)',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, userSelect: 'none' }}>
                <input
                  type="checkbox" checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                I understand the risks and want to make {selected.size} repo{selected.size !== 1 ? 's' : ''}{' '}
                <strong style={{ color: target === 'private' ? 'var(--amber)' : 'var(--blue)' }}>{target}</strong>
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
              : <><Shield size={13} />Apply to {selected.size} repo{selected.size !== 1 ? 's' : ''}</>}
          </button>
          <ProgressLog items={progress} />
        </>
      )}
    </div>
  )
}
