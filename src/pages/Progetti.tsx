import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

type Cliente = { id: string; ragione_sociale: string }
type Task = {
  id: string
  progetto_id: string
  titolo: string
  descrizione: string
  stato: string
  priorita: string
  data_scadenza: string
}
type Progetto = {
  id: string
  nome: string
  descrizione: string
  stato: string
  priorita: string
  data_inizio: string
  data_scadenza: string
  cliente_id: string
  budget: number
  note: string
  anagrafica?: { ragione_sociale: string }
  task?: Task[]
}

function Progetti() {
  const [progetti, setProgetti] = useState<Progetto[]>([])
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [ricerca, setRicerca] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostraForm, setMostraForm] = useState(false)
  const [progettoSelezionato, setProgettoSelezionato] = useState<Progetto | null>(null)
  const [progettoAperto, setProgettoAperto] = useState<string | null>(null)
  const [mostraTaskForm, setMostraTaskForm] = useState(false)
  const [progettoTask, setProgettoTask] = useState<Progetto | null>(null)

  const [form, setForm] = useState({
    nome: '',
    descrizione: '',
    stato: 'in_corso',
    priorita: 'media',
    data_inizio: new Date().toISOString().split('T')[0],
    data_scadenza: '',
    cliente_id: '',
    budget: '',
    note: '',
  })

  const [taskForm, setTaskForm] = useState({
    titolo: '',
    descrizione: '',
    stato: 'da_fare',
    priorita: 'media',
    data_scadenza: '',
  })

  useEffect(() => { caricaDati() }, [])

  async function caricaDati() {
    setLoading(true)
    const [progettiRes, clientiRes] = await Promise.all([
      supabase.from('progetti').select('*, anagrafica(ragione_sociale), task(*)').order('created_at', { ascending: false }),
      supabase.from('anagrafica').select('id, ragione_sociale'),
    ])
    if (progettiRes.data) setProgetti(progettiRes.data)
    if (clientiRes.data) setClienti(clientiRes.data)
    setLoading(false)
  }

  async function salvaProgetto() {
    if (!form.nome) return alert('Inserisci il nome del progetto!')
    const dati = { ...form, budget: parseFloat(form.budget) || 0 }

    if (progettoSelezionato) {
      await supabase.from('progetti').update(dati).eq('id', progettoSelezionato.id)
    } else {
      await supabase.from('progetti').insert([dati])
    }

    chiudiForm()
    caricaDati()
  }

  async function eliminaProgetto(id: string) {
    if (!confirm('Sei sicuro? Verranno eliminati anche tutti i task!')) return
    await supabase.from('progetti').delete().eq('id', id)
    caricaDati()
  }

  async function salvaTask() {
    if (!taskForm.titolo) return alert('Inserisci il titolo del task!')
    if (!progettoTask) return

    await supabase.from('task').insert([{ ...taskForm, progetto_id: progettoTask.id }])
    setMostraTaskForm(false)
    setTaskForm({ titolo: '', descrizione: '', stato: 'da_fare', priorita: 'media', data_scadenza: '' })
    caricaDati()
  }

  async function aggiornaStatoTask(id: string, stato: string) {
    await supabase.from('task').update({ stato }).eq('id', id)
    caricaDati()
  }

  async function eliminaTask(id: string) {
    await supabase.from('task').delete().eq('id', id)
    caricaDati()
  }

  function modificaProgetto(p: Progetto) {
    setProgettoSelezionato(p)
    setForm({
      nome: p.nome,
      descrizione: p.descrizione || '',
      stato: p.stato,
      priorita: p.priorita,
      data_inizio: p.data_inizio || '',
      data_scadenza: p.data_scadenza || '',
      cliente_id: p.cliente_id || '',
      budget: p.budget?.toString() || '',
      note: p.note || '',
    })
    setMostraForm(true)
  }

  function chiudiForm() {
    setMostraForm(false)
    setProgettoSelezionato(null)
    setForm({ nome: '', descrizione: '', stato: 'in_corso', priorita: 'media', data_inizio: new Date().toISOString().split('T')[0], data_scadenza: '', cliente_id: '', budget: '', note: '' })
  }

  const colorePriorita = (p: string) => {
    switch (p) {
      case 'alta': return 'bg-red-100 text-red-700'
      case 'media': return 'bg-yellow-100 text-yellow-700'
      case 'bassa': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const coloreStato = (s: string) => {
    switch (s) {
      case 'pianificato': return 'bg-gray-100 text-gray-700'
      case 'in_corso': return 'bg-blue-100 text-blue-700'
      case 'completato': return 'bg-green-100 text-green-700'
      case 'sospeso': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const progettiFiltrati = progetti.filter(p =>
    p.nome?.toLowerCase().includes(ricerca.toLowerCase()) ||
    p.anagrafica?.ragione_sociale?.toLowerCase().includes(ricerca.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Progetti & Task</h2>
          <p className="text-gray-500 mt-1">Gestione progetti e attività</p>
        </div>
        <button
          onClick={() => setMostraForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Nuovo progetto
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {['pianificato', 'in_corso', 'completato', 'sospeso'].map(stato => (
          <div key={stato} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{stato.replace('_', ' ').charAt(0).toUpperCase() + stato.replace('_', ' ').slice(1)}</p>
            <p className="text-2xl font-bold text-gray-800">{progetti.filter(p => p.stato === stato).length}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca per nome progetto o cliente..."
          value={ricerca}
          onChange={e => setRicerca(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Lista progetti */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Caricamento...</p>
        ) : progettiFiltrati.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Nessun progetto trovato</p>
        ) : progettiFiltrati.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header progetto */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => setProgettoAperto(progettoAperto === p.id ? null : p.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {progettoAperto === p.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <div>
                  <h3 className="font-semibold text-gray-800">{p.nome}</h3>
                  <p className="text-xs text-gray-500">{p.anagrafica?.ragione_sociale || 'Nessun cliente'} {p.data_scadenza ? `— Scadenza: ${new Date(p.data_scadenza).toLocaleDateString('it-IT')}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorePriorita(p.priorita)}`}>
                  {p.priorita.charAt(0).toUpperCase() + p.priorita.slice(1)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${coloreStato(p.stato)}`}>
                  {p.stato.replace('_', ' ').charAt(0).toUpperCase() + p.stato.replace('_', ' ').slice(1)}
                </span>
                <button
                  onClick={() => { setProgettoTask(p); setMostraTaskForm(true) }}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                >
                  + Task
                </button>
                <button onClick={() => modificaProgetto(p)} className="text-blue-500 hover:text-blue-700">
                  <Pencil size={16} />
                </button>
                <button onClick={() => eliminaProgetto(p.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Task del progetto */}
            {progettoAperto === p.id && (
              <div className="border-t border-gray-100 p-4">
                {!p.task || p.task.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-2">Nessun task — clicca "+ Task" per aggiungerne uno</p>
                ) : (
                  <div className="space-y-2">
                    {p.task.map(t => (
                      <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={t.stato === 'completato'}
                          onChange={() => aggiornaStatoTask(t.id, t.stato === 'completato' ? 'da_fare' : 'completato')}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className={`flex-1 text-sm ${t.stato === 'completato' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {t.titolo}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorePriorita(t.priorita)}`}>
                          {t.priorita}
                        </span>
                        {t.data_scadenza && (
                          <span className="text-xs text-gray-400">{new Date(t.data_scadenza).toLocaleDateString('it-IT')}</span>
                        )}
                        <button onClick={() => eliminaTask(t.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Form progetto */}
      {mostraForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {progettoSelezionato ? 'Modifica progetto' : 'Nuovo progetto'}
            </h3>
            <div className="space-y-3">
              <input type="text" placeholder="Nome progetto *" value={form.nome}
                onChange={e => setForm({...form, nome: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea placeholder="Descrizione" value={form.descrizione}
                onChange={e => setForm({...form, descrizione: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.stato} onChange={e => setForm({...form, stato: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="pianificato">Pianificato</option>
                  <option value="in_corso">In corso</option>
                  <option value="completato">Completato</option>
                  <option value="sospeso">Sospeso</option>
                </select>
                <select value={form.priorita} onChange={e => setForm({...form, priorita: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="bassa">Priorità bassa</option>
                  <option value="media">Priorità media</option>
                  <option value="alta">Priorità alta</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={form.data_inizio}
                  onChange={e => setForm({...form, data_inizio: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="date" value={form.data_scadenza}
                  onChange={e => setForm({...form, data_scadenza: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <select value={form.cliente_id} onChange={e => setForm({...form, cliente_id: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Collega a cliente (opzionale)</option>
                {clienti.map(c => <option key={c.id} value={c.id}>{c.ragione_sociale}</option>)}
              </select>
              <input type="number" placeholder="Budget €" value={form.budget}
                onChange={e => setForm({...form, budget: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={chiudiForm} className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50">Annulla</button>
              <button onClick={salvaProgetto} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salva</button>
            </div>
          </div>
        </div>
      )}

      {/* Form task */}
      {mostraTaskForm && progettoTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Nuovo task</h3>
            <p className="text-sm text-gray-500 mb-4">{progettoTask.nome}</p>
            <div className="space-y-3">
              <input type="text" placeholder="Titolo task *" value={taskForm.titolo}
                onChange={e => setTaskForm({...taskForm, titolo: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea placeholder="Descrizione" value={taskForm.descrizione}
                onChange={e => setTaskForm({...taskForm, descrizione: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <select value={taskForm.priorita} onChange={e => setTaskForm({...taskForm, priorita: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="bassa">Priorità bassa</option>
                  <option value="media">Priorità media</option>
                  <option value="alta">Priorità alta</option>
                </select>
                <input type="date" value={taskForm.data_scadenza}
                  onChange={e => setTaskForm({...taskForm, data_scadenza: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setMostraTaskForm(false)} className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50">Annulla</button>
              <button onClick={salvaTask} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Progetti