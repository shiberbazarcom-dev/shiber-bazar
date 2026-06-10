// ── Database row types ────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  email?: string | null
  avatar_url: string | null
  role: 'user' | 'shop_owner' | 'market_manager' | 'super_admin'
  is_active: boolean
  bio: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  subcategories?: Subcategory[]
  _count?: { shops: number }
}

export interface Subcategory {
  id: string
  category_id: string
  name: string
  slug: string
  sort_order: number
  is_active: boolean
}

export interface Shop {
  id: string
  owner_id: string
  shop_name: string
  slug: string | null
  description: string | null
  address: string | null
  phone: string | null
  whatsapp: string | null
  logo_url: string | null
  cover_url: string | null
  category_id: string | null
  status: 'pending_approval' | 'approved' | 'rejected' | 'suspended'
  is_featured: boolean
  is_verified: boolean
  rating: number
  review_count: number
  created_at: string
  // joins
  profiles?: Pick<Profile, 'full_name' | 'phone'>
  categories?: Pick<Category, 'name' | 'slug'>
}

export interface Order {
  id: string
  order_number: string
  shop_id: string | null
  customer_name: string
  customer_phone: string
  customer_address: string | null
  items: OrderItem[]
  total_amount: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'rejected'
  notes: string | null
  created_at: string
  updated_at: string
  // joins
  shops?: Pick<Shop, 'shop_name' | 'phone' | 'whatsapp'>
}

export interface OrderItem {
  name: string
  qty: number
  price?: number
}

export interface Product {
  id: string
  shop_id: string
  name: string
  description: string | null
  price: number | null
  image_url: string | null
  category: string | null
  is_active: boolean
  in_stock: boolean
  sort_order: number
  created_at: string
  // joins
  shops?: Pick<Shop, 'shop_name'>
}

export interface Advertisement {
  id: string
  title: string
  image_url: string | null
  link_url: string | null
  ad_type: 'banner' | 'sidebar' | 'popup'
  is_active: boolean
  sort_order: number
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

export interface SiteSetting {
  id: string
  key: string
  value: string
  type: 'text' | 'boolean' | 'number' | 'url' | 'textarea'
  label: string
  group: string
}
