import { useState } from "react"

export default function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Recuperar senha para:", email)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md relative">
        <h2 className="text-2xl font-semibold mb-4">Recuperar senha</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            className="w-full border px-4 py-2 rounded mb-4"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Enviar link de recuperação
          </button>
        </form>
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-xl"
        >
          &times;
        </button>
      </div>
    </div>
  )
}
