import { useState } from 'react'
import { useGH } from '../context/GHContext'
import PageHeader from '../components/PageHeader'
import RepoSelector from '../components/RepoSelector'
import ProgressLog from '../components/ProgressLog'
import { Shield, Lock, Unlock, AlertTriangle, RefreshCw } from 'lucide-react'

export default function VisibilityPage() {
  const { api, fetchAllRepos } = useGH()
  const [repos, setRepos] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState([])
  const [fetched, setFetched] = useState(false)
  const [target, setTarget] = useState('private')
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

  function toggle(name) { setSelected(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n }) }
  function selectAll(list) { setSelected(s => { const n = new Set(s); list.forEach(r => n.add(r.full_name)); return n }) }
  function deselectAll(list) { setSelected(s => { const n = new Set(s); list.forEach(r => n.delete(r.full_name)); return n }) }

  async function run() {
    if (!confirmed) return
    const list = repos.filter(r => selected.has(r.full_name))
    setProgress(list.map(r => ({ name: r.full_name, status: 'pending' })))
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
    setConfirmed(false)
  }

  return (
    <div>
      <PageHeader
        title="Bulk Visibility"
        desc="Change dozens of repos from public to private (or vice versa) in one click. GitHub has no bulk option for this."
        actions={
          <button className="btn-secondary btn-sm" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner spinner-sm" />Loading...</> : <><RefreshCw size={13} />Load repos</>}
          </button>
        }
      />

      <div style={{ background: 'var(--amber-dim)', border: '1px solid rgba(240,180,90,0.25)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <AlertTriangle size={15} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: 'var(--amber)', lineHeight: 1.6 }}>
          <strong>Making repos private</strong> may break existing forks, integrations, and GitHub Pages sites. Making repos public exposes their full commit history permanently.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24, maxWidth: 400 }}>
        {[
          { id: 'private', icon: Lock, label: 'Make Private', color: 'var(--amber)' },
          { id: 'public', icon: Unlock, label: 'Make Public', color: 'var(--blue)' },
        ].map(({ id, icon: Icon, label, color }) => (
          <div
            key={id}
            onClick={() => setTarget(id)}
            className="card"
            style={{
              cursor: 'pointer', padding: '14px 16px',
              border: target === id ? `1px solid ${color}` : '1px solid var(--border)',
              background: target === id ? 'var(--bg3)' : 'var(--bg2)',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <Icon size={16} color={color} />
            <span style={{ fontWeight: 500, fontSize: 13 }}>{label}</span>
          </div>
        ))}
      </div>

      {!fetched ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
          <Shield size={28} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          <p style={{ marginBottom: 16, fontSize: 13 }}>Load repos to select which ones to change</p>
          <button className="btn-primary" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner" />Loading...</> : 'Load my repos'}
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <RepoSelector repos={repos} selected={selected} onToggle={toggle} onSelectAll={selectAll} onDeselectAll={deselectAll} />
          </div>

          {selected.size > 0 && (
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ width: 14, height: 14, accentColor: 'var(--accent)' }} />
                I understand the risks and want to make {selected.size} repo{selected.size !== 1 ? 's' : ''} <strong>{target}</strong>
              </label>
            </div>
          )}

          <button className="btn-primary" disabled={selected.size === 0 || !confirmed} onClick={run}>
            <Shield size={14} />
            Apply to {selected.size} repo{selected.size !== 1 ? 's' : ''}
          </button>
          <ProgressLog items={progress} />
        </>
      )}
    </div>
  )
}
