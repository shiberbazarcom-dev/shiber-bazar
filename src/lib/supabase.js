import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

/* ── helpers ── */

export const db = {
  // Shops
  shops: () => supabase.from('shops'),
  // Categories
  categories: () => supabase.from('categories'),
  // Profiles
  profiles: () => supabase.from('profiles'),
  // Reviews
  reviews: () => supabase.from('reviews'),
  // Favorites
  favorites: () => supabase.from('favorites'),
  // Shop images
  shopImages: () => supabase.from('shop_images'),
  // Advertisements
  ads: () => supabase.from('advertisements'),
  // Shop views
  views: () => supabase.from('shop_views'),
  // Subcategories
  subcategories: () => supabase.from('subcategories'),
  // Contact requests
  contacts: () => supabase.from('contact_requests'),
}

export async function uploadImage(file, bucket = 'shops') {
  const ext  = file.name.split('.').pop()
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage.from(bucket).upload(name, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(name)
  return publicUrl
}
