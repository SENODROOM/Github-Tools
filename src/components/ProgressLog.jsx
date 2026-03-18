export default function ProgressLog({ items }) {
  if (!items.length) return null
  const done = items.filter(i => i.status !== 'pending').length
  const pct = Math.round((done / items.length) * 100)

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text2)' }}>
        <span>{done} / {items.length}</span>
        <span>{pct}%</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: 12 }}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
            {item.status === 'pending' && <div className="spinner spinner-sm" />}
            {item.status === 'ok' && <span style={{ color: 'var(--green)', fontSize: 14 }}>✓</span>}
            {item.status === 'error' && <span style={{ color: 'var(--red)', fontSize: 14 }}>✕</span>}
            {item.status === 'skip' && <span style={{ color: 'var(--amber)', fontSize: 12 }}>—</span>}
            <span style={{ flex: 1, color: item.status === 'error' ? 'var(--red)' : 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.name}
            </span>
            {item.msg && <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 11 }}>{item.msg}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
