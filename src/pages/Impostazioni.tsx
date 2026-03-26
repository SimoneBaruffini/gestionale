import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Save, Building, CreditCard, FileText, Users } from 'lucide-react'
type Impostazioni = {
  id: string
  ragione_sociale: string
  partita_iva: string
  codice_fiscale: string
  indirizzo: string
  citta: string
  cap: string
  provincia: string
  telefono: string
  email: string
  pec: string
  codice_sdi: string
  iban: string
  logo_url: string
  valuta: string
  aliquota_iva_default: number
  note: string
}
// Componente gestione utenti
function GestioneUtenti() {
  const [utenti, setUtenti] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostraInvito, setMostraInvito] = useState(false)
  const [emailInvito, setEmailInvito] = useState('')
  const [ruoloInvito, setRuoloInvito] = useState('operatore')
  const [invioInCorso, setInvioInCorso] = useState(false)

  useEffect(() => { caricaUtenti() }, [])

  async function caricaUtenti() {
    setLoading(true)
    const { data } = await supabase.from('profili').select('*').order('created_at')
    if (data) setUtenti(data)
    setLoading(false)
  }

  async function aggiornaRuolo(id: string, ruolo: string) {
    await supabase.from('profili').update({ ruolo }).eq('id', id)
    caricaUtenti()
  }

 async function invitaUtente() {
    if (!emailInvito) return alert('Inserisci una email!')
    setInvioInCorso(true)

    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInvito, ruolo: ruoloInvito }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert('Errore: ' + data.error)
      } else {
        alert(`Invito inviato a ${emailInvito}!`)
        setMostraInvito(false)
        setEmailInvito('')
        setRuoloInvito('operatore')
        caricaUtenti()
      }
    } catch {
      alert('Errore di connessione')
    }

    setInvioInCorso(false)
 }
  if (loading) return <p className="text-gray-400 text-sm">Caricamento...</p>

  return (
    <div className="space-y-3">
      {/* Lista utenti */}
      {utenti.map(u => (
        <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-800">
              {u.nome ? `${u.nome} ${u.cognome}` : u.email}
            </p>
            <p className="text-xs text-gray-500">{u.email}</p>
          </div>
          <select
            value={u.ruolo}
            onChange={e => aggiornaRuolo(u.id, e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="admin">Admin</option>
            <option value="commerciale">Commerciale</option>
            <option value="magazziniere">Magazziniere</option>
            <option value="contabile">Contabile</option>
            <option value="operatore">Operatore</option>
          </select>
        </div>
      ))}

      {/* Bottone invita */}
      <button
        onClick={() => setMostraInvito(true)}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 text-blue-600 py-2 rounded-lg hover:bg-blue-50 text-sm font-medium transition-colors"
      >
        + Invita nuovo utente
      </button>

      {/* Form invito */}
      {mostraInvito && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Invita nuovo utente</h3>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Email utente *"
                value={emailInvito}
                onChange={e => setEmailInvito(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={ruoloInvito}
                onChange={e => setRuoloInvito(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin">Admin</option>
                <option value="commerciale">Commerciale</option>
                <option value="magazziniere">Magazziniere</option>
                <option value="contabile">Contabile</option>
                <option value="operatore">Operatore</option>
              </select>
              <p className="text-xs text-gray-400">
                L'utente riceverà un'email con il link per creare la sua password.
              </p>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setMostraInvito(false)}
                className="flex-1 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={invitaUtente}
                disabled={invioInCorso}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {invioInCorso ? 'Invio...' : 'Invia invito'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
function Impostazioni() {
  const [loading, setLoading] = useState(true)
  const [salvato, setSalvato] = useState(false)
  const [form, setForm] = useState<Partial<Impostazioni>>({})
  const [id, setId] = useState<string>('')

  useEffect(() => { caricaImpostazioni() }, [])

  async function caricaImpostazioni() {
    setLoading(true)
    const { data } = await supabase.from('impostazioni').select('*').single()
    if (data) {
      setForm(data)
      setId(data.id)
    }
    setLoading(false)
  }

  async function salvaImpostazioni() {
    await supabase.from('impostazioni').update(form).eq('id', id)
    setSalvato(true)
    setTimeout(() => setSalvato(false), 3000)
  }

  if (loading) return <div className="p-6 text-gray-400">Caricamento...</div>

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Impostazioni</h2>
          <p className="text-gray-500 mt-1">Configurazione azienda e sistema</p>
        </div>
        <button
          onClick={salvaImpostazioni}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${salvato ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          <Save size={18} />
          {salvato ? '✓ Salvato!' : 'Salva'}
        </button>
      </div>

      {/* Dati azienda */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Building size={18} className="text-blue-600" />
          <h3 className="font-semibold text-gray-800">Dati azienda</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Ragione sociale"
            value={form.ragione_sociale || ''}
            onChange={e => setForm({...form, ragione_sociale: e.target.value})}
            className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Partita IVA"
            value={form.partita_iva || ''}
            onChange={e => setForm({...form, partita_iva: e.target.value})}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Codice fiscale"
            value={form.codice_fiscale || ''}
            onChange={e => setForm({...form, codice_fiscale: e.target.value})}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Indirizzo"
            value={form.indirizzo || ''}
            onChange={e => setForm({...form, indirizzo: e.target.value})}
            className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Città"
            value={form.citta || ''}
            onChange={e => setForm({...form, citta: e.target.value})}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="CAP"
              value={form.cap || ''}
              onChange={e => setForm({...form, cap: e.target.value})}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Provincia"
              value={form.provincia || ''}
              onChange={e => setForm({...form, provincia: e.target.value})}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <input
            type="text"
            placeholder="Telefono"
            value={form.telefono || ''}
            onChange={e => setForm({...form, telefono: e.target.value})}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email || ''}
            onChange={e => setForm({...form, email: e.target.value})}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Dati fatturazione */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-blue-600" />
          <h3 className="font-semibold text-gray-800">Fatturazione elettronica</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="PEC"
            value={form.pec || ''}
            onChange={e => setForm({...form, pec: e.target.value})}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Codice SDI"
            value={form.codice_sdi || ''}
            onChange={e => setForm({...form, codice_sdi: e.target.value})}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Aliquota IVA default %"
            value={form.aliquota_iva_default || 22}
            onChange={e => setForm({...form, aliquota_iva_default: parseFloat(e.target.value)})}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={form.valuta || 'EUR'}
            onChange={e => setForm({...form, valuta: e.target.value})}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="EUR">EUR — Euro</option>
            <option value="USD">USD — Dollaro</option>
            <option value="GBP">GBP — Sterlina</option>
          </select>
        </div>
      </div>

     {/* Dati bancari */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={18} className="text-blue-600" />
          <h3 className="font-semibold text-gray-800">Dati bancari</h3>
        </div>
        <input
          type="text"
          placeholder="IBAN"
          value={form.iban || ''}
          onChange={e => setForm({...form, iban: e.target.value})}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Gestione utenti */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-blue-600" />
          <h3 className="font-semibold text-gray-800">Gestione utenti</h3>
        </div>
        <GestioneUtenti />
      </div>
    </div>
  )
}

export default Impostazioni