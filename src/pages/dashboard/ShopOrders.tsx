import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { ShoppingCart, Phone, MapPin, MessageSquare, CheckCircle, XCircle, Package, MessageCircle } from 'lucide-react'
// @ts-ignore
import { customerConfirmWhatsAppUrl, customerShippedWhatsAppUrl } from '@/lib/whatsapp'

// @ts-ignore
const useAuthHook = useAuth

type Order = {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_address: string
  status: string
  total_amount: number
  notes: string
  created_at: string
  shops: { shop_name: string }
  order_items: { id: string; quantity: number; unit_price: number; products: { product_name: string } }[]
}

const STATUS_CONFIG: Record<string, { label: string; variant: any; next?: string[] }> = {
  pending:    { label: 'অ্যাডমিন রিভিউতে', variant: 'warning',     next: [] },           // admin only
  confirmed:  { label: 'নতুন অর্ডার',       variant: 'info',        next: ['processing', 'rejected'] }, // shop acts here
  processing: { label: 'প্রস্তুত হচ্ছে',    variant: 'info',        next: ['shipped'] },
  shipped:    { label: 'পাঠানো হয়েছে',      variant: 'purple',      next: ['delivered'] },
  delivered:  { label: 'পৌঁছে গেছে',        variant: 'success',     next: [] },
  cancelled:  { label: 'বাতিল',              variant: 'secondary',   next: [] },
  rejected:   { label: 'প্রত্যাখ্যাত',      variant: 'destructive', next: [] },
}

const STATUS_LABELS: Record<string, string> = {
  confirmed:  'নিশ্চিত করুন',
  processing: 'প্রস্তুত শুরু',
  shipped:    'পাঠানো হয়েছে',
  delivered:  'ডেলিভারি সম্পন্ন',
  rejected:   'প্রত্যাখ্যান করুন',
  cancelled:  'বাতিল করুন',
}

async function fetchMyOrders(userId: string) {
  const { data: shops } = await supabase.from('shops').select('id').eq('owner_id', userId)
  const shopIds = (shops ?? []).map((s: any) => s.id)
  if (!shopIds.length) return []
  const { data, error } = await supabase
    .from('orders')
    .select('*, shops(shop_name)')
    .in('shop_id', shopIds)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Order[]
}

function buildWhatsApp(order: Order) {
  if (!order.customer_phone) return null
  const msg = encodeURIComponent(`আপনার অর্ডার ${order.order_number} কনফার্ম হয়েছে। মোট: ৳${order.total_amount}`)
  return `https://wa.me/88${order.customer_phone.replace(/\D/g,'')}?text=${msg}`
}

export default function ShopOrders() {
  const { user } = useAuthHook()
  const qc = useQueryClient()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: () => fetchMyOrders(user!.id),
    enabled: !!user,
    refetchInterval: 15_000,
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['my-orders'] })
      qc.invalidateQueries({ queryKey: ['owner-stats'] })
      if (selectedOrder) setSelectedOrder(o => o ? { ...o, status: variables.status } : null)
      setUpdatingId(null)
    },
    onError: () => setUpdatingId(null),
  })

  async function changeStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId)
    await updateStatus.mutateAsync({ id: orderId, status: newStatus })
  }

  // Shop owners never see pending orders' details — pending = admin review only
  const isPending = (o: Order) => o.status === 'pending'

  const filtered = statusFilter === 'all' ? allOrders : allOrders.filter(o => o.status === statusFilter)

  const newOrderCount = allOrders.filter(o => o.status === 'confirmed').length

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'order_number',
      header: 'অর্ডার নং',
      cell: ({ row }) => (
        <button
          className="text-blue-600 font-semibold hover:underline text-sm"
          onClick={() => setSelectedOrder(row.original)}
        >
          {row.original.order_number}
        </button>
      ),
    },
    {
      accessorKey: 'customer_name',
      header: 'গ্রাহক',
      cell: ({ row }) => isPending(row.original)
        ? <span className="text-xs text-amber-600 font-medium flex items-center gap-1">🔒 অ্যাডমিন রিভিউতে</span>
        : <span className="text-sm">{row.original.customer_name}</span>,
    },
    {
      accessorKey: 'shops',
      header: 'দোকান',
      cell: ({ row }) => <span className="text-xs text-gray-500">{row.original.shops?.shop_name}</span>,
    },
    {
      accessorKey: 'total_amount',
      header: 'পরিমাণ',
      cell: ({ row }) => isPending(row.original)
        ? <span className="text-xs text-gray-400">—</span>
        : <span className="font-semibold text-sm">৳{(row.original.total_amount ?? 0).toLocaleString()}</span>,
    },
    {
      accessorKey: 'status',
      header: 'স্ট্যাটাস',
      cell: ({ getValue }) => {
        const s = STATUS_CONFIG[getValue() as string] ?? { label: getValue() as string, variant: 'secondary' }
        return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
      },
    },
    {
      accessorKey: 'created_at',
      header: 'তারিখ',
      cell: ({ getValue }) => <span className="text-xs text-gray-400">{new Date(getValue() as string).toLocaleDateString('bn-BD')}</span>,
    },
    {
      id: 'actions',
      header: 'কার্যক্রম',
      cell: ({ row }) => {
        const o = row.original
        if (isPending(o)) return null   // pending = admin handles it
        const config = STATUS_CONFIG[o.status]
        const nexts = config?.next ?? []
        if (!nexts.length) return null
        return (
          <div className="flex gap-1">
            {nexts.slice(0, 2).map(ns => {
              const isReject = ns === 'rejected' || ns === 'cancelled'
              return (
                <Button
                  key={ns}
                  size="xs"
                  variant={isReject ? 'destructive' : 'success'}
                  disabled={updatingId === o.id}
                  onClick={() => changeStatus(o.id, ns)}
                >
                  {isReject ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                  {STATUS_LABELS[ns] || ns}
                </Button>
              )
            })}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📦 অর্ডার ব্যবস্থাপনা</h1>
          {newOrderCount > 0 && (
            <p className="text-sm text-amber-600 mt-0.5">{newOrderCount}টি নতুন অর্ডার প্রস্তুত করার অপেক্ষায়!</p>
          )}
        </div>
        {/* Filter tabs — horizontally scrollable on mobile */}
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex gap-1.5 min-w-max pb-1">
            {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'rejected'].map(s => {
              const cfg = STATUS_CONFIG[s]
              const count = s === 'all' ? allOrders.length : allOrders.filter(o => o.status === s).length
              if (count === 0 && s !== 'all') return null   // hide empty tabs
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {s === 'all' ? 'সব' : cfg?.label || s} ({count})
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">কোনো অর্ডার নেই</p>
        </div>
      ) : (
        <>
          {/* Mobile card list — shown on small screens */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map(o => {
              const cfg = STATUS_CONFIG[o.status]
              const pending = isPending(o)
              const nexts = cfg?.next ?? []
              return (
                <div key={o.id} className="bg-white rounded-xl border shadow-sm p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      className="text-blue-600 font-bold text-sm hover:underline text-left"
                      onClick={() => setSelectedOrder(o)}
                    >
                      {o.order_number}
                    </button>
                    <Badge variant={cfg?.variant} className="text-xs shrink-0">{cfg?.label || o.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {pending
                        ? <span className="text-amber-600 text-xs flex items-center gap-1">🔒 অ্যাডমিন রিভিউতে</span>
                        : o.customer_name}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {pending ? '—' : `৳${(o.total_amount ?? 0).toLocaleString()}`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('bn-BD')}</p>
                  {!pending && nexts.length > 0 && (
                    <div className="flex gap-2 pt-1 flex-wrap">
                      {nexts.slice(0, 2).map(ns => {
                        const isReject = ns === 'rejected' || ns === 'cancelled'
                        return (
                          <Button
                            key={ns}
                            size="sm"
                            variant={isReject ? 'destructive' : 'success'}
                            disabled={updatingId === o.id}
                            onClick={() => changeStatus(o.id, ns)}
                            className="text-xs"
                          >
                            {isReject ? <XCircle className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                            {STATUS_LABELS[ns] || ns}
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Desktop table — hidden on mobile */}
          <div className="hidden md:block overflow-x-auto rounded-xl">
            <DataTable
              columns={columns}
              data={filtered}
              searchPlaceholder="অর্ডার নম্বর বা গ্রাহকের নাম খুঁজুন..."
              isLoading={isLoading}
              pageSize={15}
            />
          </div>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>অর্ডার বিবরণ — {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (() => {
            const config = STATUS_CONFIG[selectedOrder.status]
            const nexts = config?.next ?? []

            /* ── PENDING: hide everything, show lock screen ── */
            if (isPending(selectedOrder)) {
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={config?.variant} className="text-sm">{config?.label}</Badge>
                    <span className="text-xs text-gray-400">{new Date(selectedOrder.created_at).toLocaleString('bn-BD')}</span>
                  </div>
                  <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-8 text-center">
                    <div className="text-5xl mb-3">🔒</div>
                    <p className="font-bold text-amber-800 text-base mb-1">অ্যাডমিন রিভিউতে আছে</p>
                    <p className="text-sm text-amber-700">
                      এই অর্ডারটি এখন অ্যাডমিনের কাছে আছে।<br />
                      অ্যাডমিন অনুমোদন করলে সম্পূর্ণ বিবরণ দেখতে পাবেন।
                    </p>
                  </div>
                </div>
              )
            }

            /* ── NON-PENDING: show full details ── */
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={config?.variant} className="text-sm">{config?.label || selectedOrder.status}</Badge>
                  <span className="text-xs text-gray-400">{new Date(selectedOrder.created_at).toLocaleString('bn-BD')}</span>
                </div>

                {/* Customer info */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-800">{selectedOrder.customer_name}</p>
                  {selectedOrder.customer_phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{selectedOrder.customer_phone}</p>
                  )}
                  {selectedOrder.customer_address && (
                    <p className="text-sm text-gray-600 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{selectedOrder.customer_address}</p>
                  )}
                  {selectedOrder.notes && (
                    <p className="text-sm text-gray-500 flex items-start gap-1.5 italic"><MessageSquare className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />{selectedOrder.notes}</p>
                  )}
                </div>

                {/* Order items */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">পণ্য সমূহ</p>
                  <div className="border rounded-xl overflow-hidden">
                    {(() => {
                      const orderAny = selectedOrder as any
                      const items: { name: string; qty: number; price: number | null }[] =
                        (orderAny.order_items ?? []).length > 0
                          ? (orderAny.order_items as any[]).map((item: any) => ({
                              name: item.products?.name || item.products?.product_name || 'পণ্য',
                              qty: item.quantity,
                              price: item.unit_price ?? null,
                            }))
                          : orderAny.product_name
                          ? [{ name: orderAny.product_name, qty: orderAny.quantity ?? 1, price: null }]
                          : []
                      return items.length > 0 ? items.map((item, i) => (
                        <div key={i} className={`flex items-center justify-between px-4 py-2.5 text-sm ${i > 0 ? 'border-t' : ''}`}>
                          <span className="text-gray-700">{item.name} × {item.qty}</span>
                          {item.price != null && <span className="font-medium">৳{(item.price * item.qty).toLocaleString()}</span>}
                        </div>
                      )) : (
                        <div className="px-4 py-3 text-sm text-gray-400">পণ্যের তথ্য নেই</div>
                      )
                    })()}
                    <div className="flex justify-between px-4 py-3 bg-blue-50 border-t font-bold text-sm">
                      <span>মোট</span>
                      <span className="text-blue-700">৳{(selectedOrder.total_amount ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                {selectedOrder.customer_phone && (() => {
                  const confirmUrl = customerConfirmWhatsAppUrl(selectedOrder)
                  const shippedUrl = customerShippedWhatsAppUrl(selectedOrder)
                  const showConfirm = ['confirmed', 'processing'].includes(selectedOrder.status) && confirmUrl
                  const showShipped = selectedOrder.status === 'shipped' && shippedUrl
                  if (!showConfirm && !showShipped) return null
                  return (
                    <div className="border border-green-200 rounded-xl p-3 bg-green-50/50">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <MessageCircle className="h-3 w-3 text-green-600" /> গ্রাহককে WhatsApp পাঠান
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {showConfirm && (
                          <a href={confirmUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">✅ কনফার্ম জানান</Button>
                          </a>
                        )}
                        {showShipped && (
                          <a href={shippedUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">🚚 পাঠানো হয়েছে জানান</Button>
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Status actions */}
                {nexts.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {nexts.map(ns => {
                      const isReject = ns === 'rejected' || ns === 'cancelled'
                      return (
                        <Button
                          key={ns}
                          size="sm"
                          variant={isReject ? 'destructive' : 'default'}
                          disabled={updatingId === selectedOrder.id}
                          onClick={async () => {
                            await changeStatus(selectedOrder.id, ns)
                            setSelectedOrder(o => o ? {...o, status: ns} : null)
                          }}
                        >
                          {STATUS_LABELS[ns] || ns}
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
