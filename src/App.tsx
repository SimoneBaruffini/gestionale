import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Anagrafica from './pages/Anagrafica'
import Magazzino from './pages/Magazzino'
import Vendite from './pages/Vendite'
import Fatturazione from './pages/Fatturazione'
import Contabilita from './pages/Contabilita'
import CRM from './pages/CRM'
import Documenti from './pages/Documenti'
import HR from './pages/HR'
import Progetti from './pages/Progetti'
import Impostazioni from './pages/Impostazioni'

function App() {
  const [utente, setUtente] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Controlla se l'utente è già loggato
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUtente(session?.user ?? null)
      setLoading(false)
    })

    // Ascolta cambiamenti di login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUtente(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Caricamento...</p>
    </div>
  )

  // Se non loggato mostra login
  if (!utente) return <Login />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="anagrafica" element={<Anagrafica />} />
          <Route path="magazzino" element={<Magazzino />} />
          <Route path="vendite" element={<Vendite />} />
          <Route path="fatturazione" element={<Fatturazione />} />
          <Route path="contabilita" element={<Contabilita />} />
          <Route path="crm" element={<CRM />} />
          <Route path="documenti" element={<Documenti />} />
          <Route path="hr" element={<HR />} />
          <Route path="progetti" element={<Progetti />} />
          <Route path="impostazioni" element={<Impostazioni />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App