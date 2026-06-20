import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { persistQueryClient } from '@tanstack/react-query-persist-client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            1000 * 60 * 2,   // 2 min
      gcTime:               1000 * 60 * 60,  // 1 hour
      retry: 1,
      refetchOnWindowFocus: false,
      // Chat queries override staleTime/refetch at hook level
    },
  },
})

/* ── Persist React Query cache to localStorage ──
   Internet না থাকলে localStorage থেকে পুরনো data দেখাবে */
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'sb-query-cache',
  throttleTime: 3000,
})

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // ২৪ ঘণ্টা পর্যন্ত cache রাখবে
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // শুধু public data cache করব — private/auth data নয়
      const key = query.queryKey[0]
      return [
        'shops', 'categories', 'featured-shops',
        'shop', 'products', 'shop-products',
      ].includes(key)
    },
  },
})
