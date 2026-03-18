import { useState, useEffect, useRef, useCallback } from 'react'
import { useGH } from '../context/GHContext'

function fmtDate(str) {
  const d = new Date(str + 'T00:00:00')
  const M = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const n = d.getDate()
  const s = [1,21,31].includes(n)?'st':[2,22].includes(n)?'nd':[3,23].includes(n)?'rd':'th'
  return `${M[d.getMonth()]} ${n}${s}`
}

async function gql(query, vars, token) {
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: vars }),
  })
  if (!r.ok) throw new Error(r.status === 401 ? 'Invalid token.' : `GitHub error ${r.status}`)
  const j = await r.json()
  if (j.errors) throw new Error(j.errors[0].message)
  return j.data
}

async function loadStats(login, token) {
  const d = await gql(`query($u:String!){user(login:$u){
    name login avatarUrl bio
    followers{totalCount}
    repositories(first:100,ownerAffiliations:OWNER,privacy:PUBLIC){totalCount}
    contributionsCollection{
      contributionCalendar{totalContributions weeks{contributionDays{contributionCount date}}}
      totalCommitContributions totalIssueContributions
      totalPullRequestContributions totalPullRequestReviewContributions
    }
  }}`, { u: login }, token)

  if (!d.user) throw new Error('User not found')
  const u = d.user, cal = u.contributionsCollection.contributionCalendar
  const days = cal.weeks.flatMap(w => w.contributionDays.map(x => ({ date: x.date, count: x.contributionCount })))
  const today = new Date().toISOString().split('T')[0]

  let cur = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) cur++
    else if (days[i].date < today) break
  }
  let lng = 0, tmp = 0
  days.forEach(d => { if (d.count > 0) { tmp++; lng = Math.max(lng, tmp) } else tmp = 0 })

  let priv = 0
  try {
    const d2 = await gql(`query($u:String!){user(login:$u){repositories(first:100,ownerAffiliations:OWNER,privacy:PRIVATE){totalCount}}}`, { u: login }, token)
    priv = d2.user?.repositories?.totalCount || 0
  } catch {}

  const c = u.contributionsCollection
  return {
    name: u.name||u.login, login: u.login, avatarUrl: u.avatarUrl, bio: u.bio,
    followers: u.followers.totalCount,
    publicRepos: u.repositories.totalCount, privateRepos: priv,
    totalRepos: u.repositories.totalCount + priv,
    totalContributions: cal.totalContributions,
    commits: c.totalCommitContributions, issues: c.totalIssueContributions,
    pullRequests: c.totalPullRequestContributions, reviews: c.totalPullRequestReviewContributions,
    currentStreak: cur, longestStreak: lng, days,
  }
}

// Singleton Chart.js loader — never adds duplicate <script> tags
let _cjsLoaded = false, _cjsCallbacks = []
function ensureChartJs(cb) {
  if (_cjsLoaded) { cb(); return }
  _cjsCallbacks.push(cb)
  if (_cjsCallbacks.length > 1) return          // already loading
  const s = document.createElement('script')
  s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
  s.onload = () => { _cjsLoaded = true; _cjsCallbacks.forEach(f => f()); _cjsCallbacks = [] }
  document.head.appendChild(s)
}

/* ── Line chart ── */
function LineChart({ days }) {
  const canvasRef = useRef(null)
  const chartRef  = useRef(null)
  const hovered   = useRef(false)
  const [zoom, setZoom] = useState(365)
  const LABELS = { 7:'7 Days',14:'2 Weeks',30:'1 Month',60:'2 Months',90:'3 Months',180:'6 Months',365:'1 Year' }

  const build = useCallback(() => {
    if (!canvasRef.current || !window.Chart) return
    chartRef.current?.destroy()
    const slice = days.slice(-zoom)
    chartRef.current = new window.Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: slice.map(d => new Date(d.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})),
        datasets: [{
          data: slice.map(d => d.count),
          borderColor:'#818cf8', backgroundColor:'rgba(129,140,248,0.08)',
          borderWidth:2, fill:true, tension:0.4,
          pointRadius:0, pointHoverRadius:5,
          pointBackgroundColor:'#818cf8', pointBorderColor:'#fff', pointBorderWidth:2,
        }],
      },
      options: {
        responsive:true, maintainAspectRatio:true, aspectRatio:2.8,
        animation:{ duration:250 },
        plugins:{
          legend:{display:false},
          tooltip:{
            backgroundColor:'rgba(15,23,42,0.97)',titleColor:'#f1f5f9',bodyColor:'#94a3b8',
            borderColor:'rgba(129,140,248,0.4)',borderWidth:1,padding:12,displayColors:false,
            callbacks:{
              title: ctx => new Date(slice[ctx[0].dataIndex].date+'T00:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'}),
              label: ctx => `${ctx.parsed.y} contribution${ctx.parsed.y!==1?'s':''}`,
            },
          },
        },
        scales:{
          x:{grid:{color:'rgba(51,65,85,0.3)'},ticks:{color:'#94a3b8',maxRotation:0,autoSkip:true,maxTicksLimit:12}},
          y:{beginAtZero:true,grid:{color:'rgba(51,65,85,0.3)'},ticks:{color:'#94a3b8',precision:0}},
        },
        interaction:{intersect:false,mode:'index'},
      },
    })
  }, [zoom, days])

  useEffect(() => {
    if (window.Chart) { build(); return }
    ensureChartJs(build)
    return () => { chartRef.current?.destroy(); chartRef.current = null }
  }, [build])

  useEffect(() => {
    const el = canvasRef.current; if (!el) return
    const enter = () => { hovered.current = true }
    const leave = () => { hovered.current = false }
    const wheel = e => {
      if (!hovered.current) return
      e.preventDefault(); e.stopPropagation()
      const L = [7,14,30,60,90,180,365]
      setZoom(p => { const i = L.indexOf(p); return e.deltaY<0&&i>0?L[i-1]:e.deltaY>0&&i<L.length-1?L[i+1]:p })
    }
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    el.addEventListener('wheel', wheel, { passive:false })
    return () => { el.removeEventListener('mouseenter',enter); el.removeEventListener('mouseleave',leave); el.removeEventListener('wheel',wheel) }
  }, [])

  return (
    <div style={{background:'rgba(30,41,59,0.6)',border:'1px solid #334155',borderRadius:16,padding:24,marginBottom:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <h3 style={{fontSize:'1.05rem',margin:0,color:'#f1f5f9'}}>
          📈 Contributions Over Time
          <span style={{fontSize:'0.7rem',fontWeight:500,color:'#818cf8',background:'rgba(129,140,248,0.15)',padding:'3px 10px',borderRadius:6,marginLeft:10,border:'1px solid rgba(129,140,248,0.3)'}}>
            {LABELS[zoom]}
          </span>
        </h3>
        {zoom!==365&&<button onClick={()=>setZoom(365)} style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:8,padding:'6px 14px',fontSize:'0.78rem',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Reset</button>}
      </div>
      <canvas ref={canvasRef}/>
      <p style={{textAlign:'center',color:'#64748b',fontSize:'0.75rem',marginTop:10}}>💡 Hover + scroll to zoom</p>
    </div>
  )
}

/* ── Calendar grid ── */
function CalGrid({ days }) {
  const [tip, setTip] = useState(null)
  return (
    <div style={{background:'rgba(30,41,59,0.6)',border:'1px solid #334155',borderRadius:16,padding:24,marginBottom:16}}>
      <h3 style={{fontSize:'1.05rem',marginBottom:18,color:'#f1f5f9'}}>📊 Contribution Calendar</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,13px)',gap:3,padding:10,background:'rgba(15,23,42,0.5)',borderRadius:10,overflowX:'auto'}}>
        {days.map((d,i)=>{
          const lvl=d.count>10?4:d.count>6?3:d.count>3?2:d.count>0?1:0
          const bg=['rgba(51,65,85,0.4)','rgba(34,197,94,0.35)','rgba(34,197,94,0.55)','rgba(34,197,94,0.78)','rgba(34,197,94,1)'][lvl]
          return <div key={i} style={{width:13,height:13,borderRadius:2,background:bg,cursor:'pointer',transition:'transform 0.1s'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.5)';setTip({x:e.clientX,y:e.clientY,...d})}}
            onMouseMove={e=>setTip(t=>t?{...t,x:e.clientX,y:e.clientY}:null)}
            onMouseLeave={e=>{e.currentTarget.style.transform='';setTip(null)}}
          />
        })}
      </div>
      {tip&&<div style={{position:'fixed',left:tip.x-60,top:tip.y-52,background:'#1a1a2e',border:'1px solid #334155',color:'#f1f5f9',padding:'7px 12px',borderRadius:8,fontSize:12,pointerEvents:'none',zIndex:9999,whiteSpace:'nowrap',boxShadow:'0 8px 24px rgba(0,0,0,0.6)'}}>
        {tip.count} {tip.count===1?'contribution':'contributions'} on {fmtDate(tip.date)}
      </div>}
    </div>
  )
}

/* ── Page ── */
export default function StreakViewerPage() {
  const { token, user } = useGH()
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const once = useRef(false)

  const fetch = useCallback(async () => {
    if (!token || !user) return
    setLoading(true); setError('')
    try   { setStats(await loadStats(user.login, token)) }
    catch (e) { setError(e.message) }
    setLoading(false)
  }, [token, user])

  useEffect(() => {
    if (once.current || !token || !user) return
    once.current = true
    fetch()
  }, [fetch])

  const repoLine = stats
    ? stats.privateRepos>0
      ? `📦 ${stats.totalRepos} repos (${stats.publicRepos} pub · ${stats.privateRepos} priv)`
      : `📦 ${stats.totalRepos} repositories`
    : ''

  return (
    <>
      <style>{`
        .sv-page {
          min-height: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #f1f5f9;
          /* Gradient on the element itself — NOT position:fixed */
          background:
            radial-gradient(ellipse 90% 50% at 10% 0%,   rgba(99,102,241,0.2)  0%, transparent 55%),
            radial-gradient(ellipse 70% 50% at 90% 100%, rgba(139,92,246,0.15) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 50% 50%,  rgba(236,72,153,0.06) 0%, transparent 55%),
            #0f172a;
        }
        .sv-inner  { max-width:900px; margin:0 auto; padding:0 20px 48px; }
        .sv-hdr    { text-align:center; padding:44px 20px 32px; }
        .sv-title  {
          font-size:clamp(1.8rem,5vw,3.2rem); font-weight:800; letter-spacing:-0.025em; margin-bottom:10px;
          background:linear-gradient(135deg,#818cf8 0%,#a78bfa 45%,#f472b6 100%);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .sv-sub    { color:#64748b; font-size:1rem; }
        .sv-loader { display:flex;flex-direction:column;align-items:center;gap:16px;padding:80px 24px; }
        .sv-spin   { width:48px;height:48px;border:4px solid rgba(129,140,248,0.18);border-top-color:#818cf8;border-radius:50%;animation:sv-rot 0.7s linear infinite; }
        @keyframes sv-rot { to { transform:rotate(360deg); } }
        .sv-loader p { color:#818cf8;font-size:0.95rem; }
        .sv-err    { max-width:480px;margin:0 auto;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:14px;padding:20px 24px;color:#fca5a5;font-size:0.9rem; }
        .sv-retry  { margin-top:14px;padding:10px 20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:0.875rem;font-weight:600;font-family:inherit;transition:transform 0.15s,box-shadow 0.15s; }
        .sv-retry:hover { transform:translateY(-1px);box-shadow:0 8px 24px rgba(99,102,241,0.35); }
        .sv-ucard  { display:flex;align-items:center;gap:20px;padding:22px 24px;background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.06));border:1px solid rgba(99,102,241,0.18);border-radius:18px;margin-bottom:20px;flex-wrap:wrap; }
        .sv-ava    { width:80px;height:80px;border-radius:50%;border:3px solid #6366f1;box-shadow:0 6px 20px rgba(99,102,241,0.3);flex-shrink:0; }
        .sv-uname  { font-size:1.5rem;font-weight:700;margin-bottom:2px;color:#f1f5f9; }
        .sv-handle { color:#94a3b8;font-size:0.9rem;margin-bottom:8px; }
        .sv-bio    { color:#94a3b8;font-size:0.875rem;line-height:1.5;margin-bottom:8px; }
        .sv-meta   { display:flex;gap:14px;flex-wrap:wrap;color:#94a3b8;font-size:0.875rem; }
        .sv-grid   { display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:14px;margin-bottom:20px; }
        .sv-card   { background:rgba(30,41,59,0.65);border:1px solid #334155;border-radius:14px;padding:20px 14px;text-align:center;transition:transform 0.2s,border-color 0.2s,box-shadow 0.2s;position:relative;overflow:hidden; }
        .sv-card::before { content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899);transform:scaleX(0);transition:transform 0.25s; }
        .sv-card:hover { transform:translateY(-4px);border-color:#6366f1;box-shadow:0 12px 28px rgba(99,102,241,0.2); }
        .sv-card:hover::before { transform:scaleX(1); }
        .sv-val    { font-size:2rem;font-weight:800;margin-bottom:6px;background:linear-gradient(135deg,#818cf8,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
        .sv-lbl    { color:#94a3b8;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.08em;font-weight:600; }
        .sv-note   { background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.22);color:#93c5fd;padding:14px 18px;border-radius:12px;font-size:0.875rem;line-height:1.6; }
        @media(max-width:600px){
          .sv-inner { padding:0 12px 32px; }
          .sv-hdr   { padding:28px 12px 20px; }
          .sv-ava   { width:60px;height:60px; }
          .sv-uname { font-size:1.25rem; }
          .sv-ucard { padding:16px; }
          .sv-grid  { grid-template-columns:1fr 1fr;gap:10px; }
          .sv-val   { font-size:1.6rem; }
        }
      `}</style>

      <div className="sv-page">
        <div className="sv-inner">
          <div className="sv-hdr">
            <h1 className="sv-title">🔥 GitHub Streak Viewer</h1>
            <p className="sv-sub">Track your GitHub journey with beautiful insights</p>
          </div>

          {loading && (
            <div className="sv-loader">
              <div className="sv-spin"/>
              <p>Fetching your GitHub stats…</p>
            </div>
          )}

          {!loading && error && (
            <div className="sv-err">
              <strong>⚠ {error}</strong>
              <div><button className="sv-retry" onClick={fetch}>Retry</button></div>
            </div>
          )}

          {!loading && stats && <>
            <div className="sv-ucard">
              <img src={stats.avatarUrl} alt={stats.login} className="sv-ava"/>
              <div style={{flex:1,minWidth:0}}>
                <div className="sv-uname">{stats.name}</div>
                <div className="sv-handle">@{stats.login}</div>
                {stats.bio && <div className="sv-bio">{stats.bio}</div>}
                <div className="sv-meta">
                  <span>{repoLine}</span>
                  <span>👥 {stats.followers.toLocaleString()} followers</span>
                </div>
              </div>
            </div>

            <div className="sv-grid">
              {[
                [stats.totalContributions.toLocaleString(), 'Total Contributions'],
                [stats.commits.toLocaleString(),            'Commits'],
                [stats.currentStreak,                       '🔥 Current Streak'],
                [stats.longestStreak,                       'Longest Streak'],
                [stats.pullRequests.toLocaleString(),       'Pull Requests'],
                [stats.issues.toLocaleString(),             'Issues'],
              ].map(([v,l]) => (
                <div key={l} className="sv-card">
                  <div className="sv-val">{v}</div>
                  <div className="sv-lbl">{l}</div>
                </div>
              ))}
            </div>

            <LineChart days={stats.days}/>
            <CalGrid  days={stats.days}/>

            <div className="sv-note">
              ✨ Stats fetched via GitHub's GraphQL API · last year's contributions
            </div>
          </>}
        </div>
      </div>
    </>
  )
}
