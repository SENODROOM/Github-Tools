export default function PageHeader({ title, desc, actions, badge }) {
  return (
    <div className="page-enter" style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>{title}</h1>
            {badge && <span className={`tag tag-${badge.color || 'purple'}`}>{badge.text}</span>}
          </div>
          {desc && <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55, maxWidth: 520 }}>{desc}</p>}
        </div>
        {actions && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
