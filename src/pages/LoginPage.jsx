import { useState } from 'react'
import { useGH } from '../context/GHContext'
import { KeyRound, ExternalLink, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const { saveToken, saveUser, api } = useGH()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    setError('')
    try {
      saveToken(input.trim())
      const user = await api('/user')
      saveUser(user)
    } catch (e) {
      setError('Invalid token or insufficient permissions. Make sure it has repo + notifications scope.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <ShieldCheck size={24} color="var(--accent)" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, fontFamily: 'var(--serif)' }}>GitHub Tools</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Supercharge your GitHub workflow</p>
        </div>

        <div className="card fade-up" style={{ padding: 28 }}>
          <form onSubmit={handleLogin}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 8 }}>
              Personal Access Token
            </label>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <KeyRound size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ paddingLeft: 30 }}
                autoFocus
              />
            </div>
            {error && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(240,107,107,0.2)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 12, color: 'var(--red)', marginBottom: 16 }}>
                {error}
              </div>
            )}
            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
              {loading ? <><div className="spinner" />Connecting...</> : 'Connect GitHub'}
            </button>
          </form>

          <div className="divider" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Required scopes:</div>
            {['repo', 'notifications', 'admin:repo_hook'].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                <code>{s}</code>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo,notifications,admin:repo_hook&description=GitHub+Tools"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              Generate token on GitHub <ExternalLink size={11} />
            </a>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text3)' }}>
          Token stored locally in your browser only.
        </p>
      </div>
    </div>
  )
}
