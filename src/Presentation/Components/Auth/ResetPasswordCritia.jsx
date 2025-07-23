export default function PasswordCriteria({ checked, children }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`inline-block w-5 h-5 rounded border ${checked ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}>
        {checked && (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className="text-gray-700">{children}</span>
    </li>
  );
}