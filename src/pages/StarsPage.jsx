import { useState } from 'react'
import { useGH } from '../context/GHContext'
import PageHeader from '../components/PageHeader'
import ProgressLog from '../components/ProgressLog'
import { Star, Search, RefreshCw, Trash2, ExternalLink } from 'lucide-react'

export default function StarsPage() {
  const { api } = useGH()
  const [stars, setStars] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState([])
  const [fetched, setFetched] = useState(false)
  const [search, setSearch] = useState('')
  const [langFilter, setLangFilter] = useState('all')

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

  function toggle(name) { setSelected(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n }) }

  const languages = ['all', ...new Set(stars.map(r => r.language).filter(Boolean))]

  const filtered = stars.filter(r => {
    const matchSearch = r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(search.toLowerCase())
    const matchLang = langFilter === 'all' || r.language === langFilter
    return matchSearch && matchLang
  })

  const allSelected = filtered.length > 0 && filtered.every(r => selected.has(r.full_name))

  async function unstarSelected() {
    const list = stars.filter(r => selected.has(r.full_name))
    setProgress(list.map(r => ({ name: r.full_name, status: 'pending' })))
    for (let i = 0; i < list.length; i++) {
      const r = list[i]
      try {
        await api(`/user/starred/${r.full_name}`, { method: 'DELETE' })
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'ok', msg: 'unstarred' } : x))
      } catch (e) {
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'error', msg: e.message } : x))
      }
    }
    setStars(s => s.filter(r => !selected.has(r.full_name)))
    setSelected(new Set())
  }

  return (
    <div>
      <PageHeader
        title="Stars Manager"
        desc={`Bulk unstar repos to keep your stars list clean. GitHub has no multi-select for this.`}
        actions={
          <button className="btn-secondary btn-sm" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner spinner-sm" />Loading...</> : <><RefreshCw size={13} />Load stars</>}
          </button>
        }
      />

      {!fetched ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
          <Star size={28} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          <p style={{ marginBottom: 16, fontSize: 13 }}>Load your starred repos</p>
          <button className="btn-primary" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner" />Loading...</> : 'Load my stars'}
          </button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total starred', value: stars.length },
              { label: 'Filtered', value: filtered.length },
              { label: 'Selected', value: selected.size },
            ].map(({ label, value }) => (
              <div key={label} className="card" style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
              <input placeholder="Search stars..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 30 }} />
            </div>
            <select value={langFilter} onChange={e => setLangFilter(e.target.value)} style={{ width: 'auto', minWidth: 120 }}>
              {languages.map(l => <option key={l} value={l}>{l === 'all' ? 'All languages' : l}</option>)}
            </select>
          </div>

          {/* Select all row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <label className="checkbox-row" style={{ padding: '4px 8px' }}>
              <input type="checkbox" checked={allSelected} onChange={e => {
                if (e.target.checked) setSelected(s => { const n = new Set(s); filtered.forEach(r => n.add(r.full_name)); return n })
                else setSelected(s => { const n = new Set(s); filtered.forEach(r => n.delete(r.full_name)); return n })
              }} />
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>Select all visible</span>
            </label>
            {selected.size > 0 && (
              <button className="btn-danger btn-sm" onClick={unstarSelected}>
                <Trash2 size={13} />Unstar {selected.size} repo{selected.size !== 1 ? 's' : ''}
              </button>
            )}
          </div>

          {/* List */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No starred repos match</div>
            ) : filtered.map((r, i) => (
              <div key={r.full_name} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg4)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <input type="checkbox" checked={selected.has(r.full_name)} onChange={() => toggle(r.full_name)}
                  style={{ width: 14, height: 14, accentColor: 'var(--accent)', flexShrink: 0, cursor: 'pointer' }} />
                <Star size={13} color="var(--amber)" fill="var(--amber)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.full_name}</div>
                  {r.description && <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  {r.language && <span className="tag tag-gray">{r.language}</span>}
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>⭐ {r.stargazers_count?.toLocaleString()}</span>
                  <a href={r.html_url} target="_blank" rel="noopener noreferrer">
                    <button className="btn-ghost btn-icon btn-sm"><ExternalLink size={11} /></button>
                  </a>
                </div>
              </div>
            ))}
          </div>
          <ProgressLog items={progress} />
        </>
      )}
    </div>
  )
}
