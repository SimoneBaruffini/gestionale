import { Outlet, NavLink } from 'react-router-dom'
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
} from 'lucide-react'

// Voci del menu laterale - per aggiungere una sezione, aggiungi un oggetto qui
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Anagrafica', path: '/anagrafica' },
  { icon: Package, label: 'Magazzino', path: '/magazzino' },
  { icon: ShoppingCart, label: 'Vendite', path: '/vendite' },
  { icon: FileText, label: 'Fatturazione', path: '/fatturazione' },
  { icon: DollarSign, label: 'Contabilità', path: '/contabilita' },
  { icon: Briefcase, label: 'CRM', path: '/crm' },
  { icon: FolderOpen, label: 'Documenti', path: '/documenti' },
  { icon: UserCheck, label: 'HR', path: '/hr' },
  { icon: CheckSquare, label: 'Progetti', path: '/progetti' },
  { icon: Settings, label: 'Impostazioni', path: '/impostazioni' },
]

function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Menu laterale */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">🏢 Gestionale</h1>
          <p className="text-xs text-gray-500 mt-1">Sistema di gestione</p>
        </div>

        {/* Voci menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
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
            className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors text-center"
          >
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