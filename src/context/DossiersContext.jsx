import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from './AuthContext'

const DossiersContext = createContext({ dossiers: [], reload: () => {} })

export const useDossiers = () => useContext(DossiersContext)

export function DossiersProvider({ children }) {
  const { user } = useAuth()
  const [dossiers, setDossiers] = useState([])

  const reload = useCallback(async () => {
    if (!user) { setDossiers([]); return }
    try {
      const { data } = await api.get('/dossiers/')
      const list = data.results ?? data
      console.log('[DossiersContext] loaded', list.length, 'dossiers:', list.map(d => d.titre))
      setDossiers(list)
    } catch (err) {
      console.warn('[DossiersContext] failed to load dossiers — status:', err?.response?.status)
    }
  }, [user])

  useEffect(() => { reload() }, [reload])

  return (
    <DossiersContext.Provider value={{ dossiers, reload }}>
      {children}
    </DossiersContext.Provider>
  )
}
