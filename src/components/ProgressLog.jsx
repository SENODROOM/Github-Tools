export default function ProgressLog({ items }) {
  if (!items.length) return null
  const done = items.filter(i => i.status !== 'pending').length
  const ok   = items.filter(i => i.status === 'ok').length
  const fail = items.filter(i => i.status === 'error').length
  const pct  = Math.round((done / items.length) * 100)

  return (
    <div style={{ marginTop: 16 }} className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ color: 'var(--text2)' }}>{done}/{items.length} done</span>
          {ok   > 0 && <span style={{ color: 'var(--green)' }}>✓ {ok} ok</span>}
          {fail > 0 && <span style={{ color: 'var(--red)'   }}>✕ {fail} failed</span>}
        </div>
        <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{pct}%</span>
      </div>

      {/* Bar */}
      <div className="progress-bar" style={{ marginBottom: 12 }}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* List */}
      <div style={{
        maxHeight: 220, overflowY: 'auto',
        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px',
            borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
            fontSize: 12,
            background: item.status === 'ok' ? 'rgba(52,214,138,0.03)' : item.status === 'error' ? 'rgba(240,107,107,0.03)' : 'transparent',
            transition: 'background 0.3s',
          }}>
            {item.status === 'pending' && <div className="spinner spinner-sm" />}
            {item.status === 'ok'      && <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 13 }}>✓</span>}
            {item.status === 'error'   && <span style={{ color: 'var(--red)',   fontWeight: 600, fontSize: 13 }}>✕</span>}
            {item.status === 'skip'    && <span style={{ color: 'var(--amber)', fontWeight: 500, fontSize: 11 }}>—</span>}
            <span style={{
              flex: 1, color: item.status === 'error' ? 'var(--red)' : 'var(--text2)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontFamily: 'var(--mono)',
            }}>
              {item.name}
            </span>
            {item.msg && (
              <span style={{ color: 'var(--text3)', fontSize: 11, fontFamily: 'var(--mono)', flexShrink: 0 }}>
                {item.msg}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
