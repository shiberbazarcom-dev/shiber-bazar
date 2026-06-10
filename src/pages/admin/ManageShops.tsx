import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { supabase } from '@/lib/supabase'
import { Shop } from '@/types'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Store, MoreHorizontal, CheckCircle, XCircle, Eye, Trash2, Star } from 'lucide-react'
import toast from 'react-hot-toast'

type ShopStatus = 'all' | 'pending_approval' | 'approved' | 'rejected' | 'suspended'

const STATUS_CONFIG: Record<string, { label: string; variant: any }> = {
  pending_approval: { label: 'Pending',   variant: 'warning' },
  approved:         { label: 'Approved',  variant: 'success' },
  rejected:         { label: 'Rejected',  variant: 'destructive' },
  suspended:        { label: 'Suspended', variant: 'secondary' },
}

function useShops(status: ShopStatus) {
  return useQuery({
    queryKey: ['admin-shops', status],
    queryFn: async () => {
      let q = supabase
        .from('shops')
        .select('*, profiles(full_name, phone), categories(name)')
        .order('created_at', { ascending: false })
      if (status !== 'all') q = q.eq('status', status)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Shop[]
    },
  })
}

function useUpdateShopStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('shops').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] })
      qc.invalidateQueries({ queryKey: ['pending-shops-count'] })
      qc.invalidateQueries({ queryKey: ['market-stats'] })
    },
  })
}

function useDeleteShop() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shops').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-shops'] }),
  })
}

function useToggleFeatured() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase.from('shops').update({ is_featured }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-shops'] }),
  })
}

export default function ManageShops() {
  const [statusFilter, setStatusFilter] = useState<ShopStatus>('all')
  const [detailShop, setDetailShop] = useState<Shop | null>(null)

  const { data: shops = [], isLoading } = useShops(statusFilter)
  const updateStatus  = useUpdateShopStatus()
  const deleteShop    = useDeleteShop()
  const toggleFeatured = useToggleFeatured()

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status })
      toast.success(`Shop ${status}`)
    } catch { toast.error('Failed') }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this shop permanently?')) return
    try {
      await deleteShop.mutateAsync(id)
      toast.success('Shop deleted')
    } catch { toast.error('Failed') }
  }

  const columns: ColumnDef<Shop>[] = [
    {
      accessorKey: 'shop_name',
      header: 'Shop',
      cell: ({ row }) => {
        const shop = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              {shop.logo_url
                ? <img src={shop.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
                : <Store className="h-4 w-4 text-blue-600" />
              }
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate max-w-[160px]">{shop.shop_name}</p>
              <p className="text-xs text-gray-400">{(shop.profiles as any)?.full_name}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'categories',
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{(row.original.categories as any)?.name || '—'}</span>
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
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
          <span className="text-sm text-gray-700">{row.original.rating?.toFixed(1) ?? '—'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'is_featured',
      header: 'Featured',
      cell: ({ row }) => (
        <button
          onClick={() => toggleFeatured.mutate({ id: row.original.id, is_featured: !row.original.is_featured })}
          className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
            row.original.is_featured ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500 hover:bg-amber-50'
          }`}
        >
          {row.original.is_featured ? '⭐ Featured' : 'Normal'}
        </button>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-xs text-gray-400">{new Date(row.original.created_at).toLocaleDateString('bn-BD')}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const shop = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDetailShop(shop)}>
                <Eye className="h-4 w-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {shop.status !== 'approved' && (
                <DropdownMenuItem className="text-green-600" onClick={() => handleStatus(shop.id, 'approved')}>
                  <CheckCircle className="h-4 w-4" /> Approve
                </DropdownMenuItem>
              )}
              {shop.status !== 'rejected' && (
                <DropdownMenuItem className="text-orange-600" onClick={() => handleStatus(shop.id, 'rejected')}>
                  <XCircle className="h-4 w-4" /> Reject
                </DropdownMenuItem>
              )}
              {shop.status !== 'suspended' && (
                <DropdownMenuItem className="text-gray-600" onClick={() => handleStatus(shop.id, 'suspended')}>
                  Suspend
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(shop.id)}>
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const bnTabs = [
    { value: 'all',              label: 'সব' },
    { value: 'pending_approval', label: 'পেন্ডিং' },
    { value: 'approved',         label: 'অনুমোদিত' },
    { value: 'rejected',         label: 'প্রত্যাখ্যাত' },
    { value: 'suspended',        label: 'স্থগিত' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2"><Store className="h-5 w-5 sm:h-6 sm:w-6" /> দোকান ব্যবস্থাপনা</h1>
        <p className="text-sm text-gray-500 mt-0.5">দোকান অনুমোদন, প্রত্যাখ্যান ও পরিচালনা</p>
      </div>

      {/* Status tabs — scrollable on mobile */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1.5 min-w-max pb-1">
          {bnTabs.map(t => (
            <button key={t.value} onClick={() => setStatusFilter(t.value as ShopStatus)}
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
        ) : shops.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">কোনো দোকান নেই</div>
        ) : shops.map((shop: Shop) => {
          const sc = STATUS_CONFIG[shop.status] ?? { label: shop.status, variant: 'secondary' }
          return (
            <div key={shop.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                  {shop.logo_url
                    ? <img src={shop.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    : <Store className="h-4 w-4 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{shop.shop_name}</p>
                  <p className="text-xs text-gray-400">{(shop.profiles as any)?.full_name}</p>
                </div>
                <Badge variant={sc.variant} className="text-xs shrink-0">{sc.label}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{(shop.categories as any)?.name || '—'}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => setDetailShop(shop)}
                    className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium">
                    দেখুন
                  </button>
                  {shop.status !== 'approved' && (
                    <button onClick={() => handleStatus(shop.id, 'approved')}
                      className="px-2 py-1 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 font-medium">
                      অনুমোদন
                    </button>
                  )}
                  {shop.status !== 'rejected' && (
                    <button onClick={() => handleStatus(shop.id, 'rejected')}
                      className="px-2 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 font-medium">
                      প্রত্যাখ্যান
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={shops}
          isLoading={isLoading}
          searchPlaceholder="দোকান খুঁজুন..."
        />
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailShop} onOpenChange={() => setDetailShop(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>🏪 {detailShop?.shop_name}</DialogTitle>
          </DialogHeader>
          {detailShop && (
            <div className="space-y-3 text-sm">
              {[
                ['Owner',    (detailShop.profiles as any)?.full_name],
                ['Phone',    detailShop.phone],
                ['WhatsApp', detailShop.whatsapp],
                ['Address',  detailShop.address],
                ['Category', (detailShop.categories as any)?.name],
                ['Status',   detailShop.status],
                ['Rating',   `${detailShop.rating} (${detailShop.review_count} reviews)`],
              ].map(([label, value]) => value && (
                <div key={label} className="flex gap-2">
                  <span className="text-gray-400 w-20 flex-shrink-0">{label}:</span>
                  <span className="text-gray-800 font-medium">{value}</span>
                </div>
              ))}
              {detailShop.description && (
                <div>
                  <p className="text-gray-400 mb-1">Description:</p>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{detailShop.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            {detailShop?.status !== 'approved' && (
              <Button size="sm" variant="success" onClick={() => { handleStatus(detailShop!.id, 'approved'); setDetailShop(null) }}>
                <CheckCircle className="h-4 w-4" /> Approve
              </Button>
            )}
            {detailShop?.status !== 'rejected' && (
              <Button size="sm" variant="destructive" onClick={() => { handleStatus(detailShop!.id, 'rejected'); setDetailShop(null) }}>
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
