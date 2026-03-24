import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, Users, ShoppingCart, AlertTriangle } from 'lucide-react'

function Dashboard() {
  const [dati, setDati] = useState({
    fatturato: 0,
    ordiniAttivi: 0,
    clientiTotali: 0,
    prodottiSottoScorta: 0,
    fattureScadute: 0,
    taskDaFare: 0,
  })
  const [attivitaRecenti, setAttivitaRecenti] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { caricaDati() }, [])

  async function caricaDati() {
    setLoading(true)

    const [
      fattureRes,
      ordiniRes,
      clientiRes,
      magazzinoRes,
      taskRes,
      attivitaRes,
    ] = await Promise.all([
      // Fatturato del mese corrente
      supabase.from('fatture')
        .select('totale')
        .eq('tipo', 'attiva')
        .eq('stato', 'pagata')
        .gte('data', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
      // Ordini attivi
      supabase.from('ordini')
        .select('id', { count: 'exact' })
        .in('stato', ['confermato', 'spedito']),
      // Clienti totali
      supabase.from('anagrafica')
        .select('id', { count: 'exact' })
        .eq('tipo', 'cliente'),
      // Prodotti sotto scorta
      supabase.from('prodotti')
        .select('id, scorta_attuale, scorta_minima'),
      // Task da fare
      supabase.from('task')
        .select('id', { count: 'exact' })
        .eq('stato', 'da_fare'),
      // Ultime attività
      supabase.from('fatture')
        .select('numero, data, totale, anagrafica(ragione_sociale)')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const fatturato = fattureRes.data?.reduce((acc, f) => acc + (f.totale || 0), 0) || 0
    const prodottiSottoScorta = magazzinoRes.data?.filter(p => p.scorta_attuale <= p.scorta_minima).length || 0

    setDati({
      fatturato,
      ordiniAttivi: ordiniRes.count || 0,
      clientiTotali: clientiRes.count || 0,
      prodottiSottoScorta,
      fattureScadute: 0,
      taskDaFare: taskRes.count || 0,
    })

    if (attivitaRes.data) setAttivitaRecenti(attivitaRes.data)
    setLoading(false)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500 mt-1">Benvenuto nel tuo gestionale</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={18} className="text-green-500" />
            <p className="text-sm text-gray-500">Fatturato del mese</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">€ {dati.fatturato.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart size={18} className="text-blue-500" />
            <p className="text-sm text-gray-500">Ordini attivi</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{dati.ordiniAttivi}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Users size={18} className="text-purple-500" />
            <p className="text-sm text-gray-500">Clienti totali</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{dati.clientiTotali}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={18} className="text-orange-500" />
            <p className="text-sm text-gray-500">Prodotti sotto scorta</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">{dati.prodottiSottoScorta}</p>
        </div>
      </div>

      {/* Alert */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {dati.prodottiSottoScorta > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle size={20} className="text-orange-500" />
            <p className="text-orange-700 text-sm font-medium">
              {dati.prodottiSottoScorta} prodott{dati.prodottiSottoScorta === 1 ? 'o' : 'i'} sotto scorta minima!
            </p>
          </div>
        )}
        {dati.taskDaFare > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle size={20} className="text-blue-500" />
            <p className="text-blue-700 text-sm font-medium">
              {dati.taskDaFare} task da completare!
            </p>
          </div>
        )}
      </div>

      {/* Ultime fatture */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ultime fatture emesse</h3>
        {loading ? (
          <p className="text-gray-400 text-sm text-center py-4">Caricamento...</p>
        ) : attivitaRecenti.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Nessuna fattura ancora</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 text-gray-600 font-medium">Numero</th>
                <th className="text-left px-4 py-2 text-gray-600 font-medium">Cliente</th>
                <th className="text-left px-4 py-2 text-gray-600 font-medium">Data</th>
                <th className="text-left px-4 py-2 text-gray-600 font-medium">Totale</th>
              </tr>
            </thead>
            <tbody>
              {attivitaRecenti.map((f, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 font-mono text-gray-800">{f.numero}</td>
                  <td className="px-4 py-2 text-gray-600">{f.anagrafica?.ragione_sociale || '—'}</td>
                  <td className="px-4 py-2 text-gray-600">{new Date(f.data).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-2 font-medium text-gray-800">€ {f.totale?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Dashboard