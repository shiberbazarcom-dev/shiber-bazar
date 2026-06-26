import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  pending:    { label: 'অপেক্ষায়',   variant: 'secondary' },
  confirmed:  { label: 'নিশ্চিত',    variant: 'default' },
  processing: { label: 'প্রস্তুতি',  variant: 'outline' },
  shipped:    { label: 'পাঠানো হয়েছে', variant: 'outline' },
  delivered:  { label: 'ডেলিভারি',   variant: 'default' },
  rejected:   { label: 'বাতিল',      variant: 'destructive' },
}

const NEXT_STATUS_STAFF = {
  confirmed:  [{ value: 'processing', label: '▶ প্রস্তুত করুন' }],
  processing: [{ value: 'shipped',    label: '🚚 পাঠান' }],
  shipped:    [{ value: 'delivered',  label: '✅ ডেলিভারি' }],
}

// Manager can also reject orders
const NEXT_STATUS_MANAGER = {
  ...NEXT_STATUS_STAFF,
  confirmed:  [{ value: 'processing', label: '▶ প্রস্তুত করুন' }, { value: 'rejected', label: '❌ বাতিল' }],
  processing: [{ value: 'shipped',    label: '🚚 পাঠান' }, { value: 'rejected', label: '❌ বাতিল' }],
}

export default function StaffOrders() {
  const { staffSession } = useStaffAuth()
  const isManager = staffSession?.role === 'manager'
  const NEXT_STATUS = isManager ? NEXT_STATUS_MANAGER : NEXT_STATUS_STAFF
  const qc = useQueryClient()
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['staff-orders', staffSession?.shop_id, filterStatus],
    queryFn: async () => {
      if (!staffSession?.shop_id) return []
      let q = supabase
        .from('orders')
        .select('*')
        .eq('shop_id', staffSession.shop_id)
        .order('created_at', { ascending: false })
      if (filterStatus) q = q.eq('status', filterStatus)
      const { data, error } = await q
      if (error) throw error
      return data || []
    },
    enabled: !!staffSession?.shop_id,
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from('orders').update({
        status,
        staff_updated_by: staffSession?.name,
        staff_updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-orders'] })
      toast.success('স্ট্যাটাস আপডেট হয়েছে')
      setSelectedOrder(null)
    },
    onError: () => toast.error('আপডেট হয়নি'),
  })

  if (isLoading) return <div className="text-center py-16 text-gray-400">লোড হচ্ছে...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-lg font-bold text-gray-800">অর্ডার তালিকা</h1>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">সব অর্ডার</option>
          {Object.entries(STATUS_CONFIG).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">কোনো অর্ডার নেই</div>
      )}

      <div className="space-y-3">
        {orders.map(order => {
          const cfg   = STATUS_CONFIG[order.status]
          const nexts = NEXT_STATUS[order.status] || []
          return (
            <div
              key={order.id}
              className="bg-white rounded-xl border shadow-sm p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-blue-600 font-bold text-sm">{order.order_number}</span>
                  <p className="text-gray-800 font-medium text-sm mt-0.5">{order.customer_name}</p>
                  {order.customer_phone && <p className="text-xs text-gray-500">📞 {order.customer_phone}</p>}
                  {order.customer_address && <p className="text-xs text-gray-500 line-clamp-1">📍 {order.customer_address}</p>}
                  {order.product_name && <p className="text-xs text-gray-500 line-clamp-1">🛍️ {order.product_name}</p>}
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <Badge variant={cfg?.variant} className="text-xs">{cfg?.label || order.status}</Badge>
                  <p className="text-blue-700 font-bold text-sm">৳{(order.total_amount || 0).toLocaleString()}</p>
                </div>
              </div>

              {nexts.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap" onClick={e => e.stopPropagation()}>
                  {nexts.map(n => (
                    <Button
                      key={n.value}
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: order.id, status: n.value })}
                    >
                      {n.label}
                    </Button>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2">{new Date(order.created_at).toLocaleDateString('bn-BD')}</p>
            </div>
          )
        })}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800">{selectedOrder.order_number}</h2>
              <Badge variant={STATUS_CONFIG[selectedOrder.status]?.variant}>
                {STATUS_CONFIG[selectedOrder.status]?.label}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <Row label="নাম"      value={selectedOrder.customer_name} />
              <Row label="ফোন"      value={selectedOrder.customer_phone} />
              <Row label="ঠিকানা"   value={selectedOrder.customer_address} />
              <Row label="পণ্য"     value={selectedOrder.product_name} />
              <Row label="পরিমাণ"   value={selectedOrder.quantity} />
              <Row label="মোট"      value={`৳${(selectedOrder.total_amount || 0).toLocaleString()}`} />
              {selectedOrder.notes && <Row label="নোট" value={selectedOrder.notes} />}
            </div>
            {(NEXT_STATUS[selectedOrder.status] || []).length > 0 && (
              <div className="flex gap-2 pt-2 flex-wrap">
                {(NEXT_STATUS[selectedOrder.status] || []).map(n => (
                  <Button
                    key={n.value}
                    className="flex-1"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: selectedOrder.id, status: n.value })}
                  >
                    {n.label}
                  </Button>
                ))}
              </div>
            )}
            <button onClick={() => setSelectedOrder(null)} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1">
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-20 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}
