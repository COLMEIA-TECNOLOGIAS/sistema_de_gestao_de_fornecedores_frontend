export default function Button({ children, type = "button", onClick }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="w-full bg-green-500 text-white py-4 px-4 rounded-lg hover:bg-green-700 transition-colors text-lg font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {children}
    </button>
  )
}

