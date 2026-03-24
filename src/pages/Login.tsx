import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Pagina di login - primo schermo che vede l'utente
function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState('')

  async function accedi() {
    if (!email) return setErrore('Inserisci la tua email!')
    if (!password) return setErrore('Inserisci la password!')
    
    setLoading(true)
    setErrore('')
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) setErrore('Email o password non corretti')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">🏢 Gestionale</h1>
          <p className="text-gray-500 mt-2">Accedi al tuo account</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {errore && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errore}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="tua@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && accedi()}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && accedi()}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={accedi}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Sistema di gestione aziendale
        </p>
      </div>
    </div>
  )
}

export default Login