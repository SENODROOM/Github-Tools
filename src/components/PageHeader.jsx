export default function PageHeader({ title, desc, actions }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      marginBottom: 28, gap: 16, flexWrap: 'wrap',
    }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{title}</h1>
        {desc && <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{desc}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  )
}
