import { Outlet, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  DollarSign,
  Briefcase,
  FolderOpen,
  UserCheck,
  CheckSquare,
  Settings,
  LogOut,
} from 'lucide-react'

// Voci del menu per ogni ruolo
// Per aggiungere/rimuovere sezioni per un ruolo, modifica questo oggetto
const menuPerRuolo: Record<string, string[]> = {
  admin: ['dashboard', 'anagrafica', 'magazzino', 'vendite', 'fatturazione', 'contabilita', 'crm', 'documenti', 'hr', 'progetti', 'impostazioni'],
  commerciale: ['dashboard', 'anagrafica', 'vendite', 'fatturazione', 'crm', 'documenti', 'progetti'],
  magazziniere: ['dashboard', 'magazzino', 'vendite'],
  contabile: ['dashboard', 'fatturazione', 'contabilita', 'documenti'],
  operatore: ['dashboard', 'anagrafica', 'vendite', 'progetti'],
}

const tutteLeVoci = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', id: 'dashboard' },
  { icon: Users, label: 'Anagrafica', path: '/anagrafica', id: 'anagrafica' },
  { icon: Package, label: 'Magazzino', path: '/magazzino', id: 'magazzino' },
  { icon: ShoppingCart, label: 'Vendite', path: '/vendite', id: 'vendite' },
  { icon: FileText, label: 'Fatturazione', path: '/fatturazione', id: 'fatturazione' },
  { icon: DollarSign, label: 'Contabilità', path: '/contabilita', id: 'contabilita' },
  { icon: Briefcase, label: 'CRM', path: '/crm', id: 'crm' },
  { icon: FolderOpen, label: 'Documenti', path: '/documenti', id: 'documenti' },
  { icon: UserCheck, label: 'HR', path: '/hr', id: 'hr' },
  { icon: CheckSquare, label: 'Progetti', path: '/progetti', id: 'progetti' },
  { icon: Settings, label: 'Impostazioni', path: '/impostazioni', id: 'impostazioni' },
]

function Layout() {
  const [profilo, setProfilo] = useState<any>(null)

  useEffect(() => {
    caricaProfilo()
  }, [])

  async function caricaProfilo() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profili').select('*').eq('id', user.id).single()
      if (data) setProfilo(data)
    }
  }

  // Filtra le voci del menu in base al ruolo
  const ruolo = profilo?.ruolo || 'operatore'
  const vociVisibili = tutteLeVoci.filter(v => menuPerRuolo[ruolo]?.includes(v.id))

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Menu laterale */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">🏢 Gestionale</h1>
          <p className="text-xs text-gray-500 mt-1">Sistema di gestione</p>
        </div>

        {/* Profilo utente */}
        {profilo && (
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-medium text-gray-800">
              {profilo.nome ? `${profilo.nome} ${profilo.cognome}` : profilo.email}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              ruolo === 'admin' ? 'bg-purple-100 text-purple-700' :
              ruolo === 'commerciale' ? 'bg-blue-100 text-blue-700' :
              ruolo === 'magazziniere' ? 'bg-green-100 text-green-700' :
              ruolo === 'contabile' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {ruolo.charAt(0).toUpperCase() + ruolo.slice(1)}
            </span>
          </div>
        )}

        {/* Voci menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {vociVisibili.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer menu */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={async () => await supabase.auth.signOut()}
            className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={14} />
            Esci dal sistema
          </button>
          <p className="text-xs text-gray-400 text-center mt-1">v1.0.0</p>
        </div>
      </aside>

      {/* Contenuto principale */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout