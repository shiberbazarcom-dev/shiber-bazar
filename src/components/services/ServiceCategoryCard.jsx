import { Link } from 'react-router-dom'

export default function ServiceCategoryCard({ category }) {
  const { icon, name_bn, slug } = category
  return (
    <Link
      to={`/services/${slug}`}
      className="flex flex-col items-center justify-center gap-1.5 py-3 px-1 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 active:scale-95 transition-all text-center group"
    >
      <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform leading-none">{icon}</span>
      <span className="text-[10px] sm:text-xs font-semibold text-gray-700 leading-tight">{name_bn}</span>
    </Link>
  )
}
