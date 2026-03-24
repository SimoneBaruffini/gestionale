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

// Permessi per ogni ruolo - modifica qui per cambiare i permessi
const permessi: Record<string, string[]> = {
  admin: ['dashboard', 'anagrafica', 'magazzino', 'vendite', 'fatturazione', 'contabilita', 'crm', 'documenti', 'hr', 'progetti', 'impostazioni'],
  commerciale: ['dashboard', 'anagrafica', 'vendite', 'fatturazione', 'crm', 'documenti', 'progetti'],
  magazziniere: ['dashboard', 'magazzino', 'vendite'],
  contabile: ['dashboard', 'fatturazione', 'contabilita', 'documenti'],
  operatore: ['dashboard', 'anagrafica', 'vendite', 'progetti'],
}

// Componente che protegge le route in base al ruolo
function RouteProtetta({ children, pagina, ruolo }: { children: any, pagina: string, ruolo: string }) {
  if (!permessi[ruolo]?.includes(pagina)) {
    return (
      <div className="p-6 text-center">
        <p className="text-2xl mb-2">🔒</p>
        <p className="text-gray-600 font-medium">Accesso non autorizzato</p>
        <p className="text-gray-400 text-sm mt-1">Non hai i permessi per visualizzare questa sezione</p>
      </div>
    )
  }
  return children
}

function App() {
  const [utente, setUtente] = useState<any>(null)
  const [ruolo, setRuolo] = useState('operatore')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUtente(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase.from('profili').select('ruolo').eq('id', session.user.id).single()
        if (data) setRuolo(data.ruolo)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUtente(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase.from('profili').select('ruolo').eq('id', session.user.id).single()
        if (data) setRuolo(data.ruolo)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Caricamento...</p>
    </div>
  )

  if (!utente) return <Login />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<RouteProtetta pagina="dashboard" ruolo={ruolo}><Dashboard /></RouteProtetta>} />
          <Route path="anagrafica" element={<RouteProtetta pagina="anagrafica" ruolo={ruolo}><Anagrafica /></RouteProtetta>} />
          <Route path="magazzino" element={<RouteProtetta pagina="magazzino" ruolo={ruolo}><Magazzino /></RouteProtetta>} />
          <Route path="vendite" element={<RouteProtetta pagina="vendite" ruolo={ruolo}><Vendite /></RouteProtetta>} />
          <Route path="fatturazione" element={<RouteProtetta pagina="fatturazione" ruolo={ruolo}><Fatturazione /></RouteProtetta>} />
          <Route path="contabilita" element={<RouteProtetta pagina="contabilita" ruolo={ruolo}><Contabilita /></RouteProtetta>} />
          <Route path="crm" element={<RouteProtetta pagina="crm" ruolo={ruolo}><CRM /></RouteProtetta>} />
          <Route path="documenti" element={<RouteProtetta pagina="documenti" ruolo={ruolo}><Documenti /></RouteProtetta>} />
          <Route path="hr" element={<RouteProtetta pagina="hr" ruolo={ruolo}><HR /></RouteProtetta>} />
          <Route path="progetti" element={<RouteProtetta pagina="progetti" ruolo={ruolo}><Progetti /></RouteProtetta>} />
          <Route path="impostazioni" element={<RouteProtetta pagina="impostazioni" ruolo={ruolo}><Impostazioni /></RouteProtetta>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App