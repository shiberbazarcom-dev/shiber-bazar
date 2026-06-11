import { Link } from 'react-router-dom'

export default function ServiceCategoryCard({ category }) {
  const { icon, name_bn, slug } = category
  return (
    <Link
      to={`/services/${slug}`}
      className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 active:scale-95 transition-all text-center group"
    >
      <span className="text-3xl group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-xs font-semibold text-gray-700 leading-tight">{name_bn}</span>
    </Link>
  )
}
