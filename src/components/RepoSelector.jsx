import { useState } from 'react'
import { Search, Filter } from 'lucide-react'

export default function RepoSelector({ repos, selected, onToggle, onSelectAll, onDeselectAll, extra }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated')

  const filtered = repos
    .filter(r => {
      const matchSearch = r.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(search.toLowerCase())
      const matchFilter = filter === 'all' ||
        (filter === 'public' && !r.private) ||
        (filter === 'private' && r.private)
      return matchSearch && matchFilter
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.full_name.localeCompare(b.full_name)
      if (sortBy === 'stars') return (b.stargazers_count || 0) - (a.stargazers_count || 0)
      return new Date(b.updated_at) - new Date(a.updated_at)
    })

  const allSelected = filtered.length > 0 && filtered.every(r => selected.has(r.full_name))
  const someSelected = filtered.some(r => selected.has(r.full_name)) && !allSelected

  return (
    <div>
      {/* Filters row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
          <input placeholder="Search repos..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 28, fontSize: 12 }} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto', minWidth: 90, fontSize: 12 }}>
          <option value="all">All</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 'auto', minWidth: 100, fontSize: 12 }}>
          <option value="updated">Updated</option>
          <option value="name">Name</option>
          <option value="stars">Stars</option>
        </select>
        {extra}
      </div>

      {/* Select-all row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '0 2px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, color: 'var(--text2)', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={allSelected}
            ref={el => el && (el.indeterminate = someSelected)}
            onChange={e => e.target.checked ? onSelectAll(filtered) : onDeselectAll(filtered)}
            style={{ width: 13, height: 13, accentColor: 'var(--accent)', cursor: 'pointer' }}
          />
          <span>{selected.size} of {repos.length} selected</span>
        </label>
        {selected.size > 0 && (
          <button className="btn-ghost btn-xs" onClick={() => onDeselectAll(repos)} style={{ color: 'var(--text3)' }}>
            Clear
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>
          {filtered.length} shown
        </span>
      </div>

      {/* Repo list */}
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        maxHeight: 320,
        overflowY: 'auto',
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
            No repos match your filter
          </div>
        ) : filtered.map((r, i) => (
          <label key={r.full_name} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', cursor: 'pointer',
            borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
            background: selected.has(r.full_name) ? 'rgba(124,106,247,0.04)' : 'transparent',
            transition: 'background 0.15s',
            userSelect: 'none',
          }}
            onMouseEnter={e => { if (!selected.has(r.full_name)) e.currentTarget.style.background = 'var(--bg4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = selected.has(r.full_name) ? 'rgba(124,106,247,0.04)' : 'transparent' }}
          >
            <input
              type="checkbox"
              checked={selected.has(r.full_name)}
              onChange={() => onToggle(r.full_name)}
              style={{ width: 13, height: 13, accentColor: 'var(--accent)', flexShrink: 0, cursor: 'pointer' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                {r.full_name}
              </div>
              {r.description && (
                <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                  {r.description}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
              {r.stargazers_count > 0 && (
                <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                  ★ {r.stargazers_count}
                </span>
              )}
              {r.language && <span className="tag tag-gray" style={{ fontSize: 10, padding: '1px 6px' }}>{r.language}</span>}
              <span className={`tag ${r.private ? 'tag-amber' : 'tag-green'}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                {r.private ? 'priv' : 'pub'}
              </span>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
