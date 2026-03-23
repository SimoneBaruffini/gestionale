import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Pencil, Trash2, Phone, Mail, Users, Briefcase } from 'lucide-react'

type Cliente = { id: string; ragione_sociale: string }
type Attivita = {
  id: string
  tipo: string
  stato: string
  titolo: string
  descrizione: string
  cliente_id: string
  data_scadenza: string
  valore_opportunita: number
  note: string
  anagrafica?: { ragione_sociale: string }
}

function CRM() {
  const [attivita, setAttivita] = useState<Attivita[]>([])
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [ricerca, setRicerca] = useState('')
  const [filtroStato, setFiltroStato] = useState('tutti')
  const [loading, setLoading] = useState(true)
  const [mostraForm, setMostraForm] = useState(false)
  const [attivitaSelezionata, setAttivitaSelezionata] = useState<Attivita | null>(null)

  const [form, setForm] = useState({
    tipo: 'chiamata',
    stato: 'da_fare',
    titolo: '',
    descrizione: '',
    cliente_id: '',
    data_scadenza: '',
    valore_opportunita: '',
    note: '',
  })

  useEffect(() => { caricaDati() }, [])

  async function caricaDati() {
    setLoading(true)
    const [attivitaRes, clientiRes] = await Promise.all([
      supabase.from('crm_attivita').select('*, anagrafica(ragione_sociale)').order('data_scadenza'),
      supabase.from('anagrafica').select('id, ragione_sociale'),
    ])
    if (attivitaRes.data) setAttivita(attivitaRes.data)
    if (clientiRes.data) setClienti(clientiRes.data)
    setLoading(false)
  }

  async function salvaAttivita() {
    if (!form.titolo) return alert('Inserisci un titolo!')

    const dati = { ...form, valore_opportunita: parseFloat(form.valore_opportunita) || 0 }

    if (attivitaSelezionata) {
      await supabase.from('crm_attivita').update(dati).eq('id', attivitaSelezionata.id)
    } else {
      await supabase.from('crm_attivita').insert([dati])
    }

    chiudiForm()
    caricaDati()
  }

  async function eliminaAttivita(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questa attività?')) return
    await supabase.from('crm_attivita').delete().eq('id', id)
    caricaDati()
  }

  function modificaAttivita(a: Attivita) {
    setAttivitaSelezionata(a)
    setForm({
      tipo: a.tipo,
      stato: a.stato,
      titolo: a.titolo,
      descrizione: a.descrizione || '',
      cliente_id: a.cliente_id || '',
      data_scadenza: a.data_scadenza || '',
      valore_opportunita: a.valore_opportunita?.toString() || '',
      note: a.note || '',
    })
    setMostraForm(true)
  }

  function chiudiForm() {
    setMostraForm(false)
    setAttivitaSelezionata(null)
    setForm({ tipo: 'chiamata', stato: 'da_fare', titolo: '', descrizione: '', cliente_id: '', data_scadenza: '', valore_opportunita: '', note: '' })
  }

  const attivitaFiltrate = attivita.filter(a => {
    const matchRicerca = a.titolo?.toLowerCase().includes(ricerca.toLowerCase()) ||
      a.anagrafica?.ragione_sociale?.toLowerCase().includes(ricerca.toLowerCase())
    const matchStato = filtroStato === 'tutti' || a.stato === filtroStato
    return matchRicerca && matchStato
  })

  const iconaTipo = (tipo: string) => {
    switch (tipo) {
      case 'chiamata': return <Phone size={14} />
      case 'email': return <Mail size={14} />
      case 'incontro': return <Users size={14} />
      case 'offerta': return <Briefcase size={14} />
      default: return null
    }
  }

  const coloreStato = (stato: string) => {
    switch (stato) {
      case 'da_fare': return 'bg-orange-100 text-orange-700'
      case 'in_corso': return 'bg-blue-100 text-blue-700'
      case 'completata': return 'bg-green-100 text-green-700'
      case 'annullata': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const totaleOpportunita = attivita
    .filter(a => a.stato !== 'annullata')
    .reduce((acc, a) => acc + (a.valore_opportunita || 0), 0)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">CRM</h2>
          <p className="text-gray-500 mt-1">Pipeline commerciale e attività</p>
        </div>
        <button
          onClick={() => setMostraForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Nuova attività
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {['da_fare', 'in_corso', 'completata', 'annullata'].map(stato => (
          <div key={stato} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{stato.replace('_', ' ').charAt(0).toUpperCase() + stato.replace('_', ' ').slice(1)}</p>
            <p className="text-2xl font-bold text-gray-800">
              {attivita.filter(a => a.stato === stato).length}
            </p>
          </div>
        ))}
      </div>

      {totaleOpportunita > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-blue-700 text-sm font-medium">
            💰 Valore pipeline attivo: <strong>€ {totaleOpportunita.toFixed(2)}</strong>
          </p>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per titolo o cliente..."
            value={ricerca}
            onChange={e => setRicerca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filtroStato}
          onChange={e => setFiltroStato(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="tutti">Tutti</option>
          <option value="da_fare">Da fare</option>
          <option value="in_corso">In corso</option>
          <option value="completata">Completate</option>
          <option value="annullata">Annullate</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Caricamento...</p>
        ) : attivitaFiltrate.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Nessuna attività trovata</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Titolo</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Stato</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Scadenza</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Valore</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {attivitaFiltrate.map((a, i) => (
                <tr key={a.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium text-gray-800">{a.titolo}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-gray-600">
                      {iconaTipo(a.tipo)}
                      {a.tipo.charAt(0).toUpperCase() + a.tipo.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.anagrafica?.ragione_sociale || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${coloreStato(a.stato)}`}>
                      {a.stato.replace('_', ' ').charAt(0).toUpperCase() + a.stato.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {a.data_scadenza ? new Date(a.data_scadenza).toLocaleDateString('it-IT') : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {a.valore_opportunita ? `€ ${a.valore_opportunita.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => modificaAttivita(a)} className="text-blue-500 hover:text-blue-700">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => eliminaAttivita(a.id)} className="text-red-500 hover:text-red-700">
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

      {mostraForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {attivitaSelezionata ? 'Modifica attività' : 'Nuova attività'}
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Titolo *"
                value={form.titolo}
                onChange={e => setForm({...form, titolo: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.tipo}
                  onChange={e => setForm({...form, tipo: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="chiamata">Chiamata</option>
                  <option value="email">Email</option>
                  <option value="incontro">Incontro</option>
                  <option value="offerta">Offerta</option>
                  <option value="altro">Altro</option>
                </select>
                <select
                  value={form.stato}
                  onChange={e => setForm({...form, stato: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="da_fare">Da fare</option>
                  <option value="in_corso">In corso</option>
                  <option value="completata">Completata</option>
                  <option value="annullata">Annullata</option>
                </select>
              </div>
              <select
                value={form.cliente_id}
                onChange={e => setForm({...form, cliente_id: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleziona cliente</option>
                {clienti.map(c => (
                  <option key={c.id} value={c.id}>{c.ragione_sociale}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={form.data_scadenza}
                  onChange={e => setForm({...form, data_scadenza: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Valore opportunità €"
                  value={form.valore_opportunita}
                  onChange={e => setForm({...form, valore_opportunita: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <textarea
                placeholder="Descrizione"
                value={form.descrizione}
                onChange={e => setForm({...form, descrizione: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={chiudiForm} className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50">
                Annulla
              </button>
              <button onClick={salvaAttivita} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CRM