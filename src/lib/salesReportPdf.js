import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const BENGALI_MONTHS = [
  'জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন',
  'জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর',
]

function fmtTaka(n) {
  return 'BDT ' + Number(n || 0).toLocaleString('en-BD', { minimumFractionDigits: 0 })
}

function fmtDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`
}

/**
 * Generate and download a monthly sales report PDF.
 *
 * @param {object} opts
 * @param {Array}  opts.orders       – all orders for the shop (with order_items)
 * @param {string} opts.shopName
 * @param {number} opts.month        – 0-indexed (0=Jan)
 * @param {number} opts.year
 */
export function downloadSalesReportPdf({ orders, shopName, month, year }) {
  // Filter orders for the selected month/year
  const filtered = orders.filter(o => {
    const d = new Date(o.created_at)
    return d.getMonth() === month && d.getFullYear() === year
  })

  const completed  = filtered.filter(o => ['delivered', 'shipped', 'processing', 'confirmed'].includes(o.status))
  const cancelled  = filtered.filter(o => ['cancelled', 'rejected'].includes(o.status))

  const totalRevenue  = completed.reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const totalOrders   = filtered.length
  const completedCnt  = completed.length
  const cancelledCnt  = cancelled.length

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  /* ── Header bar ── */
  doc.setFillColor(37, 99, 235) // blue-600
  doc.rect(0, 0, W, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('SALES REPORT', 14, 12)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`${BENGALI_MONTHS[month]} ${year}  |  ${shopName}`, 14, 20)

  const now = new Date()
  doc.text(`Generated: ${fmtDate(now.toISOString())}`, W - 14, 20, { align: 'right' })

  /* ── Summary cards ── */
  const cards = [
    { label: 'Total Orders',    value: String(totalOrders),       color: [37, 99, 235] },
    { label: 'Completed',       value: String(completedCnt),      color: [22, 163, 74] },
    { label: 'Cancelled',       value: String(cancelledCnt),      color: [220, 38, 38] },
    { label: 'Total Revenue',   value: fmtTaka(totalRevenue),     color: [124, 58, 237] },
  ]

  const cardW = (W - 28 - 9) / 4
  const cardY = 34
  cards.forEach((c, i) => {
    const x = 14 + i * (cardW + 3)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, cardY, cardW, 18, 2, 2, 'F')
    doc.setDrawColor(...c.color)
    doc.setLineWidth(0.4)
    doc.roundedRect(x, cardY, cardW, 18, 2, 2, 'S')

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...c.color)
    doc.text(c.value, x + cardW / 2, cardY + 9, { align: 'center' })

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(c.label, x + cardW / 2, cardY + 15, { align: 'center' })
  })

  /* ── Orders table ── */
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Order Details', 14, 62)

  const statusLabel = {
    pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
    shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', rejected: 'Rejected',
  }

  const rows = filtered.map((o, i) => [
    i + 1,
    o.order_number || o.id?.slice(0, 8),
    fmtDate(o.created_at),
    o.customer_name || '-',
    o.customer_phone || '-',
    statusLabel[o.status] || o.status,
    fmtTaka(o.total_amount),
  ])

  autoTable(doc, {
    startY: 66,
    head: [['#', 'Order No', 'Date', 'Customer', 'Phone', 'Status', 'Amount']],
    body: rows.length ? rows : [['', 'No orders this month', '', '', '', '', '']],
    styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 24 },
      2: { cellWidth: 22 },
      3: { cellWidth: 34 },
      4: { cellWidth: 26 },
      5: { cellWidth: 22 },
      6: { cellWidth: 30, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.column.index === 5 && data.section === 'body') {
        const status = data.cell.raw
        if (['Delivered', 'Shipped'].includes(status)) data.cell.styles.textColor = [22, 163, 74]
        else if (['Cancelled', 'Rejected'].includes(status)) data.cell.styles.textColor = [220, 38, 38]
        else data.cell.styles.textColor = [37, 99, 235]
      }
    },
  })

  /* ── Top products (if order_items available) ── */
  const allItems = filtered.flatMap(o => o.order_items || [])
  if (allItems.length > 0) {
    const productMap = {}
    allItems.forEach(item => {
      const name = item.products?.product_name || 'Unknown'
      if (!productMap[name]) productMap[name] = { qty: 0, revenue: 0 }
      productMap[name].qty += Number(item.quantity || 0)
      productMap[name].revenue += Number(item.unit_price || 0) * Number(item.quantity || 0)
    })

    const topProducts = Object.entries(productMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([name, d], i) => [i + 1, name, d.qty, fmtTaka(d.revenue)])

    const tableEndY = doc.lastAutoTable?.finalY || 66
    if (tableEndY + 50 < pageH) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text('Top Products', 14, tableEndY + 12)

      autoTable(doc, {
        startY: tableEndY + 16,
        head: [['#', 'Product Name', 'Qty Sold', 'Revenue']],
        body: topProducts,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [250, 245, 255] },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 90 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
        },
      })
    }
  }

  /* ── Footer ── */
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text(`Shiber Bazar  |  Page ${p} of ${pages}`, W / 2, pageH - 6, { align: 'center' })
  }

  const filename = `sales-report-${year}-${String(month + 1).padStart(2, '0')}-${shopName.replace(/\s+/g, '-')}.pdf`
  doc.save(filename)
}
