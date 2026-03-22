import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'

// Tipo che descrive un contatto in anagrafica
// Per aggiungere campi: aggiungi qui e nella tabella Supabase
type Contatto = {
  id: string
  tipo: 'cliente' | 'fornitore' | 'contatto'
  ragione_sociale: string
  nome: string
  cognome: string
  email: string
  telefono: string
  citta: string
  partita_iva: string
  attivo: boolean
}

function Anagrafica() {
  const [contatti, setContatti] = useState<Contatto[]>([])
  const [ricerca, setRicerca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('tutti')
  const [loading, setLoading] = useState(true)
  const [mostraForm, setMostraForm] = useState(false)
  const [contattoSelezionato, setContattoSelezionato] = useState<Contatto | null>(null)

  // Form per nuovo contatto
  const [form, setForm] = useState({
    tipo: 'cliente',
    ragione_sociale: '',
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    citta: '',
    partita_iva: '',
  })

  // Carica contatti dal database
  useEffect(() => {
    caricaContatti()
  }, [])

  async function caricaContatti() {
    setLoading(true)
    const { data, error } = await supabase
      .from('anagrafica')
      .select('*')
      .order('ragione_sociale')
    if (!error && data) setContatti(data)
    setLoading(false)
  }

  // Salva nuovo contatto o modifica esistente
  async function salvaContatto() {
    if (!form.ragione_sociale) return alert('Inserisci la ragione sociale!')
    
    if (contattoSelezionato) {
      await supabase.from('anagrafica').update(form).eq('id', contattoSelezionato.id)
    } else {
      await supabase.from('anagrafica').insert([form])
    }
    
    setMostraForm(false)
    setContattoSelezionato(null)
    setForm({ tipo: 'cliente', ragione_sociale: '', nome: '', cognome: '', email: '', telefono: '', citta: '', partita_iva: '' })
    caricaContatti()
  }

  // Elimina contatto
  async function eliminaContatto(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questo contatto?')) return
    await supabase.from('anagrafica').delete().eq('id', id)
    caricaContatti()
  }

  // Apri form modifica
  function modificaContatto(contatto: Contatto) {
    setContattoSelezionato(contatto)
    setForm({
      tipo: contatto.tipo,
      ragione_sociale: contatto.ragione_sociale,
      nome: contatto.nome || '',
      cognome: contatto.cognome || '',
      email: contatto.email || '',
      telefono: contatto.telefono || '',
      citta: contatto.citta || '',
      partita_iva: contatto.partita_iva || '',
    })
    setMostraForm(true)
  }

  // Filtra contatti per ricerca e tipo
  const contattiFiltrati = contatti.filter(c => {
    const matchRicerca = c.ragione_sociale?.toLowerCase().includes(ricerca.toLowerCase()) ||
      c.email?.toLowerCase().includes(ricerca.toLowerCase()) ||
      c.citta?.toLowerCase().includes(ricerca.toLowerCase())
    const matchTipo = filtroTipo === 'tutti' || c.tipo === filtroTipo
    return matchRicerca && matchTipo
  })

  return (
    <div className="p-6">
      {/* Intestazione */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Anagrafica</h2>
          <p className="text-gray-500 mt-1">Gestione clienti, fornitori e contatti</p>
        </div>
        <button
          onClick={() => { setMostraForm(true); setContattoSelezionato(null) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Nuovo contatto
        </button>
      </div>

      {/* Barra ricerca e filtri */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per nome, email, città..."
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
          <option value="cliente">Clienti</option>
          <option value="fornitore">Fornitori</option>
          <option value="contatto">Contatti</option>
        </select>
      </div>

      {/* Tabella contatti */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Caricamento...</p>
        ) : contattiFiltrati.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Nessun contatto trovato</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Ragione Sociale</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Telefono</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Città</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {contattiFiltrati.map((c, i) => (
                <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.ragione_sociale}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      c.tipo === 'cliente' ? 'bg-blue-100 text-blue-700' :
                      c.tipo === 'fornitore' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {c.tipo.charAt(0).toUpperCase() + c.tipo.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.telefono || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.citta || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => modificaContatto(c)} className="text-blue-500 hover:text-blue-700">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => eliminaContatto(c.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form nuovo/modifica contatto */}
      {mostraForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {contattoSelezionato ? 'Modifica contatto' : 'Nuovo contatto'}
            </h3>
            <div className="space-y-3">
              <select
                value={form.tipo}
                onChange={e => setForm({...form, tipo: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cliente">Cliente</option>
                <option value="fornitore">Fornitore</option>
                <option value="contatto">Contatto</option>
              </select>
              <input
                type="text"
                placeholder="Ragione sociale *"
                value={form.ragione_sociale}
                onChange={e => setForm({...form, ragione_sociale: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nome"
                  value={form.nome}
                  onChange={e => setForm({...form, nome: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Cognome"
                  value={form.cognome}
                  onChange={e => setForm({...form, cognome: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Telefono"
                value={form.telefono}
                onChange={e => setForm({...form, telefono: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Città"
                value={form.citta}
                onChange={e => setForm({...form, citta: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Partita IVA"
                value={form.partita_iva}
                onChange={e => setForm({...form, partita_iva: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setMostraForm(false); setContattoSelezionato(null) }}
                className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={salvaContatto}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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

export default Anagrafica