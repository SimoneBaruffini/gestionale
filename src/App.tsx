import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
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

// App principale - per aggiungere nuove pagine aggiungi un import e una Route
function App() {
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