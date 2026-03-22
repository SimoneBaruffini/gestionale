// Pagina Dashboard - prima cosa che vede l'utente dopo il login
// Modificare i KPI qui sotto per adattarli al settore aziendale
function Dashboard() {
  return (
    <div className="p-6">
      {/* Intestazione pagina */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500 mt-1">Benvenuto nel tuo gestionale</p>
      </div>

      {/* Schede KPI - indicatori principali */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Fatturato del mese</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">€ 0,00</p>
          <p className="text-xs text-green-500 mt-1">↑ 0% vs mese scorso</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Ordini attivi</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">0</p>
          <p className="text-xs text-blue-500 mt-1">→ Nessun ordine</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Clienti totali</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">0</p>
          <p className="text-xs text-blue-500 mt-1">→ Nessun cliente</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Prodotti a scorta minima</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">0</p>
          <p className="text-xs text-orange-500 mt-1">→ Magazzino OK</p>
        </div>
      </div>

      {/* Sezione attività recenti */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Attività recenti</h3>
        <p className="text-gray-400 text-sm text-center py-8">
          Nessuna attività ancora — inizia aggiungendo clienti o prodotti!
        </p>
      </div>
    </div>
  )
}

export default Dashboard