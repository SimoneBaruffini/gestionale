// Funzione serverless per invitare utenti
// Usa la service role key di Supabase per mandare email di invito
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, ruolo } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email obbligatoria' })
  }

  try {
    // Invita utente tramite Supabase Admin API
    const response = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/invite`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({ email }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return res.status(400).json({ error: data.message || 'Errore invito' })
    }

    // Crea profilo con ruolo
    await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/profili`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id: data.id,
          email,
          ruolo: ruolo || 'operatore',
        }),
      }
    )

    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}