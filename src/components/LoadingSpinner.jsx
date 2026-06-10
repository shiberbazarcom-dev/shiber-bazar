export default function LoadingSpinner({ text = 'লোড হচ্ছে...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
      <p>{text}</p>
    </div>
  )
}
