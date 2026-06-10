import { useState } from 'react'
import { useCategoryWithCount, useUpsertCategory, useDeleteCategory } from '../../hooks/useCategories'
import { Input, Textarea } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { slugify } from '../../lib/utils'
import toast from 'react-hot-toast'

const ICONS = ['🛒','👕','💊','🥬','🐟','🥩','☕','📱','🔧','🪵','💍','✂️','🔌','📚','🍬','🏪','🌾','🍞','🏥','🚗','⚙️','🎓','💄','🎨','🏗️']

const EMPTY = { name: '', slug: '', icon: '🏪', description: '', sort_order: 0 }

export default function ManageCategories() {
  const { data: categories = [], isLoading } = useCategoryWithCount()
  const upsert = useUpsertCategory()
  const del    = useDeleteCategory()

  const [form, setForm]     = useState(EMPTY)
  const [editing, setEditing] = useState(null) // id or null

  const set = (key, val) => setForm(f => ({
    ...f, [key]: val,
    ...(key === 'name' && !editing ? { slug: slugify(val) } : {}),
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('নাম দিন')
    if (!form.slug.trim()) return toast.error('Slug দিন')
    try {
      await upsert.mutateAsync(editing ? { id: editing, ...form } : form)
      toast.success(editing ? 'আপডেট হয়েছে ✅' : 'বিভাগ যোগ হয়েছে ✅')
      setForm(EMPTY); setEditing(null)
    } catch {
      toast.error('সমস্যা হয়েছে')
    }
  }

  const startEdit = (cat) => {
    setEditing(cat.id)
    setForm({ name: cat.name, slug: cat.slug, icon: cat.icon, description: cat.description || '', sort_order: cat.sort_order || 0 })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" ক্যাটাগরিটি মুছে ফেলবেন? এই ক্যাটাগরির দোকানগুলো ক্যাটাগরিহীন হবে।`)) return
    await del.mutateAsync(id)
    toast.success('বিভাগ মুছে ফেলা হয়েছে')
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">📋 বিভাগ ব্যবস্থাপনা</h1>

      {/* Form */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-5">
          {editing ? '✏️ বিভাগ সম্পাদনা' : '➕ নতুন বিভাগ'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="নাম *" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="যেমন: মুদি দোকান" />
            <Input label="Slug *" value={form.slug} onChange={e => set('slug', e.target.value)} required placeholder="mudi-dokan" />
          </div>

          <div>
            <label className="form-label">আইকন</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {ICONS.map(emoji => (
                <button key={emoji} type="button" onClick={() => set('icon', emoji)}
                  className={`text-2xl p-2 rounded-xl border-2 transition-all ${
                    form.icon === emoji
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 scale-110'
                      : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                  }`}>
                  {emoji}
                </button>
              ))}
            </div>
            <Input value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="অথবা ইমোজি লিখুন" />
          </div>

          <Textarea label="বিবরণ" value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="সংক্ষিপ্ত বিবরণ" />
          <Input label="সাজানোর ক্রম" type="number" value={form.sort_order} onChange={e => set('sort_order', +e.target.value)} />

          <div className="flex gap-3">
            <Button type="submit" loading={upsert.isPending} className="flex-1">
              {editing ? 'আপডেট করুন' : 'ক্যাটাগরি যোগ করুন'}
            </Button>
            {editing && (
              <Button type="button" variant="secondary" onClick={() => { setForm(EMPTY); setEditing(null) }}>
                বাতিল
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="table-cell text-left">বিভাগ</th>
                <th className="table-cell text-left hidden sm:table-cell">Slug</th>
                <th className="table-cell text-center">দোকান</th>
                <th className="table-cell text-center">ক্রম</th>
                <th className="table-cell text-center">কার্যক্রম</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <div>
                        <p className="font-semibold text-slate-700 dark:text-slate-200">{cat.name}</p>
                        {cat.description && <p className="text-xs text-slate-400 truncate max-w-[200px]">{cat.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell hidden sm:table-cell">
                    <code className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-slate-500">{cat.slug}</code>
                  </td>
                  <td className="table-cell text-center">
                    <span className="font-semibold text-brand-600">{cat.shop_count}</span>
                  </td>
                  <td className="table-cell text-center text-slate-400">{cat.sort_order}</td>
                  <td className="table-cell text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button size="xs" variant="secondary" onClick={() => startEdit(cat)}>✏️</Button>
                      <Button size="xs" variant="danger" onClick={() => handleDelete(cat.id, cat.name)}>🗑️</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
