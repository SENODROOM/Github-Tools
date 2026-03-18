import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Bell, Eye, Shield, Tag, Star, GitPullRequest, LogOut, Zap, Archive, Flame, Menu, X, ChevronRight, Activity } from 'lucide-react'

const NAV = [
  { to:'/github-notifications',             icon:Bell,     label:'Notifications'  },
  { to:'/github-notifications/streak',      icon:Flame,    label:'Streak Viewer'  },
  { to:'/github-notifications/health',      icon:Activity, label:'Repo Health'    },
  { to:'/github-notifications/bulk-watch',  icon:Eye,      label:'Bulk Watch'     },
  { to:'/github-notifications/visibility',  icon:Shield,   label:'Visibility'     },
  { to:'/github-notifications/topics',      icon:Tag,      label:'Topics'         },
  { to:'/github-notifications/stars',       icon:Star,     label:'Stars'          },
  { to:'/github-notifications/webhooks',    icon:Zap,      label:'Webhooks'       },
  { to:'/github-notifications/archive',     icon:Archive,  label:'Archive'        },
]

function NavList({ onNav }) {
  return (
    <>
      <div style={{fontSize:10,fontWeight:600,color:'var(--text3)',letterSpacing:'0.1em',textTransform:'uppercase',padding:'8px 10px 6px'}}>Tools</div>
      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to==='/github-notifications'} onClick={onNav}
          style={({ isActive }) => ({
            display:'flex', alignItems:'center', gap:9,
            padding:'8px 10px', borderRadius:'var(--radius-sm)',
            color: isActive?'var(--text)':'var(--text2)',
            background: isActive?'var(--bg4)':'transparent',
            border: isActive?'1px solid var(--border2)':'1px solid transparent',
            marginBottom:2, fontSize:13, fontWeight: isActive?500:400,
            transition:'all 0.15s', textDecoration:'none',
          })}
        >
          {({ isActive }) => <>
            <div style={{width:26,height:26,borderRadius:6,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:isActive?'var(--accent-dim)':'transparent',transition:'background 0.15s'}}>
              <Icon size={14} color={isActive?'var(--accent)':'currentColor'}/>
            </div>
            <span style={{flex:1}}>{label}</span>
            {isActive && <ChevronRight size={11} color="var(--text3)"/>}
          </>}
        </NavLink>
      ))}
    </>
  )
}

function SidebarInner({ user, onLogout, onNav }) {
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      {/* Logo */}
      <div style={{padding:'18px 16px 14px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:'var(--accent-dim)',border:'1px solid var(--accent-border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <GitPullRequest size={14} color="var(--accent)"/>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:600,letterSpacing:'-0.01em'}}>GitHub Tools</div>
            <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',marginTop:1}}>v2.0.0</div>
          </div>
        </div>
      </div>
      {/* User */}
      {user && (
        <div style={{padding:'10px 12px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:'var(--radius-sm)',background:'var(--bg3)',border:'1px solid var(--border)'}}>
            <div style={{position:'relative',flexShrink:0}}>
              <img src={user.avatar_url} alt="" style={{width:26,height:26,borderRadius:'50%',display:'block'}}/>
              <div style={{position:'absolute',bottom:-1,right:-1,width:7,height:7,borderRadius:'50%',background:'var(--green)',border:'1.5px solid var(--bg3)'}}/>
            </div>
            <div style={{minWidth:0,flex:1}}>
              <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.login}</div>
              <div style={{fontSize:10,color:'var(--text3)',marginTop:1}}>{user.public_repos} repos</div>
            </div>
          </div>
        </div>
      )}
      {/* Nav */}
      <nav style={{flex:1,padding:'8px 8px',overflowY:'auto'}}>
        <NavList onNav={onNav}/>
      </nav>
      {/* Footer */}
      <div style={{padding:'10px 8px',borderTop:'1px solid var(--border)',flexShrink:0}}>
        <button className="btn-ghost" style={{width:'100%',justifyContent:'flex-start',gap:9,fontSize:13}} onClick={onLogout}>
          <LogOut size={13}/> Sign out
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setOpen(false), [location.pathname])

  return (
    <>
      <style>{`
        .sb-desk {
          width: var(--sidebar-w);
          flex-shrink: 0;
          background: var(--bg2);
          border-right: 1px solid var(--border);
          height: 100%;
          overflow: hidden;
        }
        .sb-mob  { display: none; }
        .sb-over { display: none; }
        .sb-draw { display: none; }

        @media (max-width: 768px) {
          .sb-desk { display: none; }
          .sb-mob {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
            background: var(--bg2);
            border-bottom: 1px solid var(--border);
            padding: 0 16px;
            height: 50px;
            z-index: 50;
          }
          .sb-over {
            display: block;
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.65);
            z-index: 200;
            animation: fadeIn 0.2s ease;
          }
          .sb-draw {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0; left: 0; bottom: 0;
            width: 260px;
            background: var(--bg2);
            border-right: 1px solid var(--border);
            z-index: 201;
            animation: slideRight 0.25s var(--ease);
          }
        }
      `}</style>

      {/* Desktop */}
      <aside className="sb-desk">
        <SidebarInner user={user} onLogout={onLogout}/>
      </aside>

      {/* Mobile top bar */}
      <div className="sb-mob">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:26,height:26,borderRadius:7,background:'var(--accent-dim)',border:'1px solid var(--accent-border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <GitPullRequest size={13} color="var(--accent)"/>
          </div>
          <span style={{fontSize:13,fontWeight:600}}>GitHub Tools</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {user && <img src={user.avatar_url} alt="" style={{width:26,height:26,borderRadius:'50%'}}/>}
          <button className="btn-ghost btn-icon" onClick={()=>setOpen(true)} style={{padding:8}}>
            <Menu size={17}/>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && <>
        <div className="sb-over" onClick={()=>setOpen(false)}/>
        <div className="sb-draw">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 14px 8px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
            <span style={{fontSize:13,fontWeight:600}}>Menu</span>
            <button className="btn-ghost btn-icon" onClick={()=>setOpen(false)} style={{padding:7}}><X size={15}/></button>
          </div>
          <SidebarInner user={user} onLogout={onLogout} onNav={()=>setOpen(false)}/>
        </div>
      </>}
    </>
  )
}
