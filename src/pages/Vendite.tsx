import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react'

type Cliente = { id: string; ragione_sociale: string }
type Prodotto = { id: string; codice: string; descrizione: string; prezzo_vendita: number }
type RigaOrdine = {
  id?: string
  prodotto_id: string
  descrizione: string
  quantita: number
  prezzo_unitario: number
  iva: number
  totale: number
}
type Ordine = {
  id: string
  numero: string
  data: string
  stato: string
  totale: number
  totale_imponibile: number
  totale_iva: number
  note: string
  cliente_id: string
  anagrafica?: { ragione_sociale: string }
}

function Vendite() {
  const [ordini, setOrdini] = useState<Ordine[]>([])
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [prodotti, setProdotti] = useState<Prodotto[]>([])
  const [ricerca, setRicerca] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostraForm, setMostraForm] = useState(false)
  const [ordineSelezionato, setOrdineSelezionato] = useState<Ordine | null>(null)
  const [righe, setRighe] = useState<RigaOrdine[]>([])

  const [form, setForm] = useState({
    numero: '',
    data: new Date().toISOString().split('T')[0],
    cliente_id: '',
    stato: 'bozza',
    note: '',
  })

  useEffect(() => {
    caricaDati()
  }, [])

  async function caricaDati() {
    setLoading(true)
    const [ordiniRes, clientiRes, prodottiRes] = await Promise.all([
      supabase.from('ordini').select('*, anagrafica(ragione_sociale)').order('created_at', { ascending: false }),
      supabase.from('anagrafica').select('id, ragione_sociale').eq('tipo', 'cliente'),
      supabase.from('prodotti').select('id, codice, descrizione, prezzo_vendita'),
    ])
    if (ordiniRes.data) setOrdini(ordiniRes.data)
    if (clientiRes.data) setClienti(clientiRes.data)
    if (prodottiRes.data) setProdotti(prodottiRes.data)
    setLoading(false)
  }

  async function generaNumeroOrdine() {
    const anno = new Date().getFullYear()
    const { count } = await supabase.from('ordini').select('*', { count: 'exact', head: true })
    return `ORD-${anno}-${String((count || 0) + 1).padStart(4, '0')}`
  }

  function aggiungiRiga() {
    setRighe([...righe, {
      prodotto_id: '',
      descrizione: '',
      quantita: 1,
      prezzo_unitario: 0,
      iva: 22,
      totale: 0,
    }])
  }

  function aggiornaRiga(index: number, campo: string, valore: string | number) {
    const nuoveRighe = [...righe]
    nuoveRighe[index] = { ...nuoveRighe[index], [campo]: valore }

    // Se seleziona un prodotto, compila automaticamente
    if (campo === 'prodotto_id') {
      const prodotto = prodotti.find(p => p.id === valore)
      if (prodotto) {
        nuoveRighe[index].descrizione = prodotto.descrizione
        nuoveRighe[index].prezzo_unitario = prodotto.prezzo_vendita
      }
    }

    // Ricalcola totale riga
    const q = nuoveRighe[index].quantita
    const p = nuoveRighe[index].prezzo_unitario
    nuoveRighe[index].totale = q * p
    setRighe(nuoveRighe)
  }

  function rimuoviRiga(index: number) {
    setRighe(righe.filter((_, i) => i !== index))
  }

  function calcolaTotali() {
    const imponibile = righe.reduce((acc, r) => acc + r.totale, 0)
    const iva = righe.reduce((acc, r) => acc + (r.totale * r.iva / 100), 0)
    return { imponibile, iva, totale: imponibile + iva }
  }

  async function salvaOrdine() {
    if (!form.cliente_id) return alert('Seleziona un cliente!')
    if (righe.length === 0) return alert('Aggiungi almeno un prodotto!')

    const { imponibile, iva, totale } = calcolaTotali()
    const numero = form.numero || await generaNumeroOrdine()

    if (ordineSelezionato) {
      await supabase.from('ordini').update({
        ...form, numero, totale_imponibile: imponibile, totale_iva: iva, totale
      }).eq('id', ordineSelezionato.id)
      await supabase.from('ordini_righe').delete().eq('ordine_id', ordineSelezionato.id)
      await supabase.from('ordini_righe').insert(righe.map(r => ({ ...r, ordine_id: ordineSelezionato.id })))
    } else {
      const { data } = await supabase.from('ordini').insert([{
        ...form, numero, totale_imponibile: imponibile, totale_iva: iva, totale
      }]).select().single()
      if (data) {
        await supabase.from('ordini_righe').insert(righe.map(r => ({ ...r, ordine_id: data.id })))
      }
    }

    chiudiForm()
    caricaDati()
  }

  async function eliminaOrdine(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questo ordine?')) return
    await supabase.from('ordini').delete().eq('id', id)
    caricaDati()
  }

  async function apriModifica(ordine: Ordine) {
    setOrdineSelezionato(ordine)
    setForm({
      numero: ordine.numero,
      data: ordine.data,
      cliente_id: ordine.cliente_id,
      stato: ordine.stato,
      note: ordine.note || '',
    })
    const { data } = await supabase.from('ordini_righe').select('*').eq('ordine_id', ordine.id)
    if (data) setRighe(data)
    setMostraForm(true)
  }

  async function apriNuovo() {
    setOrdineSelezionato(null)
    const numero = await generaNumeroOrdine()
    setForm({ numero, data: new Date().toISOString().split('T')[0], cliente_id: '', stato: 'bozza', note: '' })
    setRighe([])
    setMostraForm(true)
  }

  function chiudiForm() {
    setMostraForm(false)
    setOrdineSelezionato(null)
    setRighe([])
  }

  const ordiniFiltrati = ordini.filter(o =>
    o.numero?.toLowerCase().includes(ricerca.toLowerCase()) ||
    o.anagrafica?.ragione_sociale?.toLowerCase().includes(ricerca.toLowerCase())
  )

  const coloreStato = (stato: string) => {
    switch (stato) {
      case 'bozza': return 'bg-gray-100 text-gray-700'
      case 'confermato': return 'bg-blue-100 text-blue-700'
      case 'spedito': return 'bg-yellow-100 text-yellow-700'
      case 'consegnato': return 'bg-green-100 text-green-700'
      case 'annullato': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const { imponibile, iva, totale } = calcolaTotali()

  return (
    <div className="p-6">
      {/* Intestazione */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Vendite & Ordini</h2>
          <p className="text-gray-500 mt-1">Gestione ordini clienti</p>
        </div>
        <button
          onClick={apriNuovo}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Nuovo ordine
        </button>
      </div>

      {/* Barra ricerca */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca per numero ordine o cliente..."
          value={ricerca}
          onChange={e => setRicerca(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabella ordini */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Caricamento...</p>
        ) : ordiniFiltrati.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Nessun ordine trovato</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Numero</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Data</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Stato</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Totale</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {ordiniFiltrati.map((o, i) => (
                <tr key={o.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-mono font-medium text-gray-800">{o.numero}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(o.data).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-3 text-gray-800">{o.anagrafica?.ragione_sociale || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${coloreStato(o.stato)}`}>
                      {o.stato.charAt(0).toUpperCase() + o.stato.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">€ {o.totale?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => apriModifica(o)} className="text-blue-500 hover:text-blue-700">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => eliminaOrdine(o.id)} className="text-red-500 hover:text-red-700">
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

      {/* Form ordine */}
      {mostraForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {ordineSelezionato ? 'Modifica ordine' : 'Nuovo ordine'}
            </h3>

            {/* Dati ordine */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input
                type="text"
                placeholder="Numero ordine"
                value={form.numero}
                onChange={e => setForm({...form, numero: e.target.value})}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={form.data}
                onChange={e => setForm({...form, data: e.target.value})}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={form.cliente_id}
                onChange={e => setForm({...form, cliente_id: e.target.value})}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleziona cliente *</option>
                {clienti.map(c => (
                  <option key={c.id} value={c.id}>{c.ragione_sociale}</option>
                ))}
              </select>
              <select
                value={form.stato}
                onChange={e => setForm({...form, stato: e.target.value})}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bozza">Bozza</option>
                <option value="confermato">Confermato</option>
                <option value="spedito">Spedito</option>
                <option value="consegnato">Consegnato</option>
                <option value="annullato">Annullato</option>
              </select>
            </div>

            {/* Righe ordine */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-700">Prodotti</h4>
                <button
                  onClick={aggiungiRiga}
                  className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-700"
                >
                  <Plus size={14} /> Aggiungi riga
                </button>
              </div>

              {righe.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4 border border-dashed border-gray-200 rounded-lg">
                  Nessun prodotto — clicca "Aggiungi riga"
                </p>
              ) : (
                <div className="space-y-2">
                  {righe.map((riga, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <select
                        value={riga.prodotto_id}
                        onChange={e => aggiornaRiga(i, 'prodotto_id', e.target.value)}
                        className="col-span-4 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleziona prodotto</option>
                        {prodotti.map(p => (
                          <option key={p.id} value={p.id}>{p.codice} - {p.descrizione}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Descrizione"
                        value={riga.descrizione}
                        onChange={e => aggiornaRiga(i, 'descrizione', e.target.value)}
                        className="col-span-3 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Qta"
                        value={riga.quantita}
                        onChange={e => aggiornaRiga(i, 'quantita', parseFloat(e.target.value))}
                        className="col-span-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Prezzo"
                        value={riga.prezzo_unitario}
                        onChange={e => aggiornaRiga(i, 'prezzo_unitario', parseFloat(e.target.value))}
                        className="col-span-2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="col-span-1 text-xs font-medium text-gray-700 text-right">
                        € {riga.totale.toFixed(2)}
                      </div>
                      <button
                        onClick={() => rimuoviRiga(i)}
                        className="col-span-1 text-red-400 hover:text-red-600 flex justify-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totali */}
            {righe.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Imponibile:</span>
                  <span>€ {imponibile.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>IVA:</span>
                  <span>€ {iva.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-800">
                  <span>Totale:</span>
                  <span>€ {totale.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Note */}
            <textarea
              placeholder="Note ordine"
              value={form.note}
              onChange={e => setForm({...form, note: e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows={2}
            />

            <div className="flex gap-3">
              <button
                onClick={chiudiForm}
                className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={salvaOrdine}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Salva ordine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Vendite