import { createContext, useContext, useState, useCallback } from 'react'

const GHContext = createContext(null)

export function GHProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('gh_token') || '')
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gh_user') || 'null') } catch { return null }
  })

  const saveToken = useCallback((t) => {
    setToken(t)
    localStorage.setItem('gh_token', t)
  }, [])

  const saveUser = useCallback((u) => {
    setUser(u)
    localStorage.setItem('gh_user', JSON.stringify(u))
  }, [])

  const logout = useCallback(() => {
    setToken('')
    setUser(null)
    localStorage.removeItem('gh_token')
    localStorage.removeItem('gh_user')
  }, [])

  const api = useCallback(async (path, opts = {}) => {
    const t = token || localStorage.getItem('gh_token')
    const res = await fetch(`https://api.github.com${path}`, {
      ...opts,
      headers: {
        Authorization: `token ${t}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
      body: opts.body ? (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)) : undefined,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `HTTP ${res.status}`)
    }
    if (res.status === 204) return null
    return res.json()
  }, [token])

  const fetchAllRepos = useCallback(async () => {
    let all = [], page = 1
    while (true) {
      const data = await api(`/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,collaborator`)
      if (!data.length) break
      all = all.concat(data)
      if (data.length < 100) break
      page++
    }
    return all
  }, [api])

  return (
    <GHContext.Provider value={{ token, user, saveToken, saveUser, logout, api, fetchAllRepos }}>
      {children}
    </GHContext.Provider>
  )
}

export function useGH() {
  return useContext(GHContext)
}
