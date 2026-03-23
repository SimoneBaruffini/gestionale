import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Trash2, FileText, Download } from 'lucide-react'

type Cliente = { id: string; ragione_sociale: string }
type Documento = {
  id: string
  nome: string
  categoria: string
  descrizione: string
  url: string
  dimensione: string
  cliente_id: string
  note: string
  created_at: string
  anagrafica?: { ragione_sociale: string }
}

function Documenti() {
  const [documenti, setDocumenti] = useState<Documento[]>([])
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [ricerca, setRicerca] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostraForm, setMostraForm] = useState(false)

  const [form, setForm] = useState({
    nome: '',
    categoria: '',
    descrizione: '',
    url: '',
    cliente_id: '',
    note: '',
  })

  useEffect(() => { caricaDati() }, [])

  async function caricaDati() {
    setLoading(true)
    const [docRes, clientiRes] = await Promise.all([
      supabase.from('documenti').select('*, anagrafica(ragione_sociale)').order('created_at', { ascending: false }),
      supabase.from('anagrafica').select('id, ragione_sociale'),
    ])
    if (docRes.data) setDocumenti(docRes.data)
    if (clientiRes.data) setClienti(clientiRes.data)
    setLoading(false)
  }

  async function salvaDocumento() {
    if (!form.nome) return alert('Inserisci il nome del documento!')
    await supabase.from('documenti').insert([form])
    setMostraForm(false)
    setForm({ nome: '', categoria: '', descrizione: '', url: '', cliente_id: '', note: '' })
    caricaDati()
  }

  async function eliminaDocumento(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) return
    await supabase.from('documenti').delete().eq('id', id)
    caricaDati()
  }

  const documentiFiltrati = documenti.filter(d =>
    d.nome?.toLowerCase().includes(ricerca.toLowerCase()) ||
    d.categoria?.toLowerCase().includes(ricerca.toLowerCase()) ||
    d.anagrafica?.ragione_sociale?.toLowerCase().includes(ricerca.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Documenti</h2>
          <p className="text-gray-500 mt-1">Archiviazione documenti aziendali</p>
        </div>
        <button
          onClick={() => setMostraForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Nuovo documento
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca per nome, categoria o cliente..."
          value={ricerca}
          onChange={e => setRicerca(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Caricamento...</p>
        ) : documentiFiltrati.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Nessun documento trovato</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Categoria</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Data</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {documentiFiltrati.map((d, i) => (
                <tr key={d.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-blue-500" />
                      <span className="font-medium text-gray-800">{d.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.categoria || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{d.anagrafica?.ragione_sociale || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(d.created_at).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {d.url && (
                        <a href={d.url} target="_blank" rel="noreferrer" className="text-green-500 hover:text-green-700">
                          <Download size={16} />
                        </a>
                      )}
                      <button onClick={() => eliminaDocumento(d.id)} className="text-red-500 hover:text-red-700">
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
            <h3 className="text-lg font-bold text-gray-800 mb-4">Nuovo documento</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nome documento *"
                value={form.nome}
                onChange={e => setForm({...form, nome: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Categoria (es. Contratto, Offerta, Certificato...)"
                value={form.categoria}
                onChange={e => setForm({...form, categoria: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={form.cliente_id}
                onChange={e => setForm({...form, cliente_id: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Collega a cliente (opzionale)</option>
                {clienti.map(c => (
                  <option key={c.id} value={c.id}>{c.ragione_sociale}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="URL documento (link Google Drive, Dropbox...)"
                value={form.url}
                onChange={e => setForm({...form, url: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                onClick={salvaDocumento}
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

export default Documenti