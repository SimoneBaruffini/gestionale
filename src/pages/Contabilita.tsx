import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Trash2, TrendingUp, TrendingDown } from 'lucide-react'

type Movimento = {
  id: string
  data: string
  tipo: string
  categoria: string
  descrizione: string
  importo: number
  metodo_pagamento: string
  note: string
}

function Contabilita() {
  const [movimenti, setMovimenti] = useState<Movimento[]>([])
  const [ricerca, setRicerca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('tutti')
  const [loading, setLoading] = useState(true)
  const [mostraForm, setMostraForm] = useState(false)

  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    tipo: 'entrata',
    categoria: '',
    descrizione: '',
    importo: '',
    metodo_pagamento: 'bonifico',
    note: '',
  })

  useEffect(() => { caricaMovimenti() }, [])

  async function caricaMovimenti() {
    setLoading(true)
    const { data, error } = await supabase
      .from('prima_nota')
      .select('*')
      .order('data', { ascending: false })
    if (!error && data) setMovimenti(data)
    setLoading(false)
  }

  async function salvaMovimento() {
    if (!form.descrizione) return alert('Inserisci una descrizione!')
    if (!form.importo) return alert('Inserisci un importo!')

    await supabase.from('prima_nota').insert([{
      ...form,
      importo: parseFloat(form.importo),
    }])

    setMostraForm(false)
    setForm({ data: new Date().toISOString().split('T')[0], tipo: 'entrata', categoria: '', descrizione: '', importo: '', metodo_pagamento: 'bonifico', note: '' })
    caricaMovimenti()
  }

  async function eliminaMovimento(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questo movimento?')) return
    await supabase.from('prima_nota').delete().eq('id', id)
    caricaMovimenti()
  }

  const movimentiFiltrati = movimenti.filter(m => {
    const matchRicerca = m.descrizione?.toLowerCase().includes(ricerca.toLowerCase()) ||
      m.categoria?.toLowerCase().includes(ricerca.toLowerCase())
    const matchTipo = filtroTipo === 'tutti' || m.tipo === filtroTipo
    return matchRicerca && matchTipo
  })

  // Calcola totali
  const totaleEntrate = movimenti.filter(m => m.tipo === 'entrata').reduce((acc, m) => acc + m.importo, 0)
  const totaleUscite = movimenti.filter(m => m.tipo === 'uscita').reduce((acc, m) => acc + m.importo, 0)
  const saldo = totaleEntrate - totaleUscite

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Contabilità</h2>
          <p className="text-gray-500 mt-1">Prima nota entrate e uscite</p>
        </div>
        <button
          onClick={() => setMostraForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Nuovo movimento
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={18} className="text-green-600" />
            <p className="text-sm text-green-700 font-medium">Entrate</p>
          </div>
          <p className="text-2xl font-bold text-green-700">€ {totaleEntrate.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={18} className="text-red-600" />
            <p className="text-sm text-red-700 font-medium">Uscite</p>
          </div>
          <p className="text-2xl font-bold text-red-700">€ {totaleUscite.toFixed(2)}</p>
        </div>
        <div className={`rounded-xl p-4 border ${saldo >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <p className={`text-sm font-medium mb-1 ${saldo >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Saldo</p>
          <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>€ {saldo.toFixed(2)}</p>
        </div>
      </div>

      {/* Filtri */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per descrizione o categoria..."
            value={ricerca}
            onChange={e => setRicerca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="tutti">Tutti</option>
          <option value="entrata">Entrate</option>
          <option value="uscita">Uscite</option>
        </select>
      </div>

      {/* Tabella movimenti */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Caricamento...</p>
        ) : movimentiFiltrati.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Nessun movimento trovato</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Data</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Descrizione</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Categoria</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Metodo</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Importo</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {movimentiFiltrati.map((m, i) => (
                <tr key={m.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-600">{new Date(m.data).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.tipo === 'entrata' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {m.tipo.charAt(0).toUpperCase() + m.tipo.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{m.descrizione}</td>
                  <td className="px-4 py-3 text-gray-600">{m.categoria || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{m.metodo_pagamento}</td>
                  <td className={`px-4 py-3 font-medium ${m.tipo === 'entrata' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.tipo === 'entrata' ? '+' : '-'} € {m.importo?.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => eliminaMovimento(m.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form nuovo movimento */}
      {mostraForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Nuovo movimento</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={form.data}
                  onChange={e => setForm({...form, data: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={form.tipo}
                  onChange={e => setForm({...form, tipo: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="entrata">Entrata</option>
                  <option value="uscita">Uscita</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Descrizione *"
                value={form.descrizione}
                onChange={e => setForm({...form, descrizione: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Categoria (es. Affitto, Stipendi...)"
                  value={form.categoria}
                  onChange={e => setForm({...form, categoria: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Importo € *"
                  value={form.importo}
                  onChange={e => setForm({...form, importo: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={form.metodo_pagamento}
                onChange={e => setForm({...form, metodo_pagamento: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bonifico">Bonifico</option>
                <option value="contanti">Contanti</option>
                <option value="carta">Carta</option>
                <option value="assegno">Assegno</option>
                <option value="altro">Altro</option>
              </select>
              <textarea
                placeholder="Note"
                value={form.note}
                onChange={e => setForm({...form, note: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setMostraForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={salvaMovimento}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Contabilita