import { useState } from "react"
import { Eye, EyeOff } from "lucide-react" // ícones minimalistas

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,  
  name,
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === "password"
  const inputType = isPassword && show ? "text" : type

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={name}
          className="block text-2xl font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full  px-4 py-3 pr-10 border border-gray-300 rounded-lg text-2xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  )
}
