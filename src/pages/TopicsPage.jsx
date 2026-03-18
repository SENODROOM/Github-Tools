import { useState } from 'react'
import { useGH } from '../context/GHContext'
import PageHeader from '../components/PageHeader'
import RepoSelector from '../components/RepoSelector'
import ProgressLog from '../components/ProgressLog'
import { Tag, Plus, X, RefreshCw } from 'lucide-react'

export default function TopicsPage() {
  const { api, fetchAllRepos } = useGH()
  const [repos, setRepos] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState([])
  const [fetched, setFetched] = useState(false)
  const [topicInput, setTopicInput] = useState('')
  const [topics, setTopics] = useState([])
  const [mode, setMode] = useState('add')

  async function load() {
    setLoading(true)
    try {
      const data = await fetchAllRepos()
      setRepos(data)
      setFetched(true)
    } catch {}
    setLoading(false)
  }

  function toggle(name) { setSelected(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n }) }
  function selectAll(list) { setSelected(s => { const n = new Set(s); list.forEach(r => n.add(r.full_name)); return n }) }
  function deselectAll(list) { setSelected(s => { const n = new Set(s); list.forEach(r => n.delete(r.full_name)); return n }) }

  function addTopic() {
    const t = topicInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '')
    if (t && !topics.includes(t) && t.length <= 50) {
      setTopics(prev => [...prev, t])
      setTopicInput('')
    }
  }

  function removeTopic(t) { setTopics(prev => prev.filter(x => x !== t)) }

  async function run() {
    if (!topics.length) return
    const list = repos.filter(r => selected.has(r.full_name))
    setProgress(list.map(r => ({ name: r.full_name, status: 'pending' })))
    for (let i = 0; i < list.length; i++) {
      const r = list[i]
      try {
        // Get current topics
        const current = await api(`/repos/${r.full_name}/topics`, {
          headers: { Accept: 'application/vnd.github.mercy-preview+json' }
        })
        let newTopics
        if (mode === 'add') {
          newTopics = [...new Set([...(current.names || []), ...topics])]
        } else if (mode === 'remove') {
          newTopics = (current.names || []).filter(t => !topics.includes(t))
        } else {
          newTopics = topics
        }
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
  }

  const SUGGESTED = ['react', 'nodejs', 'typescript', 'python', 'api', 'frontend', 'backend', 'fullstack', 'open-source', 'archived']

  return (
    <div>
      <PageHeader
        title="Bulk Topics"
        desc="Add, remove, or replace topics across many repos. GitHub only lets you edit one repo at a time."
        actions={
          <button className="btn-secondary btn-sm" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner spinner-sm" />Loading...</> : <><RefreshCw size={13} />Load repos</>}
          </button>
        }
      />

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 8 }}>Mode</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ id: 'add', label: 'Add topics' }, { id: 'remove', label: 'Remove topics' }, { id: 'replace', label: 'Replace all' }].map(m => (
              <button key={m.id} className={mode === m.id ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'} onClick={() => setMode(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 8 }}>Topics</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            placeholder="e.g. react, nodejs..."
            value={topicInput}
            onChange={e => setTopicInput(e.target.value)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ',') && (e.preventDefault(), addTopic())}
            style={{ flex: 1 }}
          />
          <button className="btn-secondary" onClick={addTopic}><Plus size={14} /></button>
        </div>

        {topics.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {topics.map(t => (
              <span key={t} className="tag tag-purple" style={{ cursor: 'pointer' }} onClick={() => removeTopic(t)}>
                {t} <X size={10} />
              </span>
            ))}
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Suggested:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {SUGGESTED.filter(t => !topics.includes(t)).map(t => (
            <span key={t} className="tag tag-gray" style={{ cursor: 'pointer' }} onClick={() => setTopics(p => [...p, t])}>{t}</span>
          ))}
        </div>
      </div>

      {!fetched ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
          <Tag size={28} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          <p style={{ marginBottom: 16, fontSize: 13 }}>Load repos to tag them</p>
          <button className="btn-primary" onClick={load} disabled={loading}>
            {loading ? <><div className="spinner" />Loading...</> : 'Load my repos'}
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <RepoSelector repos={repos} selected={selected} onToggle={toggle} onSelectAll={selectAll} onDeselectAll={deselectAll} />
          </div>
          <button className="btn-primary" disabled={selected.size === 0 || topics.length === 0} onClick={run}>
            <Tag size={14} />Apply to {selected.size} repo{selected.size !== 1 ? 's' : ''}
          </button>
          <ProgressLog items={progress} />
        </>
      )}
    </div>
  )
}
