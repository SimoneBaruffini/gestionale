import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Pencil, Trash2, Clock } from 'lucide-react'

type Dipendente = {
  id: string
  nome: string
  cognome: string
  email: string
  telefono: string
  ruolo: string
  data_assunzione: string
  tipo_contratto: string
  stipendio: number
  attivo: boolean
  note: string
}

function HR() {
  const [dipendenti, setDipendenti] = useState<Dipendente[]>([])
  const [ricerca, setRicerca] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostraForm, setMostraForm] = useState(false)
  const [dipendenteSelezionato, setDipendenteSelezionato] = useState<Dipendente | null>(null)
  const [mostraPresenze, setMostraPresenze] = useState(false)
  const [dipendentePresenze, setDipendentePresenze] = useState<Dipendente | null>(null)
  const [presenzaForm, setPresenzaForm] = useState({
    data: new Date().toISOString().split('T')[0],
    ore_lavorate: '8',
    tipo: 'lavoro',
    note: '',
  })

  const [form, setForm] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    ruolo: '',
    data_assunzione: '',
    tipo_contratto: 'dipendente',
    stipendio: '',
    note: '',
  })

  useEffect(() => { caricaDipendenti() }, [])

  async function caricaDipendenti() {
    setLoading(true)
    const { data, error } = await supabase
      .from('dipendenti')
      .select('*')
      .order('cognome')
    if (!error && data) setDipendenti(data)
    setLoading(false)
  }

  async function salvaDipendente() {
    if (!form.nome) return alert('Inserisci il nome!')
    if (!form.cognome) return alert('Inserisci il cognome!')

    const dati = { ...form, stipendio: parseFloat(form.stipendio) || 0 }

    if (dipendenteSelezionato) {
      await supabase.from('dipendenti').update(dati).eq('id', dipendenteSelezionato.id)
    } else {
      await supabase.from('dipendenti').insert([dati])
    }

    chiudiForm()
    caricaDipendenti()
  }

  async function eliminaDipendente(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questo dipendente?')) return
    await supabase.from('dipendenti').delete().eq('id', id)
    caricaDipendenti()
  }

  async function salvaPresenza() {
    if (!dipendentePresenze) return
    await supabase.from('presenze').insert([{
      dipendente_id: dipendentePresenze.id,
      ...presenzaForm,
      ore_lavorate: parseFloat(presenzaForm.ore_lavorate) || 0,
    }])
    setMostraPresenze(false)
    setPresenzaForm({ data: new Date().toISOString().split('T')[0], ore_lavorate: '8', tipo: 'lavoro', note: '' })
  }

  function modificaDipendente(d: Dipendente) {
    setDipendenteSelezionato(d)
    setForm({
      nome: d.nome,
      cognome: d.cognome,
      email: d.email || '',
      telefono: d.telefono || '',
      ruolo: d.ruolo || '',
      data_assunzione: d.data_assunzione || '',
      tipo_contratto: d.tipo_contratto,
      stipendio: d.stipendio?.toString() || '',
      note: d.note || '',
    })
    setMostraForm(true)
  }

  function chiudiForm() {
    setMostraForm(false)
    setDipendenteSelezionato(null)
    setForm({ nome: '', cognome: '', email: '', telefono: '', ruolo: '', data_assunzione: '', tipo_contratto: 'dipendente', stipendio: '', note: '' })
  }

  const dipendentiFiltrati = dipendenti.filter(d =>
    `${d.nome} ${d.cognome}`.toLowerCase().includes(ricerca.toLowerCase()) ||
    d.ruolo?.toLowerCase().includes(ricerca.toLowerCase()) ||
    d.email?.toLowerCase().includes(ricerca.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Risorse Umane</h2>
          <p className="text-gray-500 mt-1">Gestione dipendenti e presenze</p>
        </div>
        <button
          onClick={() => setMostraForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Nuovo dipendente
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Dipendenti attivi</p>
          <p className="text-2xl font-bold text-gray-800">{dipendenti.filter(d => d.attivo).length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Costo mensile stimato</p>
          <p className="text-2xl font-bold text-gray-800">
            € {dipendenti.filter(d => d.attivo).reduce((acc, d) => acc + (d.stipendio || 0), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Collaboratori</p>
          <p className="text-2xl font-bold text-gray-800">{dipendenti.filter(d => d.tipo_contratto !== 'dipendente').length}</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca per nome, ruolo, email..."
          value={ricerca}
          onChange={e => setRicerca(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Caricamento...</p>
        ) : dipendentiFiltrati.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Nessun dipendente trovato</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Ruolo</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Contratto</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Stipendio</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {dipendentiFiltrati.map((d, i) => (
                <tr key={d.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium text-gray-800">{d.cognome} {d.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{d.ruolo || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {d.tipo_contratto.charAt(0).toUpperCase() + d.tipo_contratto.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{d.stipendio ? `€ ${d.stipendio.toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setDipendentePresenze(d); setMostraPresenze(true) }}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                      >
                        <Clock size={14} className="inline mr-1" />Presenza
                      </button>
                      <button onClick={() => modificaDipendente(d)} className="text-blue-500 hover:text-blue-700">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => eliminaDipendente(d.id)} className="text-red-500 hover:text-red-700">
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

      {/* Form dipendente */}
      {mostraForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {dipendenteSelezionato ? 'Modifica dipendente' : 'Nuovo dipendente'}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Nome *" value={form.nome}
                  onChange={e => setForm({...form, nome: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="Cognome *" value={form.cognome}
                  onChange={e => setForm({...form, cognome: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <input type="email" placeholder="Email" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Telefono" value={form.telefono}
                onChange={e => setForm({...form, telefono: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Ruolo (es. Commerciale, Magazziniere...)" value={form.ruolo}
                onChange={e => setForm({...form, ruolo: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.tipo_contratto}
                  onChange={e => setForm({...form, tipo_contratto: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="dipendente">Dipendente</option>
                  <option value="collaboratore">Collaboratore</option>
                  <option value="stage">Stage</option>
                  <option value="partita_iva">Partita IVA</option>
                </select>
                <input type="number" placeholder="Stipendio €" value={form.stipendio}
                  onChange={e => setForm({...form, stipendio: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <input type="date" placeholder="Data assunzione" value={form.data_assunzione}
                onChange={e => setForm({...form, data_assunzione: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea placeholder="Note" value={form.note}
                onChange={e => setForm({...form, note: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={chiudiForm} className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50">Annulla</button>
              <button onClick={salvaDipendente} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salva</button>
            </div>
          </div>
        </div>
      )}

      {/* Form presenza */}
      {mostraPresenze && dipendentePresenze && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Registra presenza</h3>
            <p className="text-sm text-gray-500 mb-4">{dipendentePresenze.cognome} {dipendentePresenze.nome}</p>
            <div className="space-y-3">
              <input type="date" value={presenzaForm.data}
                onChange={e => setPresenzaForm({...presenzaForm, data: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={presenzaForm.tipo}
                onChange={e => setPresenzaForm({...presenzaForm, tipo: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="lavoro">Lavoro</option>
                <option value="ferie">Ferie</option>
                <option value="malattia">Malattia</option>
                <option value="permesso">Permesso</option>
              </select>
              <input type="number" placeholder="Ore lavorate" value={presenzaForm.ore_lavorate}
                onChange={e => setPresenzaForm({...presenzaForm, ore_lavorate: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Note" value={presenzaForm.note}
                onChange={e => setPresenzaForm({...presenzaForm, note: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setMostraPresenze(false)} className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50">Annulla</button>
              <button onClick={salvaPresenza} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HR