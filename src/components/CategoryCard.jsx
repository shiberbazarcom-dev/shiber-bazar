import { Link } from 'react-router-dom'

export default function CategoryCard({ category, shopCount }) {
  return (
    <Link
      to={`/category/${category.slug}`}
      className="card flex flex-col items-center justify-center p-6 text-center group hover:border-primary-300 border-2 border-transparent transition-all duration-200"
    >
      <span className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-200">
        {category.icon}
      </span>
      <h3 className="font-semibold text-gray-800 group-hover:text-primary-700 transition-colors">
        {category.name}
      </h3>
      {shopCount !== undefined && (
        <p className="text-sm text-gray-500 mt-1">{shopCount} টি দোকান</p>
      )}
    </Link>
  )
}
