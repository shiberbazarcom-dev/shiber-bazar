import { useState, useEffect } from 'react'
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
import { Store, MoreHorizontal, CheckCircle, XCircle, Eye, Trash2, Star, ShieldCheck, FileText, X } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Verification helpers ──────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<string, string> = {
  nid_front:       'NID — সামনের দিক',
  nid_back:        'NID — পেছনের দিক',
  trade_license:   'ট্রেড লাইসেন্স',
  driving_license: 'ড্রাইভিং লাইসেন্স',
  passport:        'পাসপোর্ট',
  other:           'অন্যান্য',
}

const VER_STATUS: Record<string, { label: string; cls: string }> = {
  pending_review: { label: '⏳ পর্যালোচনাধীন', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  verified:       { label: '✅ যাচাইকৃত',      cls: 'bg-green-50 text-green-700 border-green-200' },
  rejected:       { label: '❌ প্রত্যাখ্যাত',  cls: 'bg-red-50 text-red-700 border-red-200' },
}

function useShopVerifications(shopId: string | null) {
  return useQuery({
    queryKey: ['shop-verifications-admin', shopId],
    queryFn: async () => {
      if (!shopId) return []
      const { data, error } = await supabase
        .from('shop_verifications')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!shopId,
  })
}

function useReviewDoc() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, shopId, status, rejectionReason }: {
      id: string; shopId: string; status: string; rejectionReason?: string
    }) => {
      const { error } = await supabase.from('shop_verifications').update({
        status,
        rejection_reason: rejectionReason || null,
        verified_by: status === 'verified' ? (await supabase.auth.getUser()).data.user?.id : null,
        verified_at: status === 'verified' ? new Date().toISOString() : null,
      }).eq('id', id)
      if (error) throw error
      // Update shop's aggregate verification_status
      const { data: allDocs } = await supabase.from('shop_verifications').select('status').eq('shop_id', shopId)
      const statuses = (allDocs || []).map((d: any) => d.status)
      const shopVerStatus = statuses.includes('verified') ? 'verified'
        : statuses.includes('rejected') ? 'rejected' : 'pending_review'
      await supabase.from('shops').update({ verification_status: shopVerStatus }).eq('id', shopId)
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shop-verifications-admin', vars.shopId] })
      qc.invalidateQueries({ queryKey: ['admin-shops'] })
    },
  })
}

async function getSignedUrl(path: string) {
  const { data, error } = await supabase.storage.from('verification-docs').createSignedUrl(path, 300)
  if (error) throw error
  return data.signedUrl
}

function DocViewer({ path, onClose }: { path: string; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const isPdf = path.toLowerCase().endsWith('.pdf')

  // load on mount
  useEffect(() => {
    getSignedUrl(path)
      .then(u => { setUrl(u); setLoading(false) })
      .catch(() => setLoading(false))
  }, [path])

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="text-sm font-semibold text-gray-800">নথি দেখুন</p>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-3 bg-gray-50 flex items-center justify-center min-h-[280px]">
          {loading && <div className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />}
          {!loading && !url && <p className="text-sm text-red-500">লোড হয়নি — storage bucket বা RLS চেক করুন</p>}
          {url && (isPdf
            ? <iframe src={url} className="w-full h-[50vh] rounded border" title="doc" />
            : <img src={url} alt="doc" className="max-w-full max-h-[50vh] object-contain rounded shadow" />
          )}
        </div>
        {url && (
          <div className="px-4 py-2 border-t text-right">
            <a href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">নতুন ট্যাবে খুলুন ↗</a>
          </div>
        )}
      </div>
    </div>
  )
}

function RejectDocModal({ onConfirm, onClose }: { onConfirm: (r: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5" onClick={e => e.stopPropagation()}>
        <p className="font-bold text-gray-800 mb-3">প্রত্যাখ্যানের কারণ লিখুন</p>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="যেমন: ছবি অস্পষ্ট..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none mb-3" />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">বাতিল</button>
          <button onClick={() => reason.trim() && onConfirm(reason.trim())} disabled={!reason.trim()}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-40">প্রত্যাখ্যান</button>
        </div>
      </div>
    </div>
  )
}

function ShopVerificationDocs({ shopId }: { shopId: string }) {
  const { data: docs = [], isLoading } = useShopVerifications(shopId)
  const reviewDoc = useReviewDoc()
  const [viewingPath, setViewingPath] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  if (isLoading) return (
    <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
      <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" /> লোড হচ্ছে...
    </div>
  )

  if (docs.length === 0) return (
    <p className="text-xs text-gray-400 py-2 italic">কোনো নথি জমা দেওয়া হয়নি</p>
  )

  return (
    <>
      {viewingPath && <DocViewer path={viewingPath} onClose={() => setViewingPath(null)} />}
      {rejectingId && (
        <RejectDocModal
          onClose={() => setRejectingId(null)}
          onConfirm={(reason) => {
            const doc = docs.find((d: any) => d.id === rejectingId)!
            reviewDoc.mutate(
              { id: rejectingId, shopId, status: 'rejected', rejectionReason: reason },
              { onSuccess: () => { toast.success('নথি প্রত্যাখ্যান করা হয়েছে'); setRejectingId(null) } },
            )
          }}
        />
      )}
      <div className="space-y-2">
        {docs.map((doc: any) => {
          const vs = VER_STATUS[doc.status] || VER_STATUS.pending_review
          const isPdf = doc.document_url?.toLowerCase().endsWith('.pdf')
          return (
            <div key={doc.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                {isPdf ? <FileText className="h-4 w-4 text-red-400" /> : <ShieldCheck className="h-4 w-4 text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">
                  {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                </p>
                <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${vs.cls}`}>
                  {vs.label}
                </span>
                {doc.rejection_reason && (
                  <p className="text-[10px] text-red-500 mt-0.5 truncate">{doc.rejection_reason}</p>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => setViewingPath(doc.document_url)}
                  className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600"
                  title="দেখুন"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                {doc.status !== 'verified' && (
                  <button
                    onClick={() => reviewDoc.mutate(
                      { id: doc.id, shopId, status: 'verified' },
                      { onSuccess: () => toast.success('✅ অনুমোদিত') },
                    )}
                    disabled={reviewDoc.isPending}
                    className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 disabled:opacity-50"
                    title="অনুমোদন"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                  </button>
                )}
                {doc.status !== 'rejected' && (
                  <button
                    onClick={() => setRejectingId(doc.id)}
                    disabled={reviewDoc.isPending}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50"
                    title="প্রত্যাখ্যান"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

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
      const { data: shop, error } = await supabase
        .from('shops')
        .update({ status })
        .eq('id', id)
        .select('id, shop_name, slug, owner_id')
        .single()
      if (error) throw error

      // Notify the shop owner — realtime bell picks it up & plays the chime
      const approved = status === 'approved' || status === 'active'
      const rejected = status === 'rejected'
      if ((approved || rejected) && shop?.owner_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: shop.owner_id,
            type: approved ? 'shop_approved' : 'shop_rejected',
            title: approved
              ? '🎉 আপনার দোকান অনুমোদিত হয়েছে'
              : 'আপনার দোকান প্রত্যাখ্যাত হয়েছে',
            message: approved
              ? `"${shop.shop_name}" এখন শিবের বাজারে লাইভ — ক্রেতারা দেখতে ও অর্ডার করতে পারবে!`
              : `"${shop.shop_name}" অনুমোদন করা হয়নি। তথ্য ঠিক করে আবার আবেদন করুন।`,
            is_read: false,
          })
        } catch { /* notification ব্যর্থ হলেও মূল আপডেট আটকাবে না */ }
      }
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
      // Delete child records first so nothing is orphaned (products tab stays clean)
      await supabase.from('products').delete().eq('shop_id', id)
      await supabase.from('favorites').delete().eq('shop_id', id)
      await supabase.from('reviews').delete().eq('shop_id', id)
      await supabase.from('shop_images').delete().eq('shop_id', id)
      const { error } = await supabase.from('shops').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['my-products'] })
      qc.invalidateQueries({ queryKey: ['admin-products'] })
    },
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

function useUpdateShopPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, plan, plan_expires_at }: { id: string; plan: string; plan_expires_at: string | null }) => {
      const { error } = await supabase.from('shops').update({ plan, plan_expires_at }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-shops'] }),
  })
}

function useToggleVerified() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_verified }: { id: string; is_verified: boolean }) => {
      const { error } = await supabase.from('shops').update({ is_verified }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-shops'] }),
  })
}

export default function ManageShops() {
  const [statusFilter, setStatusFilter] = useState<ShopStatus>('all')
  const [detailShop, setDetailShop] = useState<Shop | null>(null)
  const [planModal, setPlanModal] = useState<any | null>(null)
  const [planSaving, setPlanSaving] = useState(false)

  const { data: shops = [], isLoading } = useShops(statusFilter)
  const updateStatus   = useUpdateShopStatus()
  const deleteShop     = useDeleteShop()
  const toggleFeatured = useToggleFeatured()
  const updatePlan     = useUpdateShopPlan()
  const toggleVerified = useToggleVerified()

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
      id: 'plan',
      header: 'Plan',
      cell: ({ row }) => {
        const shop = row.original as any
        const plan = shop.plan || 'free'
        const expires = shop.plan_expires_at ? new Date(shop.plan_expires_at) : null
        const isExpired = expires ? expires < new Date() : false
        const effectivePlan = (plan !== 'free' && !isExpired) ? plan : 'free'
        return (
          <button
            onClick={() => setPlanModal({
              id: shop.id,
              name: shop.shop_name,
              plan: effectivePlan,
              plan_expires_at: expires && !isExpired ? expires.toISOString().slice(0, 10) : '',
              is_verified: shop.is_verified || false,
            })}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
              effectivePlan === 'business' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' :
              effectivePlan === 'pro'      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                             'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {effectivePlan === 'pro' ? '⭐ Pro' : effectivePlan === 'business' ? '💼 Biz' : 'Free'}
            {expires && !isExpired && effectivePlan !== 'free' && (
              <span className="ml-1 opacity-60 font-normal">
                {expires.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </span>
            )}
          </button>
        )
      },
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
                ['মালিক',     (detailShop.profiles as any)?.full_name],
                ['ফোন',       detailShop.phone],
                ['WhatsApp',  detailShop.whatsapp],
                ['ঠিকানা',   detailShop.address],
                ['বিভাগ',    (detailShop.categories as any)?.name],
                ['স্ট্যাটাস', detailShop.status],
                ['রেটিং',    `${detailShop.rating ?? 'N/A'} (${detailShop.review_count ?? 0} reviews)`],
              ].map(([label, value]) => value && (
                <div key={label} className="flex gap-2">
                  <span className="text-gray-400 w-20 flex-shrink-0">{label}:</span>
                  <span className="text-gray-800 font-medium">{value}</span>
                </div>
              ))}
              {detailShop.description && (
                <div>
                  <p className="text-gray-400 mb-1">বিবরণ:</p>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{detailShop.description}</p>
                </div>
              )}

              {/* ── Verification Documents ── */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                  যাচাইকরণ নথি
                </p>
                <ShopVerificationDocs shopId={detailShop.id} />
              </div>
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

      {/* Plan Edit Modal */}
      {planModal && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPlanModal(null)} />
          <div className="relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl shadow-2xl p-6 space-y-4">
            <div>
              <h3 className="font-bold text-gray-900">📋 Plan পরিবর্তন</h3>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{planModal.name}</p>
            </div>

            {/* Plan select */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">Plan নির্বাচন করুন</label>
              <div className="grid grid-cols-3 gap-2">
                {(['free', 'pro', 'business'] as const).map(p => (
                  <button key={p} onClick={() => {
                    const defaultExpiry = p === 'free' ? '' : (() => {
                      const d = new Date(); d.setMonth(d.getMonth() + 1)
                      return d.toISOString().slice(0, 10)
                    })()
                    setPlanModal((f: any) => ({ ...f, plan: p, plan_expires_at: f.plan_expires_at || defaultExpiry }))
                  }}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                      planModal.plan === p
                        ? p === 'business' ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : p === 'pro'      ? 'border-blue-500 bg-blue-50 text-blue-700'
                        :                    'border-gray-400 bg-gray-50 text-gray-700'
                        : 'border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>
                    {p === 'free' ? 'Free' : p === 'pro' ? '⭐ Pro' : '💼 Business'}
                  </button>
                ))}
              </div>
            </div>

            {/* Expiry date */}
            {planModal.plan !== 'free' && (
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                  মেয়াদ শেষের তারিখ
                  <span className="ml-1 font-normal text-gray-400">(এর পরে auto Free হবে)</span>
                </label>
                <input type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={planModal.plan_expires_at || ''}
                  onChange={e => setPlanModal((f: any) => ({ ...f, plan_expires_at: e.target.value }))}
                  className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400" />
                {planModal.plan_expires_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    {(() => {
                      const days = Math.ceil((new Date(planModal.plan_expires_at).getTime() - Date.now()) / 86400000)
                      return days > 0 ? `আজ থেকে ${days} দিন পর expire হবে` : 'আজই expire হবে'
                    })()}
                  </p>
                )}
              </div>
            )}

            {/* Verified toggle */}
            <div className="flex items-center justify-between py-2 border-t border-gray-100">
              <div>
                <p className="text-xs font-semibold text-gray-700">Verified Badge</p>
                <p className="text-xs text-gray-400">দোকানে ✓ Verified দেখাবে</p>
              </div>
              <button
                onClick={() => setPlanModal((f: any) => ({ ...f, is_verified: !f.is_verified }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${planModal.is_verified ? 'bg-green-500' : 'bg-gray-200'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${planModal.is_verified ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setPlanModal(null)}
                className="flex-1 h-10 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                বাতিল
              </button>
              <button
                disabled={planSaving || (planModal.plan !== 'free' && !planModal.plan_expires_at)}
                onClick={async () => {
                  setPlanSaving(true)
                  try {
                    await updatePlan.mutateAsync({
                      id: planModal.id,
                      plan: planModal.plan,
                      plan_expires_at: planModal.plan_expires_at
                        ? new Date(planModal.plan_expires_at + 'T23:59:59').toISOString()
                        : null,
                    })
                    await toggleVerified.mutateAsync({ id: planModal.id, is_verified: planModal.is_verified })
                    toast.success(`✅ ${planModal.name} → ${planModal.plan}`)
                    setPlanModal(null)
                  } catch { toast.error('সমস্যা হয়েছে') }
                  setPlanSaving(false)
                }}
                className="flex-1 h-10 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                style={{ background: planModal.plan === 'business' ? '#7c3aed' : planModal.plan === 'pro' ? '#2563EB' : '#6b7280' }}>
                {planSaving ? 'সংরক্ষণ...' : '✓ সংরক্ষণ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
