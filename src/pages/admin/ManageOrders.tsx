import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { supabase } from '@/lib/supabase'
import { Order } from '@/types'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShoppingCart, MoreHorizontal, MessageCircle, Eye, Store, Send } from 'lucide-react'
import toast from 'react-hot-toast'
// @ts-ignore
import { shopOwnerWhatsAppUrl, customerConfirmWhatsAppUrl } from '@/lib/whatsapp'

type OrderStatus = 'all' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

const STATUS_CONFIG: Record<string, { label: string; variant: any; next?: string[] }> = {
  pending:    { label: 'Pending',    variant: 'warning',     next: ['confirmed', 'rejected'] },
  confirmed:  { label: 'Confirmed',  variant: 'info',        next: ['processing', 'cancelled'] },
  processing: { label: 'Processing', variant: 'info',        next: ['shipped', 'cancelled'] },
  shipped:    { label: 'Shipped',    variant: 'purple',      next: ['delivered'] },
  delivered:  { label: 'Delivered',  variant: 'success',     next: [] },
  cancelled:  { label: 'Cancelled',  variant: 'destructive', next: [] },
  rejected:   { label: 'Rejected',   variant: 'destructive', next: [] },
}

function useOrders(status: OrderStatus) {
  return useQuery({
    queryKey: ['admin-orders', status],
    queryFn: async () => {
      let q = supabase
        .from('orders')
        .select('*, shops(id, shop_name, phone, whatsapp)')
        .order('created_at', { ascending: false })
      if (status !== 'all') q = q.eq('status', status)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Order[]
    },
  })
}

function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['my-orders'] })
      qc.invalidateQueries({ queryKey: ['shop-order-stats'] })
    },
  })
}

function useShopsForAssignment() {
  return useQuery({
    queryKey: ['shops-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('id, shop_name, categories(name, icon)')
        .eq('status', 'approved')
        .order('shop_name')
      if (error) throw error
      return (data ?? []) as { id: string; shop_name: string; categories: any }[]
    },
  })
}

function useAssignOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, shop_id }: { id: string; shop_id: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ shop_id, status: 'confirmed' })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['my-orders'] })
      qc.invalidateQueries({ queryKey: ['shop-order-stats'] })
    },
  })
}

function buildWhatsApp(order: Order): string {
  const shop = (order.shops as any)
  const phone = shop?.whatsapp || shop?.phone || ''
  const productLine = (order as any).product_name
    ? `• ${(order as any).product_name} × ${(order as any).quantity ?? 1}`
    : Array.isArray((order as any).items)
      ? (order as any).items.map((i: any) => `• ${i.name} × ${i.qty}`).join('\n')
      : ''
  const msg = `হ্যালো ${order.customer_name}!\nআপনার অর্ডার (${order.order_number}) কনফার্ম হয়েছে ✅\n\n${productLine}\n\nমোট: ৳${order.total_amount}`
  const cleaned = phone.replace(/\D/g, '')
  const num = cleaned.startsWith('0') ? '88' + cleaned : cleaned
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
}

export default function ManageOrders() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [assignShopId, setAssignShopId] = useState<string>('')

  const { data: orders = [], isLoading } = useOrders(statusFilter)
  const updateStatus = useUpdateOrderStatus()
  const assignOrder = useAssignOrder()
  const { data: shopsList = [] } = useShopsForAssignment()

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status })
      toast.success(`Order → ${status}`)
    } catch { toast.error('Failed') }
  }

  const handleAssign = async () => {
    if (!selectedOrder || !assignShopId) return
    try {
      await assignOrder.mutateAsync({ id: selectedOrder.id, shop_id: assignShopId })
      toast.success('দোকানে অ্যাসাইন হয়েছে ✅')
      setSelectedOrder(null)
      setAssignShopId('')
    } catch { toast.error('অ্যাসাইন ব্যর্থ হয়েছে') }
  }

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'order_number',
      header: 'Order #',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium text-blue-600">{row.original.order_number}</span>
      ),
    },
    {
      accessorKey: 'customer_name',
      header: 'Customer',
      cell: ({ row }) => {
        const o = row.original
        return (
          <div>
            <p className="font-medium text-gray-900 text-sm">{o.customer_name}</p>
            <p className="text-xs text-gray-400">{o.customer_phone}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'shops',
      header: 'Shop',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{(row.original.shops as any)?.shop_name || <span className="text-amber-500 text-xs">অ্যাসাইন নেই</span>}</span>
      ),
    },
    {
      accessorKey: 'total_amount',
      header: 'Total',
      cell: ({ row }) => (
        <span className="font-semibold text-gray-900">৳{(row.original.total_amount ?? 0).toLocaleString()}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = STATUS_CONFIG[row.original.status] ?? { label: row.original.status, variant: 'secondary' }
        return <Badge variant={s.variant}>{s.label}</Badge>
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-gray-400">{new Date(row.original.created_at).toLocaleDateString('bn-BD')}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const o = row.original
        const cfg = STATUS_CONFIG[o.status]
        const shop = (o.shops as any)
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setSelectedOrder(o); setAssignShopId((o as any).shop_id || '') }}>
                <Eye className="h-4 w-4" /> View Details
              </DropdownMenuItem>
              {/* Send to shop owner */}
              {(shop?.whatsapp || shop?.phone) && (
                <DropdownMenuItem onClick={() => window.open(shopOwnerWhatsAppUrl(o), '_blank')}>
                  <Send className="h-4 w-4 text-blue-600" /> Shop'কে পাঠান
                </DropdownMenuItem>
              )}
              {/* Send confirmation to customer */}
              {(o as any).customer_phone && (
                <DropdownMenuItem onClick={() => window.open(customerConfirmWhatsAppUrl(o), '_blank')}>
                  <MessageCircle className="h-4 w-4 text-green-600" /> Customer'কে পাঠান
                </DropdownMenuItem>
              )}
              {cfg?.next && cfg.next.length > 0 && <DropdownMenuSeparator />}
              {cfg?.next?.map(status => (
                <DropdownMenuItem key={status} onClick={() => handleStatus(o.id, status)}>
                  → {STATUS_CONFIG[status]?.label ?? status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const tabs = [
    { value: 'all',        label: 'All' },
    { value: 'pending',    label: 'Pending' },
    { value: 'confirmed',  label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped',    label: 'Shipped' },
    { value: 'delivered',  label: 'Delivered' },
    { value: 'cancelled',  label: 'Cancelled' },
  ]

  // Resolve items to display — fallback to flat product_name/quantity fields
  const getItemsToShow = (order: any) => {
    if (Array.isArray(order.items) && order.items.length > 0) return order.items
    if (order.product_name) return [{ name: order.product_name, qty: order.quantity ?? 1, price: null }]
    return []
  }

  const bnTabs = [
    { value: 'all',        label: 'সব' },
    { value: 'pending',    label: 'পেন্ডিং' },
    { value: 'confirmed',  label: 'কনফার্ম' },
    { value: 'processing', label: 'প্রসেস' },
    { value: 'shipped',    label: 'পাঠানো' },
    { value: 'delivered',  label: 'ডেলিভারি' },
    { value: 'cancelled',  label: 'বাতিল' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2"><ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" /> অর্ডার ব্যবস্থাপনা</h1>
        <p className="text-sm text-gray-500 mt-0.5">সব অর্ডার ট্র্যাক ও আপডেট করুন</p>
      </div>

      {/* Status filter tabs — scrollable on mobile */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1.5 min-w-max pb-1">
          {bnTabs.map(t => (
            <button key={t.value} onClick={() => setStatusFilter(t.value as OrderStatus)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === t.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">কোনো অর্ডার নেই</div>
        ) : orders.map((o: Order) => {
          const cfg = STATUS_CONFIG[o.status]
          return (
            <div key={o.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <button className="text-blue-600 font-bold text-sm hover:underline text-left"
                  onClick={() => { setSelectedOrder(o); setAssignShopId((o as any).shop_id || '') }}>
                  {o.order_number}
                </button>
                <Badge variant={cfg?.variant ?? 'secondary'} className="text-xs shrink-0">{cfg?.label ?? o.status}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate max-w-[60%]">{o.customer_name}</span>
                <span className="font-bold text-gray-800">৳{(o.total_amount ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{(o.shops as any)?.shop_name || <span className="text-amber-500">অ্যাসাইন নেই</span>}</span>
                <span>{new Date(o.created_at).toLocaleDateString('bn-BD')}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={orders}
          isLoading={isLoading}
          searchPlaceholder="নাম বা অর্ডার নম্বর খুঁজুন..."
        />
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => { setSelectedOrder(null); setAssignShopId('') }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📦 Order {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              {/* Status badge */}
              <div>
                <Badge variant={STATUS_CONFIG[selectedOrder.status]?.variant ?? 'secondary'}>
                  {STATUS_CONFIG[selectedOrder.status]?.label ?? selectedOrder.status}
                </Badge>
              </div>

              {/* Customer */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-1.5">
                <p className="font-semibold text-gray-700">Customer Info</p>
                <p className="text-gray-600">{selectedOrder.customer_name} · {selectedOrder.customer_phone}</p>
                {selectedOrder.customer_address && <p className="text-gray-500 text-xs">{selectedOrder.customer_address}</p>}
              </div>

              {/* Items */}
              <div>
                <p className="font-semibold text-gray-700 mb-2">Items</p>
                <div className="border rounded-lg overflow-hidden">
                  {getItemsToShow(selectedOrder).map((item: any, i: number) => (
                    <div key={i} className={`flex justify-between px-3 py-2 text-gray-600 text-sm ${i > 0 ? 'border-t' : ''}`}>
                      <span>{item.name} × {item.qty}</span>
                      {item.price != null && <span>৳{(item.price * item.qty).toLocaleString()}</span>}
                    </div>
                  ))}
                  {getItemsToShow(selectedOrder).length === 0 && (
                    <div className="px-3 py-2 text-gray-400 text-xs">পণ্যের তথ্য নেই</div>
                  )}
                  <div className="flex justify-between px-3 py-2.5 bg-blue-50 border-t font-bold text-sm">
                    <span>Total</span>
                    <span>৳{(selectedOrder.total_amount ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(selectedOrder as any).notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-amber-800 text-xs">
                  📝 {(selectedOrder as any).notes}
                </div>
              )}

              {/* WhatsApp actions */}
              {(() => {
                const shop = (selectedOrder.shops as any)
                const shopUrl = shopOwnerWhatsAppUrl(selectedOrder)
                const custUrl = customerConfirmWhatsAppUrl(selectedOrder)
                if (!shopUrl && !custUrl) return null
                return (
                  <div className="border border-green-200 rounded-lg p-3 space-y-2 bg-green-50/40">
                    <p className="font-semibold text-gray-700 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                      <MessageCircle className="h-3.5 w-3.5 text-green-600" /> WhatsApp
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {shopUrl && (
                        <a href={shopUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                            <Send className="h-3.5 w-3.5" />
                            📤 Shop'কে পাঠান
                          </Button>
                        </a>
                      )}
                      {custUrl && (
                        <a href={custUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5">
                            <MessageCircle className="h-3.5 w-3.5" />
                            ✅ Customer কনফার্ম
                          </Button>
                        </a>
                      )}
                    </div>
                    {!shop?.whatsapp && !shop?.phone && (
                      <p className="text-xs text-amber-600">⚠️ Shop-এর ফোন নম্বর নেই — প্রোফাইলে যোগ করুন</p>
                    )}
                  </div>
                )
              })()}

              {/* Assign to shop */}
              <div className="border border-dashed border-blue-200 rounded-lg p-3 space-y-2 bg-blue-50/50">
                <p className="font-semibold text-gray-700 flex items-center gap-1.5">
                  <Store className="h-4 w-4 text-blue-500" /> দোকানে অ্যাসাইন করুন
                </p>
                <div className="flex gap-2">
                  <select
                    className="flex-1 border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={assignShopId}
                    onChange={e => setAssignShopId(e.target.value)}
                  >
                    <option value="">-- দোকান বেছে নিন --</option>
                    {shopsList.map(s => (
                      <option key={s.id} value={s.id}>
                        {(s.categories as any)?.icon || '🏪'} {s.shop_name}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    disabled={!assignShopId || assignOrder.isPending}
                    onClick={handleAssign}
                  >
                    {assignOrder.isPending ? '...' : 'অ্যাসাইন'}
                  </Button>
                </div>
                {(selectedOrder as any).shop_id && (
                  <p className="text-xs text-gray-500">
                    বর্তমান দোকান: <span className="font-medium text-gray-700">{(selectedOrder.shops as any)?.shop_name || 'অজানা'}</span>
                  </p>
                )}
              </div>

              {/* Status change */}
              {(STATUS_CONFIG[selectedOrder.status]?.next?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                  <span className="text-gray-400 text-xs self-center">Change status:</span>
                  {STATUS_CONFIG[selectedOrder.status]?.next?.map(s => (
                    <Button key={s} size="sm" variant="outline"
                      onClick={() => { handleStatus(selectedOrder.id, s); setSelectedOrder(null) }}>
                      → {STATUS_CONFIG[s]?.label ?? s}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
