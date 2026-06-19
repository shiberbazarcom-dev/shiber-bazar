import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { supabase } from '@/lib/supabase'
import { Category } from '@/types'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tag, MoreHorizontal, Pencil, Trash2, Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

type CategoryForm = { name: string; icon: string; description: string; sort_order: number; is_active: boolean }
const EMPTY: CategoryForm = { name: '', icon: '🏪', description: '', sort_order: 0, is_active: true }

function useCategories() {
  return useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*, subcategories(id)')
        .order('sort_order')
      if (error) throw error
      return (data ?? []) as (Category & { subcategories: { id: string }[] })[]
    },
  })
}

function useUpsertCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Category> & { id?: string }) => {
      const { id, ...rest } = payload
      const slug = rest.name!.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')
      if (id) {
        const { error } = await supabase.from('categories').update({ ...rest, slug }).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('categories').insert({ ...rest, slug })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
  })
}

function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-categories'] }),
  })
}

export default function ManageCategories() {
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm]       = useState<CategoryForm>(EMPTY)

  const { data: categories = [], isLoading } = useCategories()
  const upsert = useUpsertCategory()
  const remove = useDeleteCategory()

  const set = (k: keyof CategoryForm, v: any) => setForm(f => ({ ...f, [k]: v }))

  const openNew = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({ name: cat.name, icon: cat.icon ?? '🏪', description: cat.description ?? '', sort_order: cat.sort_order, is_active: cat.is_active })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name required')
    try {
      await upsert.mutateAsync({ ...(editing ? { id: editing.id } : {}), ...form, sort_order: Number(form.sort_order) })
      toast.success(editing ? 'Category updated ✅' : 'Category created ✅')
      setOpen(false)
    } catch (err: any) { toast.error(err.message || 'Failed') }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    try {
      await remove.mutateAsync(id)
      toast.success('Deleted')
    } catch (err: any) { toast.error(err.message || 'Failed') }
  }

  const handleToggle = async (cat: Category) => {
    try {
      await upsert.mutateAsync({ id: cat.id, is_active: !cat.is_active })
      toast.success(cat.is_active ? 'Deactivated' : 'Activated ✅')
    } catch { toast.error('Failed') }
  }

  const columns: ColumnDef<Category & { subcategories: { id: string }[] }>[] = [
    {
      accessorKey: 'name',
      header: 'Category',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span className="text-2xl">{row.original.icon || '📦'}</span>
          <div>
            <p className="font-medium text-gray-900">{row.original.name}</p>
            <p className="text-xs text-gray-400 font-mono">{row.original.slug}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-sm text-gray-500 line-clamp-1">{row.original.description || '—'}</span>
      ),
    },
    {
      id: 'subcategories',
      header: 'Subcategories',
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.subcategories?.length ?? 0}</Badge>
      ),
    },
    {
      accessorKey: 'sort_order',
      header: 'Order',
      cell: ({ row }) => <span className="text-sm text-gray-500">{row.original.sort_order}</span>,
    },
    {
      accessorKey: 'is_active',
      header: 'Active',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'success' : 'secondary'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const cat = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(cat)}>
                <Pencil className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggle(cat)}>
                {cat.is_active
                  ? <><ToggleLeft className="h-4 w-4" /> Deactivate</>
                  : <><ToggleRight className="h-4 w-4" /> Activate</>
                }
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(cat.id, cat.name)}>
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Tag className="h-6 w-6" /> Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage shop categories</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Add Category</Button>
      </div>

      <DataTable columns={columns} data={categories} isLoading={isLoading} searchPlaceholder="Search categories..." />

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? '✏️ Edit Category' : '➕ New Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label>Icon</Label>
                <Input value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="🏪" className="text-center text-lg" />
              </div>
              <div className="col-span-3">
                <Label>Name *</Label>
                <Input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Category name" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional description..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} min={0} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-1">
                  <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 accent-purple-600" />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={upsert.isPending}>
                {upsert.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
