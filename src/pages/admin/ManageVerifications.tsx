import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, XCircle, Clock, FileText, ShieldCheck, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────

type VerificationStatus = 'pending_review' | 'verified' | 'rejected'

type Verification = {
  id: string
  shop_id: string
  user_id: string
  document_type: string
  document_url: string
  status: VerificationStatus
  rejection_reason: string | null
  verified_by: string | null
  verified_at: string | null
  created_at: string
  shops: { shop_name: string; slug: string } | null
  profiles: { full_name: string } | null
}

const DOC_TYPE_LABELS: Record<string, string> = {
  nid_front:       'জাতীয় পরিচয়পত্র (সামনে)',
  nid_back:        'জাতীয় পরিচয়পত্র (পেছনে)',
  trade_license:   'ট্রেড লাইসেন্স',
  driving_license: 'ড্রাইভিং লাইসেন্স',
  passport:        'পাসপোর্ট',
  other:           'অন্যান্য',
}

const STATUS_META: Record<VerificationStatus, { label: string; color: string; Icon: any }> = {
  pending_review: { label: 'পর্যালোচনাধীন', color: 'text-yellow-700 bg-yellow-50 border-yellow-200', Icon: Clock },
  verified:       { label: 'যাচাইকৃত',      color: 'text-green-700 bg-green-50 border-green-200',   Icon: CheckCircle },
  rejected:       { label: 'প্রত্যাখ্যাত', color: 'text-red-700 bg-red-50 border-red-200',         Icon: XCircle },
}

// ── Hooks ─────────────────────────────────────────────────────────────

function useVerifications(filter: VerificationStatus | 'all') {
  return useQuery<Verification[]>({
    queryKey: ['admin-verifications', filter],
    queryFn: async () => {
      let q = supabase
        .from('shop_verifications')
        .select(`
          *,
          shops(shop_name, slug),
          profiles:user_id(full_name)
        `)
        .order('created_at', { ascending: false })
      if (filter !== 'all') q = q.eq('status', filter)
      const { data, error } = await q
      if (error) throw error
      return (data || []) as Verification[]
    },
  })
}

function useReviewVerification() {
  const qc = useQueryClient()
  const { data: { user } } = supabase.auth.getUser() as any
  return useMutation({
    mutationFn: async ({
      id, shopId, status, rejectionReason,
    }: { id: string; shopId: string; status: VerificationStatus; rejectionReason?: string }) => {
      const { error: verErr } = await supabase
        .from('shop_verifications')
        .update({
          status,
          rejection_reason: rejectionReason || null,
          verified_by: status !== 'rejected' ? (await supabase.auth.getUser()).data.user?.id : null,
          verified_at: status !== 'rejected' ? new Date().toISOString() : null,
        })
        .eq('id', id)
      if (verErr) throw verErr

      // Update shop's verification_status
      // For a shop to be "verified", at least 1 doc must be verified and none rejected
      const { data: allDocs } = await supabase
        .from('shop_verifications')
        .select('status')
        .eq('shop_id', shopId)
      const statuses = (allDocs || []).map((d: any) => d.status)
      let shopVerStatus: string
      if (statuses.includes('verified')) {
        shopVerStatus = 'verified'
      } else if (statuses.includes('rejected')) {
        shopVerStatus = 'rejected'
      } else {
        shopVerStatus = 'pending_review'
      }
      await supabase.from('shops').update({ verification_status: shopVerStatus }).eq('id', shopId)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-verifications'] })
      qc.invalidateQueries({ queryKey: ['shops'] })
    },
  })
}

// ── Get signed URL for private doc ────────────────────────────────────

async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('verification-docs')
    .createSignedUrl(path, 60 * 5) // 5 min
  if (error) throw error
  return data.signedUrl
}

// ── Components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VerificationStatus }) {
  const m = STATUS_META[status]
  const { Icon } = m
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${m.color}`}>
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  )
}

function DocViewerModal({ path, onClose }: { path: string; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isPdf = path.endsWith('.pdf')

  useState(() => {
    getSignedUrl(path)
      .then(u => { setUrl(u); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  })

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="font-semibold text-gray-800 text-sm">নথি দেখুন</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 flex items-center justify-center min-h-[300px] bg-gray-50">
          {loading && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-xs text-gray-400">লোড হচ্ছে...</p>
            </div>
          )}
          {error && (
            <div className="text-center">
              <p className="text-red-500 text-sm">{error}</p>
              <p className="text-xs text-gray-400 mt-1">RLS policy বা bucket নাও থাকতে পারে।</p>
            </div>
          )}
          {url && !loading && (
            isPdf ? (
              <iframe src={url} title="doc" className="w-full h-[60vh] rounded-lg border" />
            ) : (
              <img src={url} alt="doc" className="max-w-full max-h-[60vh] rounded-lg object-contain shadow" />
            )
          )}
        </div>
        {url && (
          <div className="px-5 py-3 border-t flex justify-end">
            <a href={url} target="_blank" rel="noreferrer"
              className="text-xs text-blue-600 hover:underline font-medium">
              নতুন ট্যাবে খুলুন ↗
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function RejectModal({
  onConfirm, onClose,
}: { onConfirm: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" /> প্রত্যাখ্যানের কারণ
        </h3>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="কারণ লিখুন (যেমন: ছবি অস্পষ্ট, নথি মেয়াদোত্তীর্ণ...)"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none mb-4"
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
            বাতিল
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-40">
            প্রত্যাখ্যান করুন
          </button>
        </div>
      </div>
    </div>
  )
}

function VerificationCard({ doc }: { doc: Verification }) {
  const [viewingPath, setViewingPath] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const reviewMutation = useReviewVerification()

  const shopName  = doc.shops?.shop_name || '—'
  const ownerName = doc.profiles?.full_name || '—'

  function approve() {
    reviewMutation.mutate(
      { id: doc.id, shopId: doc.shop_id, status: 'verified' },
      { onSuccess: () => toast.success('✅ যাচাই সম্পন্ন হয়েছে') },
    )
  }

  function reject(reason: string) {
    reviewMutation.mutate(
      { id: doc.id, shopId: doc.shop_id, status: 'rejected', rejectionReason: reason },
      { onSuccess: () => { toast.success('নথি প্রত্যাখ্যান করা হয়েছে'); setShowRejectModal(false) } },
    )
  }

  return (
    <>
      {viewingPath && <DocViewerModal path={viewingPath} onClose={() => setViewingPath(null)} />}
      {showRejectModal && <RejectModal onConfirm={reject} onClose={() => setShowRejectModal(false)} />}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/50">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-800 text-sm truncate">🏪 {shopName}</p>
            <p className="text-xs text-gray-400 truncate">মালিক: {ownerName}</p>
          </div>
          <StatusBadge status={doc.status} />
        </div>

        <div className="p-4 space-y-3">
          {/* Doc type */}
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-700 font-medium">
              {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
            </span>
          </div>

          {/* Date */}
          <p className="text-xs text-gray-400">
            জমা দেওয়া হয়েছে: {new Date(doc.created_at).toLocaleDateString('bn-BD', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>

          {/* Rejection reason if any */}
          {doc.rejection_reason && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-red-700 mb-0.5">প্রত্যাখ্যানের কারণ:</p>
              <p className="text-xs text-red-600">{doc.rejection_reason}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setViewingPath(doc.document_url)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex-1 justify-center"
            >
              <Eye className="h-3.5 w-3.5" />
              দেখুন
            </button>

            {doc.status !== 'verified' && (
              <button
                onClick={approve}
                disabled={reviewMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex-1 justify-center disabled:opacity-50"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                অনুমোদন
              </button>
            )}

            {doc.status !== 'rejected' && (
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={reviewMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex-1 justify-center disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                প্রত্যাখ্যান
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Page ───────────────────────────────────────────────────────────────

export default function ManageVerifications() {
  const [filter, setFilter] = useState<VerificationStatus | 'all'>('pending_review')
  const { data: docs = [], isLoading, error } = useVerifications(filter)

  const tabs: { key: VerificationStatus | 'all'; label: string; icon: string }[] = [
    { key: 'pending_review', label: 'পর্যালোচনাধীন', icon: '⏳' },
    { key: 'verified',       label: 'যাচাইকৃত',      icon: '✅' },
    { key: 'rejected',       label: 'প্রত্যাখ্যাত',  icon: '❌' },
    { key: 'all',            label: 'সব',             icon: '📋' },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">🔏 দোকান যাচাইকরণ</h1>
          <p className="text-xs text-gray-400 mt-0.5">দোকান মালিকদের জমা দেওয়া পরিচয় নথি যাচাই করুন</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              filter === t.key
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {t.icon} {t.label}
            {' '}
            {!isLoading && filter === t.key && (
              <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                filter === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>{docs.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 h-48 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-red-500 text-sm">ডেটা লোড হয়নি: {(error as Error).message}</p>
            <p className="text-xs text-gray-400 mt-1">SQL migration রান করা হয়েছে কি?</p>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!isLoading && !error && docs.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-4xl mb-3">🔏</p>
            <p className="text-gray-500 text-base font-medium mb-1">
              {filter === 'pending_review' ? 'পর্যালোচনার অপেক্ষায় কোনো নথি নেই' :
               filter === 'verified'       ? 'এখনো কোনো নথি যাচাই হয়নি' :
               filter === 'rejected'       ? 'প্রত্যাখ্যাত কোনো নথি নেই' :
               'কোনো নথি পাওয়া যায়নি'}
            </p>
            <p className="text-xs text-gray-400">দোকান মালিকরা নথি আপলোড করলে এখানে দেখাবে</p>
          </CardContent>
        </Card>
      )}

      {/* Cards grid */}
      {!isLoading && !error && docs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(doc => (
            <VerificationCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  )
}
