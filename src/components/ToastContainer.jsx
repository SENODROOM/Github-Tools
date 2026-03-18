export default function ToastContainer({ toasts }) {
  if (!toasts.length) return null
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span style={{ fontSize:15, flexShrink:0 }}>
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
          </span>
          <span style={{ lineHeight:1.4 }}>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
