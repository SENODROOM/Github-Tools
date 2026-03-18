import { useState } from 'react'
import { useGH } from '../context/GHContext'
import PageHeader from '../components/PageHeader'
import ProgressLog from '../components/ProgressLog'
import { Star, Search, RefreshCw, Trash2, ExternalLink, TrendingUp } from 'lucide-react'

export default function StarsPage() {
  const { api } = useGH()
  const [stars, setStars]       = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading]   = useState(false)
  const [running, setRunning]   = useState(false)
  const [progress, setProgress] = useState([])
  const [fetched, setFetched]   = useState(false)
  const [search, setSearch]     = useState('')
  const [langFilter, setLangFilter] = useState('all')
  const [sortBy, setSortBy]     = useState('starred')

  async function load() {
    setLoading(true)
    try {
      let all = [], page = 1
      while (true) {
        const data = await api(`/user/starred?per_page=100&page=${page}`)
        if (!data.length) break
        all = all.concat(data)
        if (data.length < 100) break
        page++
      }
      setStars(all)
      setFetched(true)
    } catch {}
    setLoading(false)
  }

  function toggle(name) {
    setSelected(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n })
  }

  const languages = ['all', ...new Set(stars.map(r => r.language).filter(Boolean)).values()]

  const filtered = stars
    .filter(r => {
      const ms = r.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(search.toLowerCase())
      const ml = langFilter === 'all' || r.language === langFilter
      return ms && ml
    })
    .sort((a, b) => {
      if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count
      if (sortBy === 'name')  return a.full_name.localeCompare(b.full_name)
      if (sortBy === 'updated') return new Date(b.updated_at) - new Date(a.updated_at)
      return 0
    })

  const allSelected   = filtered.length > 0 && filtered.every(r => selected.has(r.full_name))
  const someSelected  = filtered.some(r => selected.has(r.full_name)) && !allSelected

  async function unstar() {
    const list = stars.filter(r => selected.has(r.full_name))
    setProgress(list.map(r => ({ name: r.full_name, status: 'pending' })))
    setRunning(true)
    for (let i = 0; i < list.length; i++) {
      try {
        await api(`/user/starred/${list[i].full_name}`, { method: 'DELETE' })
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'ok', msg: 'unstarred' } : x))
      } catch (e) {
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'error', msg: e.message } : x))
      }
    }
    setStars(s => s.filter(r => !selected.has(r.full_name)))
    setSelected(new Set())
    setRunning(false)
  }

  return (
    <div>
      <PageHeader
        title="Stars Manager"
        desc="Browse, filter, and bulk-unstar repos. GitHub has no multi-select — this makes cleanup effortless."
        actions={
          <button className="btn-secondary btn-sm" onClick={load} disabled={loading || running}>
            {loading ? <><div className="spinner spinner-sm" />Loading...</> : <><RefreshCw size={13} />Load stars</>}
          </button>
        }
      />

      {!fetched ? (
        <div className="card" style={{ textAlign: 'center', padding: '52px 24px' }}>
          <Star size={32} style={{ margin: '0 auto 14px', display: 'block', color: 'var(--text3)' }} />
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>Load your starred repos</p>
          <button className="btn-primary" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner" />Loading...</> : 'Load my stars'}
          </button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 18 }}>
            {[
              { label: 'Total starred', value: stars.length,   icon: '⭐' },
              { label: 'Shown',         value: filtered.length, icon: '👁' },
              { label: 'Selected',      value: selected.size,   icon: '✓', color: selected.size ? 'var(--accent)' : undefined },
              { label: 'Languages',     value: languages.length - 1, icon: '💻' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="card stat-card" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>{label}</span>
                  <span style={{ fontSize: 13 }}>{icon}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)', color: color || 'var(--text)' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
              <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
              <input placeholder="Search stars..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 28 }} />
            </div>
            <select value={langFilter} onChange={e => setLangFilter(e.target.value)} style={{ width: 'auto', minWidth: 120 }}>
              {languages.map(l => <option key={l} value={l}>{l === 'all' ? 'All languages' : l}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 'auto', minWidth: 110 }}>
              <option value="starred">By starred</option>
              <option value="stars">By ⭐ count</option>
              <option value="name">By name</option>
              <option value="updated">By updated</option>
            </select>
          </div>

          {/* Action row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, color: 'var(--text2)', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => el && (el.indeterminate = someSelected)}
                onChange={e => {
                  if (e.target.checked) setSelected(s => { const n = new Set(s); filtered.forEach(r => n.add(r.full_name)); return n })
                  else setSelected(s => { const n = new Set(s); filtered.forEach(r => n.delete(r.full_name)); return n })
                }}
                style={{ width: 13, height: 13, accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              Select all visible ({filtered.length})
            </label>
            {selected.size > 0 && (
              <button className="btn-danger btn-sm" onClick={unstar} disabled={running} style={{ animation: 'fadeIn 0.2s' }}>
                {running ? <div className="spinner spinner-sm" /> : <Trash2 size={12} />}
                Unstar {selected.size}
              </button>
            )}
          </div>

          {/* List */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No starred repos match</div>
            ) : filtered.map((r, i) => {
              const isSelected = selected.has(r.full_name)
              return (
                <div
                  key={r.full_name}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    background: isSelected ? 'rgba(124,106,247,0.04)' : 'transparent',
                    transition: 'background 0.15s',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggle(r.full_name)}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg4)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(124,106,247,0.04)' : 'transparent' }}
                >
                  <input
                    type="checkbox" checked={isSelected}
                    onChange={() => toggle(r.full_name)}
                    onClick={e => e.stopPropagation()}
                    style={{ width: 13, height: 13, accentColor: 'var(--accent)', flexShrink: 0, cursor: 'pointer' }}
                  />
                  <Star size={12} color="var(--amber)" fill="var(--amber)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.full_name}</div>
                    {r.description && <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{r.description}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    {r.language && <span className="tag tag-gray" style={{ fontSize: 10, padding: '1px 6px' }}>{r.language}</span>}
                    <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                      ★ {(r.stargazers_count || 0).toLocaleString()}
                    </span>
                    <a href={r.html_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                      <button className="btn-ghost btn-icon btn-sm"><ExternalLink size={11} /></button>
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
          <ProgressLog items={progress} />
        </>
      )}
    </div>
  )
}
