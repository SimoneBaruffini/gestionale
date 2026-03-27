import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { generaFatturaPDF } from '../lib/generaPDF'
type Cliente = { id: string; ragione_sociale: string }
type Prodotto = { id: string; codice: string; descrizione: string; prezzo_vendita: number }
type RigaFattura = {
  id?: string
  prodotto_id?: string
  descrizione: string
  quantita: number
  prezzo_unitario: number
  iva: number
  totale: number
}
type Fattura = {
  id: string
  numero: string
  tipo: string
  data: string
  data_scadenza: string
  stato: string
  totale: number
  totale_imponibile: number
  totale_iva: number
  note: string
  cliente_id: string
  anagrafica?: { ragione_sociale: string }
}

function Fatturazione() {
  const [fatture, setFatture] = useState<Fattura[]>([])
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [prodotti, setProdotti] = useState<Prodotto[]>([])
  const [ricerca, setRicerca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('tutti')
  const [loading, setLoading] = useState(true)
  const [mostraForm, setMostraForm] = useState(false)
  const [fatturaSelezionata, setFatturaSelezionata] = useState<Fattura | null>(null)
  const [righe, setRighe] = useState<RigaFattura[]>([])

  const [form, setForm] = useState({
    numero: '',
    tipo: 'attiva',
    data: new Date().toISOString().split('T')[0],
    data_scadenza: '',
    cliente_id: '',
    stato: 'bozza',
    note: '',
  })

  useEffect(() => { caricaDati() }, [])

  async function caricaDati() {
    setLoading(true)
    const [fattureRes, clientiRes, prodottiRes] = await Promise.all([
      supabase.from('fatture').select('*, anagrafica(ragione_sociale)').order('created_at', { ascending: false }),
      supabase.from('anagrafica').select('id, ragione_sociale'),
      supabase.from('prodotti').select('id, codice, descrizione, prezzo_vendita'),
    ])
    if (fattureRes.data) setFatture(fattureRes.data)
    if (clientiRes.data) setClienti(clientiRes.data)
    if (prodottiRes.data) setProdotti(prodottiRes.data)
    setLoading(false)
  }

  async function generaNumero(tipo: string) {
    const anno = new Date().getFullYear()
    const { count } = await supabase.from('fatture').select('*', { count: 'exact', head: true }).eq('tipo', tipo)
    const prefisso = tipo === 'attiva' ? 'FT' : 'FP'
    return `${prefisso}-${anno}-${String((count || 0) + 1).padStart(4, '0')}`
  }

  function aggiungiRiga() {
    setRighe([...righe, { prodotto_id: '', descrizione: '', quantita: 1, prezzo_unitario: 0, iva: 22, totale: 0 }])
  }

  function aggiornaRiga(index: number, campo: string, valore: string | number) {
    const nuoveRighe = [...righe]
    nuoveRighe[index] = { ...nuoveRighe[index], [campo]: valore }
    // Se seleziona un prodotto, compila automaticamente descrizione e prezzo
    if (campo === 'prodotto_id') {
      const prodotto = prodotti.find(p => p.id === valore)
      if (prodotto) {
        nuoveRighe[index].descrizione = prodotto.descrizione
        nuoveRighe[index].prezzo_unitario = prodotto.prezzo_vendita
        nuoveRighe[index].prodotto_id = prodotto.id
      }
    }
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

  async function salvaFattura() {
    if (!form.cliente_id) return alert('Seleziona un cliente!')
    if (righe.length === 0) return alert('Aggiungi almeno una riga!')

    const { imponibile, iva, totale } = calcolaTotali()
    const numero = form.numero || await generaNumero(form.tipo)

    if (fatturaSelezionata) {
      await supabase.from('fatture').update({
        ...form, numero, totale_imponibile: imponibile, totale_iva: iva, totale
      }).eq('id', fatturaSelezionata.id)
      await supabase.from('fatture_righe').delete().eq('fattura_id', fatturaSelezionata.id)
      await supabase.from('fatture_righe').insert(righe.map(r => ({ ...r, fattura_id: fatturaSelezionata.id })))
    } else {
      const { data } = await supabase.from('fatture').insert([{
        ...form, numero, totale_imponibile: imponibile, totale_iva: iva, totale
      }]).select().single()
      if (data) {
        await supabase.from('fatture_righe').insert(righe.map(r => ({ ...r, fattura_id: data.id })))
      }
    }

    chiudiForm()
    caricaDati()
  }

  async function eliminaFattura(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questa fattura?')) return
    await supabase.from('fatture').delete().eq('id', id)
    caricaDati()
  }

  async function apriModifica(fattura: Fattura) {
    setFatturaSelezionata(fattura)
    setForm({
      numero: fattura.numero,
      tipo: fattura.tipo,
      data: fattura.data,
      data_scadenza: fattura.data_scadenza || '',
      cliente_id: fattura.cliente_id,
      stato: fattura.stato,
      note: fattura.note || '',
    })
    const { data } = await supabase.from('fatture_righe').select('*').eq('fattura_id', fattura.id)
    if (data) setRighe(data)
    setMostraForm(true)
  }

  async function apriNuovo() {
    setFatturaSelezionata(null)
    const numero = await generaNumero('attiva')
    setForm({ numero, tipo: 'attiva', data: new Date().toISOString().split('T')[0], data_scadenza: '', cliente_id: '', stato: 'bozza', note: '' })
    setRighe([])
    setMostraForm(true)
  }

  function chiudiForm() {
    setMostraForm(false)
    setFatturaSelezionata(null)
    setRighe([])
  }

  async function marcaComePagata(fattura: Fattura) {
    if (!confirm('Vuoi marcare questa fattura come pagata?')) return

    // Aggiorna stato fattura
    await supabase.from('fatture').update({ stato: 'pagata' }).eq('id', fattura.id)

    // Crea movimento contabile automatico
    await supabase.from('prima_nota').insert([{
      data: new Date().toISOString().split('T')[0],
      tipo: fattura.tipo === 'attiva' ? 'entrata' : 'uscita',
      descrizione: `Pagamento fattura ${fattura.numero}`,
      categoria: 'Fatture',
      importo: fattura.totale,
      metodo_pagamento: 'bonifico',
      fattura_id: fattura.id,
      cliente_id: fattura.cliente_id,
    }])

    // Scarica automaticamente il magazzino per ogni prodotto in fattura
    const { data: righeFattura } = await supabase
      .from('fatture_righe')
      .select('*')
      .eq('fattura_id', fattura.id)

    if (righeFattura) {
      for (const riga of righeFattura) {
        if (riga.prodotto_id) {
          const { data: prodotto } = await supabase
            .from('prodotti')
            .select('scorta_attuale')
            .eq('id', riga.prodotto_id)
            .single()

          if (prodotto) {
            await supabase.from('prodotti').update({
              scorta_attuale: prodotto.scorta_attuale - riga.quantita
            }).eq('id', riga.prodotto_id)

            await supabase.from('movimenti_magazzino').insert([{
              prodotto_id: riga.prodotto_id,
              tipo: 'scarico',
              quantita: riga.quantita,
              note: `Scarico automatico fattura ${fattura.numero}`,
            }])
          }
        }
      }
    }

    alert('Fattura pagata, movimento contabile e scarico magazzino creati automaticamente!')
    caricaDati()
  }

  const fattureFiltrate = fatture.filter(f => {
    const matchRicerca = f.numero?.toLowerCase().includes(ricerca.toLowerCase()) ||
      f.anagrafica?.ragione_sociale?.toLowerCase().includes(ricerca.toLowerCase())
    const matchTipo = filtroTipo === 'tutti' || f.tipo === filtroTipo
    return matchRicerca && matchTipo
  })

  const coloreStato = (stato: string) => {
    switch (stato) {
      case 'bozza': return 'bg-gray-100 text-gray-700'
      case 'emessa': return 'bg-blue-100 text-blue-700'
      case 'pagata': return 'bg-green-100 text-green-700'
      case 'scaduta': return 'bg-red-100 text-red-700'
      case 'annullata': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const { imponibile, iva, totale } = calcolaTotali()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Fatturazione</h2>
          <p className="text-gray-500 mt-1">Gestione fatture attive e passive</p>
        </div>
        <button
          onClick={apriNuovo}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Nuova fattura
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per numero o cliente..."
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
          <option value="tutti">Tutte</option>
          <option value="attiva">Attive</option>
          <option value="passiva">Passive</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Caricamento...</p>
        ) : fattureFiltrate.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Nessuna fattura trovata</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Numero</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Data</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Cliente/Fornitore</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Stato</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Totale</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {fattureFiltrate.map((f, i) => (
                <tr key={f.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-mono font-medium text-gray-800">{f.numero}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${f.tipo === 'attiva' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {f.tipo.charAt(0).toUpperCase() + f.tipo.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{new Date(f.data).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-3 text-gray-800">{f.anagrafica?.ragione_sociale || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${coloreStato(f.stato)}`}>
                      {f.stato.charAt(0).toUpperCase() + f.stato.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">€ {f.totale?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {f.stato !== 'pagata' && f.stato !== 'annullata' && (
                        <button
                          onClick={() => marcaComePagata(f)}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                        >
                          ✓ Pagata
                        </button>
                      )}
                     <button
  onClick={() => generaFatturaPDF(f)}
  className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
>
  📄 PDF
</button>
``` 
                      <button onClick={() => apriModifica(f)} className="text-blue-500 hover:text-blue-700">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => eliminaFattura(f.id)} className="text-red-500 hover:text-red-700">
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
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {fatturaSelezionata ? 'Modifica fattura' : 'Nuova fattura'}
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <input
                type="text"
                placeholder="Numero fattura"
                value={form.numero}
                onChange={e => setForm({...form, numero: e.target.value})}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={form.tipo}
                onChange={e => setForm({...form, tipo: e.target.value})}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="attiva">Fattura Attiva (emessa)</option>
                <option value="passiva">Fattura Passiva (ricevuta)</option>
              </select>
              <input
                type="date"
                value={form.data}
                onChange={e => setForm({...form, data: e.target.value})}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={form.data_scadenza}
                onChange={e => setForm({...form, data_scadenza: e.target.value})}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={form.cliente_id}
                onChange={e => setForm({...form, cliente_id: e.target.value})}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleziona cliente/fornitore *</option>
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
                <option value="emessa">Emessa</option>
                <option value="pagata">Pagata</option>
                <option value="scaduta">Scaduta</option>
                <option value="annullata">Annullata</option>
              </select>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-700">Righe fattura</h4>
                <button onClick={aggiungiRiga} className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-700">
                  <Plus size={14} /> Aggiungi riga
                </button>
              </div>
              {righe.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4 border border-dashed border-gray-200 rounded-lg">
                  Nessuna riga — clicca "Aggiungi riga"
                </p>
              ) : (
                <div className="space-y-2">
                  {righe.map((riga, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <select
                        value={riga.prodotto_id || ''}
                        onChange={e => aggiornaRiga(i, 'prodotto_id', e.target.value)}
                        className="col-span-3 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Prodotto</option>
                        {prodotti.map(p => (
                          <option key={p.id} value={p.id}>{p.codice} - {p.descrizione}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Descrizione *"
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
                        placeholder="Prezzo €"
                        value={riga.prezzo_unitario}
                        onChange={e => aggiornaRiga(i, 'prezzo_unitario', parseFloat(e.target.value))}
                        className="col-span-2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="col-span-2 text-xs font-medium text-gray-700 text-right">
                        € {riga.totale.toFixed(2)}
                      </div>
                      <button onClick={() => rimuoviRiga(i)} className="col-span-1 text-red-400 hover:text-red-600 flex justify-center">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {righe.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Imponibile:</span><span>€ {imponibile.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>IVA:</span><span>€ {iva.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-800">
                  <span>Totale:</span><span>€ {totale.toFixed(2)}</span>
                </div>
              </div>
            )}

            <textarea
              placeholder="Note"
              value={form.note}
              onChange={e => setForm({...form, note: e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows={2}
            />

            <div className="flex gap-3">
              <button onClick={chiudiForm} className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50">
                Annulla
              </button>
              <button onClick={salvaFattura} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Salva fattura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Fatturazione