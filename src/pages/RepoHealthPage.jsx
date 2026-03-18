import { useState } from 'react'
import { useGH } from '../context/GHContext'
import PageHeader from '../components/PageHeader'
import { Activity, AlertTriangle, CheckCircle, RefreshCw, ExternalLink, XCircle } from 'lucide-react'

function HealthBar({ score }) {
  const color = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s var(--ease)' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 30, textAlign: 'right', fontFamily: 'var(--mono)' }}>{score}</span>
    </div>
  )
}

function scoreRepo(r) {
  let score = 100
  const issues = []
  const now = new Date()
  const pushed = new Date(r.pushed_at)
  const daysSince = (now - pushed) / 86400000

  if (!r.description)       { score -= 15; issues.push({ sev: 'warn',  text: 'No description' }) }
  if (!r.license)           { score -= 10; issues.push({ sev: 'warn',  text: 'No license' }) }
  if (daysSince > 365)      { score -= 20; issues.push({ sev: 'error', text: `Inactive ${Math.round(daysSince / 30)}mo` }) }
  else if (daysSince > 90)  { score -= 10; issues.push({ sev: 'warn',  text: `Quiet ${Math.round(daysSince)}d` }) }
  if (!r.topics?.length)    { score -= 10; issues.push({ sev: 'info',  text: 'No topics' }) }
  if (r.open_issues_count > 20) { score -= 10; issues.push({ sev: 'warn', text: `${r.open_issues_count} open issues` }) }
  if (r.open_issues_count > 50) { score -= 10; issues.push({ sev: 'error', text: 'Too many issues' }) }
  if (!r.has_wiki && !r.homepage) { score -= 5; issues.push({ sev: 'info', text: 'No docs/wiki' }) }

  return { score: Math.max(0, score), issues }
}

export default function RepoHealthPage() {
  const { fetchAllRepos, api } = useGH()
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)
  const [sort, setSort] = useState('score')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    try {
      // fetch with topics
      let all = [], page = 1
      while (true) {
        const data = await api(`/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner`, {
          headers: { Accept: 'application/vnd.github.mercy-preview+json' }
        })
        if (!data.length) break
        all = all.concat(data)
        if (data.length < 100) break
        page++
      }
      setRepos(all.map(r => ({ ...r, health: scoreRepo(r) })))
      setFetched(true)
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  const scored = repos
    .filter(r => {
      if (filter === 'healthy') return r.health.score >= 70
      if (filter === 'warn')    return r.health.score >= 40 && r.health.score < 70
      if (filter === 'poor')    return r.health.score < 40
      return true
    })
    .filter(r => r.full_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'score' ? a.health.score - b.health.score : a.full_name.localeCompare(b.full_name))

  const avg = repos.length ? Math.round(repos.reduce((s, r) => s + r.health.score, 0) / repos.length) : 0
  const healthy = repos.filter(r => r.health.score >= 70).length
  const warn    = repos.filter(r => r.health.score >= 40 && r.health.score < 70).length
  const poor    = repos.filter(r => r.health.score < 40).length

  const sevIcon = { error: <XCircle size={11} color="var(--red)" />, warn: <AlertTriangle size={11} color="var(--amber)" />, info: <CheckCircle size={11} color="var(--blue)" /> }

  return (
    <div>
      <PageHeader
        title="Repo Health"
        desc="Audit all your repos for missing descriptions, licenses, stale activity, and more."
        badge={{ text: 'New', color: 'pink' }}
        actions={
          <button className="btn-secondary btn-sm" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner spinner-sm" />Scanning...</> : <><RefreshCw size={13} />Scan repos</>}
          </button>
        }
      />

      {!fetched ? (
        <div className="card" style={{ textAlign: 'center', padding: '52px 24px' }}>
          <Activity size={32} style={{ margin: '0 auto 16px', display: 'block', color: 'var(--text3)' }} />
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>Scan your repos for health issues</p>
          <button className="btn-primary" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner" />Scanning...</> : <><Activity size={14} />Run Health Scan</>}
          </button>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Avg Score', value: avg, color: avg >= 70 ? 'var(--green)' : avg >= 40 ? 'var(--amber)' : 'var(--red)' },
              { label: 'Healthy',   value: healthy, color: 'var(--green)' },
              { label: 'Warning',   value: warn,    color: 'var(--amber)' },
              { label: 'Poor',      value: poor,    color: 'var(--red)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card stat-card" style={{ textAlign: 'center', padding: '14px 12px' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color, marginBottom: 4, fontFamily: 'var(--mono)' }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <input placeholder="Search repos..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              {['all','healthy','warn','poor'].map(f => (
                <button key={f} className={filter === f ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ width: 'auto', minWidth: 110 }}>
              <option value="score">Sort: Score ↑</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>

          {/* Repo list */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {scored.map((r, i) => {
              const { score, issues } = r.health
              const color = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)'
              return (
                <div key={r.full_name} style={{
                  padding: '14px 16px',
                  borderBottom: i < scored.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg4)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: issues.length ? 8 : 0, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.full_name}
                      </div>
                      {r.description && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <div style={{ width: 100 }}><HealthBar score={score} /></div>
                      <a href={r.html_url} target="_blank" rel="noopener noreferrer">
                        <button className="btn-ghost btn-icon btn-sm"><ExternalLink size={11} /></button>
                      </a>
                    </div>
                  </div>
                  {issues.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {issues.map((iss, j) => (
                        <span key={j} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, color: iss.sev === 'error' ? 'var(--red)' : iss.sev === 'warn' ? 'var(--amber)' : 'var(--blue)',
                          background: iss.sev === 'error' ? 'var(--red-dim)' : iss.sev === 'warn' ? 'var(--amber-dim)' : 'var(--blue-dim)',
                          border: `1px solid ${iss.sev === 'error' ? 'var(--red-border)' : iss.sev === 'warn' ? 'var(--amber-border)' : 'var(--blue-border)'}`,
                          padding: '2px 7px', borderRadius: 20,
                        }}>
                          {sevIcon[iss.sev]} {iss.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
