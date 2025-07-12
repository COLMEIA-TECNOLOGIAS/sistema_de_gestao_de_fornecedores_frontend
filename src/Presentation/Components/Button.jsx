export default function Button({ children, type = "button", onClick }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="w-full bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 transition-colors text-2xl font-medium shadow-sm"
    >
      {children}
    </button>
  )
}
