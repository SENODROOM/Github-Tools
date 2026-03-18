import { useState } from 'react'
import { Search } from 'lucide-react'

export default function RepoSelector({ repos, selected, onToggle, onSelectAll, onDeselectAll, extra }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = repos.filter(r => {
    const matchSearch = r.full_name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'public' && !r.private) || (filter === 'private' && r.private)
    return matchSearch && matchFilter
  })

  const allSelected = filtered.length > 0 && filtered.every(r => selected.has(r.full_name))

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
          <input placeholder="Search repos..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 30 }} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto', minWidth: 100 }}>
          <option value="all">All</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        {extra}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <label className="checkbox-row" style={{ padding: '4px 8px' }}>
          <input type="checkbox" checked={allSelected} onChange={e => e.target.checked ? onSelectAll(filtered) : onDeselectAll(filtered)} />
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>
            {selected.size} / {repos.length} selected
          </span>
        </label>
      </div>

      <div style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        maxHeight: 340,
        overflowY: 'auto',
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No repos match</div>
        ) : filtered.map((r, i) => (
          <label key={r.full_name} className="checkbox-row" style={{
            padding: '9px 14px',
            borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
            borderRadius: 0,
          }}>
            <input type="checkbox" checked={selected.has(r.full_name)} onChange={() => onToggle(r.full_name)} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.full_name}</div>
              {r.description && <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>}
            </div>
            <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
              <span className={`tag ${r.private ? 'tag-amber' : 'tag-green'}`}>{r.private ? 'private' : 'public'}</span>
              {r.language && <span className="tag tag-gray">{r.language}</span>}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
