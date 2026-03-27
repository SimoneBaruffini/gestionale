import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from './supabase'

// Genera e scarica il PDF di una fattura
// Per personalizzare il layout modifica questa funzione
export async function generaFatturaPDF(fattura: any) {
  // Carica righe fattura
  const { data: righe } = await supabase
    .from('fatture_righe')
    .select('*')
    .eq('fattura_id', fattura.id)

  // Carica impostazioni azienda
  const { data: impostazioni } = await supabase
    .from('impostazioni')
    .select('*')
    .single()

  const doc = new jsPDF()

  // Colori
  const bluScuro = [30, 64, 175]
  const grigio = [107, 114, 128]
  const grigioCh = [243, 244, 246]

  // Header azienda
  doc.setFillColor(bluScuro[0], bluScuro[1], bluScuro[2])
  doc.rect(0, 0, 210, 35, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(impostazioni?.ragione_sociale || 'La mia azienda', 15, 15)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text([
    impostazioni?.indirizzo || '',
    `${impostazioni?.cap || ''} ${impostazioni?.citta || ''} ${impostazioni?.provincia ? `(${impostazioni.provincia})` : ''}`,
    `P.IVA: ${impostazioni?.partita_iva || ''}`,
    `${impostazioni?.email || ''}`,
  ].filter(Boolean), 15, 22)

  // Numero fattura in alto a destra
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(fattura.numero, 195, 15, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Data: ${new Date(fattura.data).toLocaleDateString('it-IT')}`, 195, 22, { align: 'right' })
  if (fattura.data_scadenza) {
    doc.text(`Scadenza: ${new Date(fattura.data_scadenza).toLocaleDateString('it-IT')}`, 195, 27, { align: 'right' })
  }

  // Dati cliente
  doc.setTextColor(0, 0, 0)
  doc.setFillColor(grigioCh[0], grigioCh[1], grigioCh[2])
  doc.rect(15, 42, 85, 30, 'F')
  doc.setFontSize(8)
  doc.setTextColor(grigio[0], grigio[1], grigio[2])
  doc.text('CLIENTE / FORNITORE', 18, 48)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(fattura.anagrafica?.ragione_sociale || '—', 18, 55)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  // Stato fattura
  doc.setFillColor(grigioCh[0], grigioCh[1], grigioCh[2])
  doc.rect(110, 42, 85, 30, 'F')
  doc.setFontSize(8)
  doc.setTextColor(grigio[0], grigio[1], grigio[2])
  doc.text('DETTAGLI FATTURA', 113, 48)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Tipo: ${fattura.tipo === 'attiva' ? 'Fattura Attiva' : 'Fattura Passiva'}`, 113, 55)
  doc.text(`Stato: ${fattura.stato.charAt(0).toUpperCase() + fattura.stato.slice(1)}`, 113, 61)
  if (impostazioni?.iban) doc.text(`IBAN: ${impostazioni.iban}`, 113, 67)

  // Tabella righe
  autoTable(doc, {
    startY: 80,
    head: [['Descrizione', 'Quantità', 'Prezzo Unit.', 'IVA %', 'Totale']],
    body: (righe || []).map(r => [
      r.descrizione,
      r.quantita.toString(),
      `€ ${r.prezzo_unitario.toFixed(2)}`,
      `${r.iva}%`,
      `€ ${r.totale.toFixed(2)}`,
    ]),
    headStyles: {
      fillColor: bluScuro as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: grigioCh as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
    },
  })

  // Totali
  const finalY = (doc as any).lastAutoTable.finalY + 5
  doc.setFillColor(grigioCh[0], grigioCh[1], grigioCh[2])
  doc.rect(120, finalY, 75, 30, 'F')
  doc.setFontSize(9)
  doc.setTextColor(grigio[0], grigio[1], grigio[2])
  doc.text('Imponibile:', 125, finalY + 8)
  doc.text('IVA:', 125, finalY + 15)
  doc.setTextColor(0, 0, 0)
  doc.text(`€ ${fattura.totale_imponibile?.toFixed(2)}`, 193, finalY + 8, { align: 'right' })
  doc.text(`€ ${fattura.totale_iva?.toFixed(2)}`, 193, finalY + 15, { align: 'right' })

  // Totale finale
  doc.setFillColor(bluScuro[0], bluScuro[1], bluScuro[2])
  doc.rect(120, finalY + 20, 75, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('TOTALE:', 125, finalY + 27)
  doc.text(`€ ${fattura.totale?.toFixed(2)}`, 193, finalY + 27, { align: 'right' })

  // Note
  if (fattura.note) {
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Note:', 15, finalY + 25)
    doc.text(fattura.note, 15, finalY + 30)
  }

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(grigio[0], grigio[1], grigio[2])
  doc.text(
    `${impostazioni?.ragione_sociale || ''} — P.IVA: ${impostazioni?.partita_iva || ''} — ${impostazioni?.pec || ''}`,
    105, 285, { align: 'center' }
  )

  // Scarica il PDF
  doc.save(`${fattura.numero}.pdf`)
}