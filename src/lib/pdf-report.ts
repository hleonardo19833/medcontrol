import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Dose, Medication, AdherenceStats, Profile } from '@/types'
import { getStatusLabel } from '@/lib/utils'

interface ReportData {
  profile: Profile
  medications: Medication[]
  doses: Dose[]
  stats: AdherenceStats
  startDate: string
  endDate: string
}

export function generateAdherencePDF(data: ReportData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15

  // ---- Header ----
  doc.setFillColor(14, 165, 233) // brand-500
  doc.rect(0, 0, pageW, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('MedControl', margin, 18)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Relatório de Adesão ao Tratamento', margin, 26)

  const today = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  doc.text(`Gerado em ${today}`, pageW - margin, 26, { align: 'right' })

  // ---- Patient Info ----
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Dados do Paciente', margin, 48)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nome: ${data.profile.full_name}`, margin, 56)
  doc.text(`E-mail: ${data.profile.email}`, margin, 63)
  const period = `${format(parseISO(data.startDate), 'dd/MM/yyyy')} a ${format(parseISO(data.endDate), 'dd/MM/yyyy')}`
  doc.text(`Período: ${period}`, margin, 70)

  // ---- Stats Summary ----
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumo de Adesão', margin, 84)

  const statsBoxes = [
    { label: 'Total de Doses', value: String(data.stats.total_doses), color: [14, 165, 233] },
    { label: 'Doses Tomadas', value: String(data.stats.taken_doses), color: [22, 163, 74] },
    { label: 'Doses Perdidas', value: String(data.stats.missed_doses), color: [220, 38, 38] },
    { label: 'Taxa de Adesão', value: `${data.stats.adherence_rate}%`, color: [124, 58, 237] },
  ]

  const boxW = (pageW - margin * 2 - 9) / 4
  statsBoxes.forEach((box, i) => {
    const x = margin + i * (boxW + 3)
    doc.setFillColor(...(box.color as [number, number, number]))
    doc.roundedRect(x, 88, boxW, 22, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(box.value, x + boxW / 2, 100, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(box.label, x + boxW / 2, 107, { align: 'center' })
  })

  // ---- Medications List ----
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Medicamentos do Período', margin, 122)

  autoTable(doc, {
    startY: 126,
    margin: { left: margin, right: margin },
    head: [['Medicamento', 'Dose', 'Frequência', 'Horários']],
    body: data.medications.map(m => [
      m.name,
      `${m.dose_amount} ${m.dose_unit}`,
      m.times_per_day === 1 ? '1x ao dia' : `${m.times_per_day}x ao dia`,
      m.schedule_times.join(', '),
    ]),
    headStyles: { fillColor: [14, 165, 233], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [240, 249, 255] },
  })

  // ---- Dose History ----
  const lastY = (doc as any).lastAutoTable.finalY + 10

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Histórico Detalhado', margin, lastY)

  const doseRows = data.doses.map(d => [
    format(parseISO(d.scheduled_date), 'dd/MM/yyyy'),
    d.scheduled_time,
    d.medication?.name || '',
    `${d.medication?.dose_amount} ${d.medication?.dose_unit}`,
    getStatusLabel(d.status),
    d.confirmed_at ? format(parseISO(d.confirmed_at), 'HH:mm') : '-',
    d.notes || '-',
  ])

  autoTable(doc, {
    startY: lastY + 4,
    margin: { left: margin, right: margin },
    head: [['Data', 'Horário', 'Medicamento', 'Dose', 'Status', 'Confirmado', 'Notas']],
    body: doseRows,
    headStyles: { fillColor: [14, 165, 233], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      4: {
        fontStyle: 'bold',
      },
    },
    didParseCell: (hookData) => {
      if (hookData.column.index === 4 && hookData.section === 'body') {
        const status = hookData.cell.text[0]
        if (status === 'Tomado')  hookData.cell.styles.textColor = [22, 163, 74]
        if (status === 'Perdido') hookData.cell.styles.textColor = [220, 38, 38]
        if (status === 'Pulado')  hookData.cell.styles.textColor = [202, 138, 4]
      }
    },
  })

  // ---- Footer ----
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `MedControl • Página ${i} de ${pageCount} • Este documento é apenas informativo, não substitui orientação médica.`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    )
  }

  const fileName = `medcontrol-relatorio-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  doc.save(fileName)
}
