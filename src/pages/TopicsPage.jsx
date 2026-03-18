import { useState } from 'react'
import { useGH } from '../context/GHContext'
import PageHeader from '../components/PageHeader'
import RepoSelector from '../components/RepoSelector'
import ProgressLog from '../components/ProgressLog'
import { Tag, Plus, X, RefreshCw, Play, Sparkles } from 'lucide-react'

const SUGGESTED = [
  'react', 'nodejs', 'typescript', 'python', 'api', 'frontend',
  'backend', 'fullstack', 'open-source', 'cli', 'library', 'tool',
  'web', 'mobile', 'docker', 'machine-learning', 'data-science',
]

const MODES = [
  { id: 'add',     label: 'Add',     desc: 'Append topics to existing ones' },
  { id: 'remove',  label: 'Remove',  desc: 'Remove specific topics' },
  { id: 'replace', label: 'Replace', desc: 'Replace all topics with new set' },
]

export default function TopicsPage() {
  const { api, fetchAllRepos } = useGH()
  const [repos, setRepos]       = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading]   = useState(false)
  const [running, setRunning]   = useState(false)
  const [progress, setProgress] = useState([])
  const [fetched, setFetched]   = useState(false)
  const [topicInput, setTopicInput] = useState('')
  const [topics, setTopics]     = useState([])
  const [mode, setMode]         = useState('add')

  async function load() {
    setLoading(true)
    try {
      const data = await fetchAllRepos()
      setRepos(data)
      setFetched(true)
    } catch {}
    setLoading(false)
  }

  function toggle(name)      { setSelected(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n }) }
  function selectAll(list)   { setSelected(s => { const n = new Set(s); list.forEach(r => n.add(r.full_name));    return n }) }
  function deselectAll(list) { setSelected(s => { const n = new Set(s); list.forEach(r => n.delete(r.full_name)); return n }) }

  function addTopic(raw = topicInput) {
    const t = raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)
    if (t && !topics.includes(t)) { setTopics(p => [...p, t]); setTopicInput('') }
  }

  function handleInputKey(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTopic() }
  }

  async function run() {
    if (!topics.length) return
    const list = repos.filter(r => selected.has(r.full_name))
    setProgress(list.map(r => ({ name: r.full_name, status: 'pending' })))
    setRunning(true)
    for (let i = 0; i < list.length; i++) {
      const r = list[i]
      try {
        const current = await api(`/repos/${r.full_name}/topics`, {
          headers: { Accept: 'application/vnd.github.mercy-preview+json' }
        })
        let newTopics
        if (mode === 'add')     newTopics = [...new Set([...(current.names || []), ...topics])]
        else if (mode === 'remove') newTopics = (current.names || []).filter(t => !topics.includes(t))
        else                    newTopics = topics
        await api(`/repos/${r.full_name}/topics`, {
          method: 'PUT',
          headers: { Accept: 'application/vnd.github.mercy-preview+json' },
          body: { names: newTopics },
        })
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'ok', msg: `${newTopics.length} topics` } : x))
      } catch (e) {
        setProgress(p => p.map((x, j) => j === i ? { ...x, status: 'error', msg: e.message } : x))
      }
    }
    setRunning(false)
  }

  return (
    <div>
      <PageHeader
        title="Bulk Topics"
        desc="Add, remove, or replace topics across many repos instantly. GitHub only lets you edit one repo at a time."
        actions={
          <button className="btn-secondary btn-sm" onClick={load} disabled={loading || running}>
            {loading ? <><div className="spinner spinner-sm" />Loading...</> : <><RefreshCw size={13} />Load repos</>}
          </button>
        }
      />

      <div className="card" style={{ marginBottom: 16 }}>
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: 4 }}>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                flex: 1, padding: '6px 10px', borderRadius: 5, fontSize: 12, fontWeight: 500,
                background: mode === m.id ? 'var(--bg)' : 'transparent',
                color: mode === m.id ? 'var(--text)' : 'var(--text3)',
                border: mode === m.id ? '1px solid var(--border2)' : '1px solid transparent',
                transition: 'all 0.18s',
                boxShadow: mode === m.id ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>
          {MODES.find(m2 => m2.id === mode)?.desc}
        </div>

        {/* Topic input */}
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 8 }}>Topics</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            placeholder="Type a topic and press Enter..."
            value={topicInput}
            onChange={e => setTopicInput(e.target.value)}
            onKeyDown={handleInputKey}
            style={{ flex: 1 }}
          />
          <button className="btn-secondary" onClick={() => addTopic()} disabled={!topicInput.trim()}>
            <Plus size={14} />
          </button>
        </div>

        {/* Active topics */}
        {topics.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {topics.map(t => (
              <span
                key={t}
                className="tag tag-purple"
                style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                onClick={() => setTopics(p => p.filter(x => x !== t))}
                title="Click to remove"
              >
                {t} <X size={9} />
              </span>
            ))}
          </div>
        )}

        {/* Suggestions */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={11} /> Suggestions
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {SUGGESTED.filter(t => !topics.includes(t)).map(t => (
              <span
                key={t}
                className="tag tag-gray"
                style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                onClick={() => { if (!topics.includes(t)) setTopics(p => [...p, t]) }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-border)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = ''}
              >
                + {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {!fetched ? (
        <div className="card" style={{ textAlign: 'center', padding: '52px 24px' }}>
          <Tag size={32} style={{ margin: '0 auto 14px', display: 'block', color: 'var(--text3)' }} />
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>Load repos to tag them</p>
          <button className="btn-primary" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner" />Loading...</> : 'Load my repos'}
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <RepoSelector repos={repos} selected={selected} onToggle={toggle} onSelectAll={selectAll} onDeselectAll={deselectAll} />
          </div>
          <button
            className="btn-primary"
            disabled={selected.size === 0 || topics.length === 0 || running}
            onClick={run}
          >
            {running
              ? <><div className="spinner" />Applying...</>
              : <><Play size={13} />{mode === 'add' ? 'Add' : mode === 'remove' ? 'Remove' : 'Replace'} topics on {selected.size} repo{selected.size !== 1 ? 's' : ''}</>}
          </button>
          <ProgressLog items={progress} />
        </>
      )}
    </div>
  )
}
