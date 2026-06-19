import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Package, MoreHorizontal, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function useAllProducts(shopFilter: string) {
  return useQuery({
    queryKey: ['admin-products', shopFilter],
    queryFn: async () => {
      let q = supabase
        .from('products')
        .select('*, shops(shop_name, id)')
        .order('created_at', { ascending: false })
      if (shopFilter) q = q.eq('shop_id', shopFilter)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Product[]
    },
  })
}

function useAllShopsSelect() {
  return useQuery({
    queryKey: ['admin-shops-select'],
    queryFn: async () => {
      const { data } = await supabase.from('shops').select('id, shop_name').eq('status', 'approved').order('shop_name')
      return data ?? []
    },
  })
}

function useToggleProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('products').update({ is_active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  })
}

function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  })
}

export default function ManageProducts() {
  const [shopFilter, setShopFilter] = useState('')

  const { data: products = [], isLoading } = useAllProducts(shopFilter)
  const { data: shops = [] } = useAllShopsSelect()
  const toggle = useToggleProduct()
  const remove = useDeleteProduct()

  const handleToggle = async (p: Product) => {
    try {
      await toggle.mutateAsync({ id: p.id, is_active: !p.is_active })
      toast.success(p.is_active ? 'Product hidden' : 'Product visible ✅')
    } catch { toast.error('Failed') }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    try {
      await remove.mutateAsync(id)
      toast.success('Product deleted')
    } catch { toast.error('Failed') }
  }

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }) => {
        const p = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {p.image_url
                ? <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                : <Package className="h-5 w-5 text-gray-400 m-auto mt-2.5" />
              }
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate max-w-[160px]">{p.name}</p>
              {p.category && <p className="text-xs text-gray-400">{p.category}</p>}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'shops',
      header: 'Shop',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{(row.original.shops as any)?.shop_name || '—'}</span>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <span className="font-semibold text-gray-900">
          {row.original.price != null ? `৳${Number(row.original.price).toLocaleString()}` : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'in_stock',
      header: 'Stock',
      cell: ({ row }) => (
        row.original.in_stock
          ? <Badge variant="success">In Stock</Badge>
          : <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />Out</Badge>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Visible',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'success' : 'secondary'}>
          {row.original.is_active ? 'Visible' : 'Hidden'}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Added',
      cell: ({ row }) => (
        <span className="text-xs text-gray-400">{new Date(row.original.created_at).toLocaleDateString('bn-BD')}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const p = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleToggle(p)}>
                {p.is_active
                  ? <><EyeOff className="h-4 w-4" /> Hide Product</>
                  : <><Eye className="h-4 w-4" /> Show Product</>
                }
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(p.id, p.name)}>
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const shopFilterSelect = (
    <select
      value={shopFilter}
      onChange={e => setShopFilter(e.target.value)}
      className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      <option value="">All Shops</option>
      {shops.map((s: any) => <option key={s.id} value={s.id}>{s.shop_name}</option>)}
    </select>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Package className="h-6 w-6" /> All Products</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage products across all shops</p>
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        searchPlaceholder="Search products..."
        toolbar={shopFilterSelect}
      />
    </div>
  )
}
