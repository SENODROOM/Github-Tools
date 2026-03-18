import { useState } from 'react'
import { useGH } from '../context/GHContext'
import { KeyRound, ExternalLink, ShieldCheck, Github } from 'lucide-react'

const FEATURES = [
  { icon: '📬', label: 'Notification inbox' },
  { icon: '🔥', label: 'Streak & stats' },
  { icon: '🏥', label: 'Repo health audit' },
  { icon: '👁', label: 'Bulk watch repos' },
  { icon: '🔒', label: 'Bulk visibility' },
  { icon: '⚡', label: 'Webhook setup' },
]

export default function LoginPage() {
  const { saveToken, saveUser, api } = useGH()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [show, setShow] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true); setError('')
    try {
      saveToken(input.trim())
      const user = await api('/user')
      saveUser(user)
    } catch {
      setError('Invalid token or insufficient permissions.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: 'var(--bg)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,106,247,0.12) 0%, transparent 70%)',
        top: -150, left: -100, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232,121,160,0.08) 0%, transparent 70%)',
        bottom: -100, right: -50, pointerEvents: 'none',
      }} />

      <div style={{
        display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', position: 'relative', zIndex: 1,
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(124,106,247,0.25), rgba(124,106,247,0.06))',
              border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 0 32px rgba(124,106,247,0.2)',
            }}>
              <ShieldCheck size={26} color="var(--accent)" />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>
              GitHub Tools
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.5 }}>
              Supercharge your GitHub workflow
            </p>
          </div>

          {/* Feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 28 }}>
            {FEATURES.map(({ icon, label }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg3)', border: '1px solid var(--border)',
                fontSize: 12, color: 'var(--text2)',
                transition: 'border-color 0.2s',
              }}>
                <span style={{ fontSize: 15 }}>{icon}</span> {label}
              </div>
            ))}
          </div>

          {/* Login card */}
          <div className="card scale-in" style={{ padding: 28 }}>
            <form onSubmit={handleLogin}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 7 }}>
                Personal Access Token
              </label>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <KeyRound size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
                <input
                  type={show ? 'text' : 'password'}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  style={{ paddingLeft: 32, paddingRight: 40 }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="btn-ghost btn-icon"
                  style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', padding: 5, fontSize: 11, color: 'var(--text3)' }}
                >
                  {show ? '🙈' : '👁'}
                </button>
              </div>

              {error && (
                <div style={{
                  background: 'var(--red-dim)', border: '1px solid var(--red-border)',
                  borderRadius: 'var(--radius-sm)', padding: '9px 12px',
                  fontSize: 12, color: 'var(--red)', marginBottom: 14,
                  animation: 'fadeUp 0.2s var(--ease)',
                }}>
                  {error}
                </div>
              )}

              <button className="btn-primary" type="submit" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }}>
                {loading ? <><div className="spinner" />Connecting...</> : 'Connect GitHub'}
              </button>
            </form>

            <div className="divider" />

            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>Required scopes:</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {['repo', 'notifications', 'admin:repo_hook'].map(s => (
                <code key={s}>{s}</code>
              ))}
            </div>

            <a
              href="https://github.com/settings/tokens/new?scopes=repo,notifications,admin:repo_hook&description=GitHub+Tools"
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12, color: 'var(--accent)' }}
            >
              Generate token on GitHub <ExternalLink size={11} />
            </a>
          </div>

          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 11, color: 'var(--text3)' }}>
            Token stored locally · never sent to any server
          </p>
        </div>
      </div>
    </div>
  )
}
