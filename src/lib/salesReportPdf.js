import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const C = {
  navy:    [15,  23,  42],   // #0f172a
  blue:    [37,  99,  235],  // #2563eb
  indigo:  [79,  70,  229],  // #4f46e5
  green:   [22,  163, 74],   // #16a34a
  red:     [220, 38,  38],   // #dc2626
  amber:   [217, 119, 6],    // #d97706
  purple:  [124, 58,  237],  // #7c3aed
  white:   [255, 255, 255],
  gray50:  [248, 250, 252],
  gray100: [241, 245, 249],
  gray300: [203, 213, 225],
  gray400: [148, 163, 184],
  gray500: [100, 116, 139],
  gray700: [51,  65,  85],
  gray800: [30,  41,  59],
  gray900: [15,  23,  42],
}

function hex(r, g, b) { return `#${[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('')}` }

function fmtMoney(n) {
  return 'BDT ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })
}

function fmtDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`
}

function setColor(doc, rgb, type = 'fill') {
  if (type === 'fill') doc.setFillColor(...rgb)
  else doc.setTextColor(...rgb)
  return doc
}

/**
 * Draw a rounded rectangle (jsPDF doesn't expose roundedRect easily in all versions).
 * Falls back to plain rect if needed.
 */
function rRect(doc, x, y, w, h, r, style) {
  try { doc.roundedRect(x, y, w, h, r, r, style) }
  catch { doc.rect(x, y, w, h, style) }
}

/**
 * Generate and download a monthly sales report PDF.
 *
 * @param {object} opts
 * @param {Array}  opts.orders   – orders for the shop (with order_items)
 * @param {string} opts.shopName
 * @param {number} opts.month    – 0-indexed
 * @param {number} opts.year
 */
export function downloadSalesReportPdf({ orders, shopName, month, year }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, H = 297

  // ─── STATUS HELPERS ───────────────────────────────────────────────────
  const DONE    = ['delivered', 'shipped', 'processing', 'confirmed']
  const CANCEL  = ['cancelled', 'rejected']

  const completed = orders.filter(o => DONE.includes(o.status))
  const cancelled = orders.filter(o => CANCEL.includes(o.status))
  const revenue   = completed.reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const avgOrder  = completed.length ? revenue / completed.length : 0

  const statusLabel = {
    pending:'Pending', confirmed:'Confirmed', processing:'Processing',
    shipped:'Shipped', delivered:'Delivered', cancelled:'Cancelled', rejected:'Rejected',
  }

  // ══════════════════════════════════════════════════════════════════════
  // PAGE 1
  // ══════════════════════════════════════════════════════════════════════

  // ─── HEADER BLOCK ─────────────────────────────────────────────────────
  // Dark navy background
  setColor(doc, C.navy)
  doc.rect(0, 0, W, 52, 'F')

  // Accent stripe (right side decoration)
  setColor(doc, C.indigo)
  doc.rect(W - 6, 0, 6, 52, 'F')
  setColor(doc, C.blue)
  doc.rect(W - 12, 0, 6, 52, 'F')

  // Brand mark — small square logo
  setColor(doc, C.blue)
  rRect(doc, 14, 10, 9, 9, 1.5, 'F')
  setColor(doc, C.white, 'text')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('SB', 18.5, 16.8, { align: 'center' })

  // Title
  setColor(doc, C.white, 'text')
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('SALES REPORT', 28, 17)

  // Subtitle
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text(`${MONTHS[month]} ${year}`, 28, 24)

  // Shop name pill
  setColor(doc, [37, 99, 200])
  rRect(doc, 28, 27, Math.min(doc.getTextWidth(shopName) + 8, 70), 7, 1.5, 'F')
  setColor(doc, C.white, 'text')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text(shopName, 32, 32.2)

  // Generated date (right side of header)
  const genDate = fmtDate(new Date().toISOString())
  setColor(doc, C.gray400, 'text')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${genDate}`, W - 18, 17, { align: 'right' })
  doc.text(`Period: 01 ${MONTHS[month].slice(0,3)} – ${new Date(year, month + 1, 0).getDate()} ${MONTHS[month].slice(0,3)} ${year}`, W - 18, 24, { align: 'right' })

  // Divider line inside header
  doc.setDrawColor(...C.indigo)
  doc.setLineWidth(0.3)
  doc.line(14, 42, W - 18, 42)

  // Quick stats row in header
  const qStats = [
    { v: String(orders.length),     l: 'Total Orders' },
    { v: String(completed.length),  l: 'Completed' },
    { v: String(cancelled.length),  l: 'Cancelled' },
    { v: `${completed.length && orders.length ? Math.round(completed.length/orders.length*100) : 0}%`, l: 'Success Rate' },
  ]
  const qW = (W - 32) / 4
  qStats.forEach((s, i) => {
    const x = 14 + i * qW
    setColor(doc, C.white, 'text')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(s.v, x + qW / 2, 48.5, { align: 'center' })
    setColor(doc, C.gray400, 'text')
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.text(s.l, x + qW / 2, 53.5, { align: 'center' })
  })

  // ─── KPI CARDS ROW ────────────────────────────────────────────────────
  const kpiY = 62
  const kpis = [
    { label: 'Total Revenue',   value: fmtMoney(revenue),          color: C.blue,   icon: '▲' },
    { label: 'Avg Order Value', value: fmtMoney(avgOrder),          color: C.purple, icon: '◈' },
    { label: 'Completed Orders',value: String(completed.length),    color: C.green,  icon: '✓' },
    { label: 'Cancelled',       value: String(cancelled.length),    color: C.red,    icon: '✕' },
  ]
  const kW = (W - 28 - 9) / 4

  kpis.forEach((k, i) => {
    const x = 14 + i * (kW + 3)

    // Card background
    setColor(doc, C.white)
    rRect(doc, x, kpiY, kW, 22, 2, 'F')

    // Left color stripe
    setColor(doc, k.color)
    rRect(doc, x, kpiY, 3, 22, 1, 'F')

    // Top light band
    doc.setFillColor(k.color[0], k.color[1], k.color[2], 0.08)
    doc.rect(x + 3, kpiY, kW - 3, 5, 'F')

    // Label
    setColor(doc, C.gray500, 'text')
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.text(k.label.toUpperCase(), x + 6, kpiY + 4, {})

    // Value
    setColor(doc, C.gray800, 'text')
    doc.setFontSize(k.value.length > 8 ? 8 : 10)
    doc.setFont('helvetica', 'bold')
    doc.text(k.value, x + 6, kpiY + 13)

    // Icon
    setColor(doc, k.color, 'text')
    doc.setFontSize(9)
    doc.text(k.icon, x + kW - 6, kpiY + 13, { align: 'right' })
  })

  // ─── SECTION: ORDER BREAKDOWN ─────────────────────────────────────────
  const bY = kpiY + 30

  // Section header
  setColor(doc, C.gray800, 'text')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Order Details', 14, bY)

  // Thin accent bar under section title
  setColor(doc, C.blue)
  doc.rect(14, bY + 2, 22, 0.6, 'F')

  // Order count badge
  setColor(doc, C.blue)
  rRect(doc, W - 34, bY - 5, 20, 7, 1.5, 'F')
  setColor(doc, C.white, 'text')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text(`${orders.length} orders`, W - 24, bY - 0.5, { align: 'center' })

  // ─── ORDERS TABLE ─────────────────────────────────────────────────────
  const rows = orders.map((o, i) => [
    i + 1,
    o.order_number || o.id?.slice(0, 8) || '-',
    fmtDate(o.created_at),
    o.customer_name || '-',
    o.customer_phone || '-',
    statusLabel[o.status] || o.status,
    fmtMoney(o.total_amount),
  ])

  autoTable(doc, {
    startY: bY + 6,
    head: [['#', 'Order No', 'Date', 'Customer', 'Phone', 'Status', 'Amount']],
    body: rows.length ? rows : [['', 'No orders this period', '', '', '', '', '']],
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      font: 'helvetica',
      textColor: C.gray700,
      lineColor: C.gray100,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: C.navy,
      textColor: C.white,
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
    },
    alternateRowStyles: { fillColor: C.gray50 },
    columnStyles: {
      0: { cellWidth: 7,  halign: 'center', textColor: C.gray400 },
      1: { cellWidth: 26, fontStyle: 'bold', textColor: C.blue },
      2: { cellWidth: 22 },
      3: { cellWidth: 32 },
      4: { cellWidth: 25 },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.column.index === 5 && data.section === 'body') {
        const s = data.cell.raw
        if (['Delivered','Shipped','Confirmed'].includes(s)) {
          data.cell.styles.textColor = C.green
          data.cell.styles.fillColor = [240, 253, 244]
        } else if (['Cancelled','Rejected'].includes(s)) {
          data.cell.styles.textColor = C.red
          data.cell.styles.fillColor = [254, 242, 242]
        } else if (s === 'Processing') {
          data.cell.styles.textColor = C.amber
        } else {
          data.cell.styles.textColor = C.blue
        }
      }
    },
  })

  // ─── TOP PRODUCTS TABLE (if space allows) ────────────────────────────
  const allItems = orders.flatMap(o => o.order_items || [])
  const tableEnd = doc.lastAutoTable?.finalY ?? (bY + 60)

  if (allItems.length > 0 && tableEnd + 55 < H - 15) {
    const productMap = {}
    allItems.forEach((item) => {
      const name = item.products?.product_name || 'Unknown Product'
      if (!productMap[name]) productMap[name] = { qty: 0, revenue: 0 }
      productMap[name].qty += Number(item.quantity || 1)
      productMap[name].revenue += Number(item.unit_price || 0) * Number(item.quantity || 1)
    })

    const topProducts = Object.entries(productMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 8)
      .map(([name, d], i) => [i + 1, name, d.qty, fmtMoney(d.revenue)])

    const tpY = tableEnd + 10
    setColor(doc, C.gray800, 'text')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Top Products', 14, tpY)
    setColor(doc, C.purple)
    doc.rect(14, tpY + 2, 24, 0.6, 'F')

    autoTable(doc, {
      startY: tpY + 6,
      head: [['#', 'Product Name', 'Qty Sold', 'Revenue']],
      body: topProducts,
      styles: { fontSize: 7.5, cellPadding: 3, font: 'helvetica', textColor: C.gray700, lineColor: C.gray100, lineWidth: 0.2 },
      headStyles: { fillColor: C.indigo, textColor: C.white, fontStyle: 'bold', fontSize: 7, cellPadding: { top: 4, bottom: 4, left: 3, right: 3 } },
      alternateRowStyles: { fillColor: [250, 245, 255] },
      columnStyles: {
        0: { cellWidth: 7,  halign: 'center', textColor: C.gray400 },
        1: { cellWidth: 100 },
        2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: C.purple },
      },
    })
  }

  // ─── SUMMARY BOX (after products table or order table) ───────────────
  const summEnd = doc.lastAutoTable?.finalY ?? tableEnd
  if (summEnd + 28 < H - 15) {
    const sY = summEnd + 8
    setColor(doc, C.navy)
    rRect(doc, 14, sY, W - 28, 20, 2, 'F')

    const summItems = [
      { l: 'Total Revenue',  v: fmtMoney(revenue),               c: [134, 239, 172] },
      { l: 'Completed',      v: `${completed.length} orders`,     c: [167, 243, 208] },
      { l: 'Cancelled',      v: `${cancelled.length} orders`,     c: [252, 165, 165] },
      { l: 'Avg Order Value',v: fmtMoney(avgOrder),               c: [196, 181, 253] },
    ]
    const sW = (W - 28) / 4
    summItems.forEach((s, i) => {
      const x = 14 + i * sW
      if (i > 0) {
        doc.setDrawColor(51, 65, 85)
        doc.setLineWidth(0.2)
        doc.line(x, sY + 4, x, sY + 16)
      }
      doc.setFontSize(6)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...s.c)
      doc.text(s.l.toUpperCase(), x + sW / 2, sY + 8, { align: 'center' })

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...s.c)
      doc.text(s.v, x + sW / 2, sY + 15, { align: 'center' })
    })
  }

  // ─── FOOTER ──────────────────────────────────────────────────────────
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)

    // Footer bar
    setColor(doc, C.gray100)
    doc.rect(0, H - 12, W, 12, 'F')
    setColor(doc, C.blue)
    doc.rect(0, H - 12, W, 0.6, 'F')

    setColor(doc, C.gray500, 'text')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('Shiber Bazar — Sales Report', 14, H - 5)
    doc.text(`CONFIDENTIAL  |  ${MONTHS[month]} ${year}`, W / 2, H - 5, { align: 'center' })
    doc.text(`Page ${p} of ${pages}`, W - 14, H - 5, { align: 'right' })
  }

  const filename = `sales-report-${year}-${String(month + 1).padStart(2, '0')}-${shopName.replace(/\s+/g, '-')}.pdf`
  doc.save(filename)
}
