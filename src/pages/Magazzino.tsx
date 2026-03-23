import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Pencil, Trash2, AlertTriangle } from 'lucide-react'

// Tipo che descrive un prodotto in magazzino
type Prodotto = {
  id: string
  codice: string
  descrizione: string
  categoria: string
  unita_misura: string
  prezzo_acquisto: number
  prezzo_vendita: number
  scorta_attuale: number
  scorta_minima: number
  note: string
  attivo: boolean
}

function Magazzino() {
  const [prodotti, setProdotti] = useState<Prodotto[]>([])
  const [ricerca, setRicerca] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostraForm, setMostraForm] = useState(false)
  const [prodottoSelezionato, setProdottoSelezionato] = useState<Prodotto | null>(null)
  const [mostraMovimento, setMostraMovimento] = useState(false)
  const [prodottoMovimento, setProdottoMovimento] = useState<Prodotto | null>(null)
  const [movimento, setMovimento] = useState({ tipo: 'carico', quantita: '', note: '' })

  const [form, setForm] = useState({
    codice: '',
    descrizione: '',
    categoria: '',
    unita_misura: 'pz',
    prezzo_acquisto: '',
    prezzo_vendita: '',
    scorta_attuale: '',
    scorta_minima: '',
    note: '',
  })

  useEffect(() => {
    caricaProdotti()
  }, [])

  async function caricaProdotti() {
    setLoading(true)
    const { data, error } = await supabase
      .from('prodotti')
      .select('*')
      .order('descrizione')
    if (!error && data) setProdotti(data)
    setLoading(false)
  }

  async function salvaProdotto() {
    if (!form.codice) return alert('Inserisci il codice prodotto!')
    if (!form.descrizione) return alert('Inserisci la descrizione!')

    const dati = {
      ...form,
      prezzo_acquisto: parseFloat(form.prezzo_acquisto) || 0,
      prezzo_vendita: parseFloat(form.prezzo_vendita) || 0,
      scorta_attuale: parseFloat(form.scorta_attuale) || 0,
      scorta_minima: parseFloat(form.scorta_minima) || 0,
    }

    if (prodottoSelezionato) {
      await supabase.from('prodotti').update(dati).eq('id', prodottoSelezionato.id)
    } else {
      await supabase.from('prodotti').insert([dati])
    }

    chiudiForm()
    caricaProdotti()
  }

  async function eliminaProdotto(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return
    await supabase.from('prodotti').delete().eq('id', id)
    caricaProdotti()
  }

  async function salvaMovimento() {
    if (!movimento.quantita) return alert('Inserisci la quantità!')
    if (!prodottoMovimento) return

    const quantita = parseFloat(movimento.quantita)
    const nuovaScorta = movimento.tipo === 'carico'
      ? prodottoMovimento.scorta_attuale + quantita
      : prodottoMovimento.scorta_attuale - quantita

    await supabase.from('movimenti_magazzino').insert([{
      prodotto_id: prodottoMovimento.id,
      tipo: movimento.tipo,
      quantita,
      note: movimento.note,
    }])

    await supabase.from('prodotti')
      .update({ scorta_attuale: nuovaScorta })
      .eq('id', prodottoMovimento.id)

    setMostraMovimento(false)
    setMovimento({ tipo: 'carico', quantita: '', note: '' })
    caricaProdotti()
  }

  function modificaProdotto(prodotto: Prodotto) {
    setProdottoSelezionato(prodotto)
    setForm({
      codice: prodotto.codice,
      descrizione: prodotto.descrizione,
      categoria: prodotto.categoria || '',
      unita_misura: prodotto.unita_misura || 'pz',
      prezzo_acquisto: prodotto.prezzo_acquisto?.toString() || '',
      prezzo_vendita: prodotto.prezzo_vendita?.toString() || '',
      scorta_attuale: prodotto.scorta_attuale?.toString() || '',
      scorta_minima: prodotto.scorta_minima?.toString() || '',
      note: prodotto.note || '',
    })
    setMostraForm(true)
  }

  function chiudiForm() {
    setMostraForm(false)
    setProdottoSelezionato(null)
    setForm({
      codice: '', descrizione: '', categoria: '', unita_misura: 'pz',
      prezzo_acquisto: '', prezzo_vendita: '', scorta_attuale: '', scorta_minima: '', note: '',
    })
  }

  const prodottiFiltrati = prodotti.filter(p =>
    p.descrizione?.toLowerCase().includes(ricerca.toLowerCase()) ||
    p.codice?.toLowerCase().includes(ricerca.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(ricerca.toLowerCase())
  )

  const prodottiSottoScorta = prodotti.filter(p => p.scorta_attuale <= p.scorta_minima)

  return (
    <div className="p-6">
      {/* Intestazione */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Magazzino</h2>
          <p className="text-gray-500 mt-1">Gestione prodotti e inventario</p>
        </div>
        <button
          onClick={() => { setMostraForm(true); setProdottoSelezionato(null) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Nuovo prodotto
        </button>
      </div>

      {/* Alert scorta minima */}
      {prodottiSottoScorta.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-orange-500" />
          <p className="text-orange-700 text-sm font-medium">
            {prodottiSottoScorta.length} prodott{prodottiSottoScorta.length === 1 ? 'o' : 'i'} sotto la scorta minima!
          </p>
        </div>
      )}

      {/* Barra ricerca */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca per codice, descrizione, categoria..."
          value={ricerca}
          onChange={e => setRicerca(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabella prodotti */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Caricamento...</p>
        ) : prodottiFiltrati.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Nessun prodotto trovato</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Codice</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Descrizione</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Categoria</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Scorta</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Prezzo Vendita</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {prodottiFiltrati.map((p, i) => (
                <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-mono text-gray-700">{p.codice}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.descrizione}</td>
                  <td className="px-4 py-3 text-gray-600">{p.categoria || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${p.scorta_attuale <= p.scorta_minima ? 'text-orange-500' : 'text-green-600'}`}>
                      {p.scorta_attuale} {p.unita_misura}
                    </span>
                    {p.scorta_attuale <= p.scorta_minima && (
                      <AlertTriangle size={14} className="inline ml-1 text-orange-500" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">€ {p.prezzo_vendita?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setProdottoMovimento(p); setMostraMovimento(true) }}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                      >
                        Movimento
                      </button>
                      <button onClick={() => modificaProdotto(p)} className="text-blue-500 hover:text-blue-700">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => eliminaProdotto(p.id)} className="text-red-500 hover:text-red-700">
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

      {/* Form nuovo/modifica prodotto */}
      {mostraForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {prodottoSelezionato ? 'Modifica prodotto' : 'Nuovo prodotto'}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Codice *"
                  value={form.codice}
                  onChange={e => setForm({...form, codice: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Unità di misura"
                  value={form.unita_misura}
                  onChange={e => setForm({...form, unita_misura: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="text"
                placeholder="Descrizione *"
                value={form.descrizione}
                onChange={e => setForm({...form, descrizione: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Categoria"
                value={form.categoria}
                onChange={e => setForm({...form, categoria: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Prezzo acquisto €"
                  value={form.prezzo_acquisto}
                  onChange={e => setForm({...form, prezzo_acquisto: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Prezzo vendita €"
                  value={form.prezzo_vendita}
                  onChange={e => setForm({...form, prezzo_vendita: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Scorta attuale"
                  value={form.scorta_attuale}
                  onChange={e => setForm({...form, scorta_attuale: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Scorta minima"
                  value={form.scorta_minima}
                  onChange={e => setForm({...form, scorta_minima: e.target.value})}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
                onClick={chiudiForm}
                className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={salvaProdotto}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form movimento magazzino */}
      {mostraMovimento && prodottoMovimento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Movimento magazzino</h3>
            <p className="text-sm text-gray-500 mb-4">{prodottoMovimento.descrizione} — Scorta attuale: <strong>{prodottoMovimento.scorta_attuale} {prodottoMovimento.unita_misura}</strong></p>
            <div className="space-y-3">
              <select
                value={movimento.tipo}
                onChange={e => setMovimento({...movimento, tipo: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="carico">➕ Carico</option>
                <option value="scarico">➖ Scarico</option>
              </select>
              <input
                type="number"
                placeholder="Quantità *"
                value={movimento.quantita}
                onChange={e => setMovimento({...movimento, quantita: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Note (es. ordine fornitore, vendita...)"
                value={movimento.note}
                onChange={e => setMovimento({...movimento, note: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setMostraMovimento(false); setMovimento({ tipo: 'carico', quantita: '', note: '' }) }}
                className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={salvaMovimento}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Magazzino