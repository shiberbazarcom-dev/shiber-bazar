import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

// Bengali digit → Latin
const BN_DIGIT = {'০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9'}

function clean(str) {
  if (!str) return '-'
  // Convert Bengali digits to Latin
  let s = String(str).replace(/[০-৯]/g, d => BN_DIGIT[d] || d)
  // Strip anything outside printable ASCII (Bengali letters etc.)
  s = s.replace(/[^\x20-\x7E]/g, '')
  return s.trim() || '-'
}

function money(n) {
  return 'BDT ' + Number(n || 0).toLocaleString('en-IN')
}

function shortDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`
}

const STATUS = {
  pending:'Pending', confirmed:'Confirmed', processing:'Processing',
  shipped:'Shipped', delivered:'Delivered', cancelled:'Cancelled', rejected:'Rejected',
}
const STATUS_COLOR = {
  delivered: [22,163,74], shipped: [22,163,74], confirmed: [37,99,235],
  processing: [217,119,6], pending: [100,116,139],
  cancelled: [220,38,38], rejected: [220,38,38],
}

export function downloadSalesReportPdf({ orders, shopName, month, year }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, H = 297
  const PAD = 16

  const done     = orders.filter(o => ['delivered','shipped','processing','confirmed'].includes(o.status))
  const cancelled = orders.filter(o => ['cancelled','rejected'].includes(o.status))
  const revenue  = done.reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const avg      = done.length ? revenue / done.length : 0

  // ── HEADER ──────────────────────────────────────────────────────────
  // Dark band
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, W, 40, 'F')

  // Blue accent left bar
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, 4, 40, 'F')

  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('SALES REPORT', PAD + 4, 16)

  // Sub info
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(148, 163, 184)
  doc.text(`${MONTHS[month]} ${year}  |  ${clean(shopName)}`, PAD + 4, 24)
  doc.text(`01 – ${new Date(year, month+1, 0).getDate()} ${MONTHS[month]} ${year}`, PAD + 4, 31)

  // Right: generated date
  doc.setFontSize(8)
  doc.text(`Generated: ${shortDate(new Date().toISOString())}`, W - PAD, 22, { align: 'right' })
  doc.text(`Total orders: ${orders.length}`, W - PAD, 30, { align: 'right' })

  // ── KPI ROW ──────────────────────────────────────────────────────────
  const kpiY = 48
  const kpis = [
    { label: 'Total Revenue',    value: money(revenue),           accent: [37,99,235] },
    { label: 'Avg Order Value',  value: money(avg),               accent: [124,58,237] },
    { label: 'Completed Orders', value: String(done.length),      accent: [22,163,74] },
    { label: 'Cancelled',        value: String(cancelled.length), accent: [220,38,38] },
  ]
  const kW = (W - PAD * 2 - 9) / 4
  kpis.forEach((k, i) => {
    const x = PAD + i * (kW + 3)
    // Card
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, kpiY, kW, 18, 2, 2, 'F')
    // Top accent line
    doc.setFillColor(...k.accent)
    doc.rect(x, kpiY, kW, 1.5, 'F')
    // Value
    doc.setTextColor(...k.accent)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(k.value.length > 9 ? 8 : 10)
    doc.text(k.value, x + kW / 2, kpiY + 10, { align: 'center' })
    // Label
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.text(k.label.toUpperCase(), x + kW / 2, kpiY + 15.5, { align: 'center' })
  })

  // ── ORDERS TABLE ────────────────────────────────────────────────────
  const tableY = kpiY + 26

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text('Order Details', PAD, tableY)
  doc.setFillColor(37, 99, 235)
  doc.rect(PAD, tableY + 2, 18, 0.7, 'F')

  const rows = orders.map((o, i) => [
    i + 1,
    clean(o.order_number || o.id?.slice(0,8)),
    shortDate(o.created_at),
    clean(o.customer_name),
    clean(o.customer_phone),
    STATUS[o.status] || clean(o.status),
    money(o.total_amount),
  ])

  autoTable(doc, {
    startY: tableY + 6,
    head: [['#', 'Order No', 'Date', 'Customer', 'Phone', 'Status', 'Amount']],
    body: rows.length ? rows : [['','No orders this period','','','','','']],
    margin: { left: PAD, right: PAD },
    styles: {
      fontSize: 8, cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      font: 'helvetica', textColor: [51, 65, 85],
      lineColor: [226, 232, 240], lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [15, 23, 42], textColor: [255,255,255],
      fontStyle: 'bold', fontSize: 7.5,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 7,  halign: 'center', textColor: [148,163,184] },
      1: { cellWidth: 28, fontStyle: 'bold', textColor: [37,99,235] },
      2: { cellWidth: 23 },
      3: { cellWidth: 35 },
      4: { cellWidth: 27 },
      5: { cellWidth: 24, halign: 'center' },
      6: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell(data) {
      if (data.column.index === 5 && data.section === 'body') {
        const s = orders[data.row.index]?.status
        const col = STATUS_COLOR[s] || [100,116,139]
        data.cell.styles.textColor = col
      }
    },
  })

  // ── TOP PRODUCTS (if items exist) ────────────────────────────────────
  const allItems = orders.flatMap(o => o.order_items || [])
  const t1end = doc.lastAutoTable?.finalY || tableY + 60

  if (allItems.length > 0 && t1end + 50 < H - 20) {
    const pMap = {}
    allItems.forEach(item => {
      const name = clean(item.products?.product_name)
      if (!pMap[name]) pMap[name] = { qty: 0, rev: 0 }
      pMap[name].qty += Number(item.quantity || 1)
      pMap[name].rev += Number(item.unit_price || 0) * Number(item.quantity || 1)
    })
    const topRows = Object.entries(pMap)
      .sort((a, b) => b[1].rev - a[1].rev)
      .slice(0, 8)
      .map(([name, d], i) => [i + 1, name, d.qty, money(d.rev)])

    const tpY = t1end + 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(15, 23, 42)
    doc.text('Top Products', PAD, tpY)
    doc.setFillColor(124, 58, 237)
    doc.rect(PAD, tpY + 2, 20, 0.7, 'F')

    autoTable(doc, {
      startY: tpY + 6,
      head: [['#', 'Product', 'Qty', 'Revenue']],
      body: topRows,
      margin: { left: PAD, right: PAD },
      styles: {
        fontSize: 8, cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
        font: 'helvetica', textColor: [51, 65, 85],
        lineColor: [226, 232, 240], lineWidth: 0.2,
      },
      headStyles: { fillColor: [79, 70, 229], textColor: [255,255,255], fontStyle: 'bold', fontSize: 7.5,
        cellPadding: { top: 4, bottom: 4, left: 3, right: 3 } },
      alternateRowStyles: { fillColor: [250, 245, 255] },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center', textColor: [148,163,184] },
        1: { },
        2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 38, halign: 'right', fontStyle: 'bold', textColor: [124,58,237] },
      },
    })
  }

  // ── SUMMARY FOOTER BAR ───────────────────────────────────────────────
  const lastY = doc.lastAutoTable?.finalY || t1end
  if (lastY + 22 < H - 14) {
    const sY = lastY + 8
    doc.setFillColor(15, 23, 42)
    doc.roundedRect(PAD, sY, W - PAD * 2, 14, 2, 2, 'F')
    const cols = [
      { l: 'TOTAL REVENUE',   v: money(revenue)              },
      { l: 'COMPLETED',       v: `${done.length} orders`     },
      { l: 'CANCELLED',       v: `${cancelled.length} orders`},
      { l: 'AVG ORDER VALUE', v: money(avg)                  },
    ]
    const cW = (W - PAD * 2) / 4
    cols.forEach((c, i) => {
      const x = PAD + i * cW
      if (i > 0) {
        doc.setDrawColor(51, 65, 85)
        doc.setLineWidth(0.2)
        doc.line(x, sY + 3, x, sY + 11)
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.5)
      doc.setTextColor(100, 116, 139)
      doc.text(c.l, x + cW / 2, sY + 5.5, { align: 'center' })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      doc.text(c.v, x + cW / 2, sY + 11, { align: 'center' })
    })
  }

  // ── PAGE FOOTER ──────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(PAD, H - 10, W - PAD, H - 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text('Shiber Bazar', PAD, H - 6)
    doc.text('CONFIDENTIAL', W / 2, H - 6, { align: 'center' })
    doc.text(`Page ${p} / ${pages}`, W - PAD, H - 6, { align: 'right' })
  }

  doc.save(`sales-report-${year}-${String(month+1).padStart(2,'0')}-${clean(shopName)}.pdf`)
}
