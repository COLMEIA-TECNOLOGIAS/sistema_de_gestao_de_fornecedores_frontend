const LEVELS = [
  { color: 'bg-red-500', text: 'Fraca' },
  { color: 'bg-yellow-500', text: 'Média' },
  { color: 'bg-green-500', text: 'Forte' }
];

export default function PasswordStrength({ strength }) {
  // Garante um índice válido mesmo que o valor recebido esteja fora de 1..3
  const level = Math.min(Math.max(Number(strength) || 0, 0), LEVELS.length);
  if (level === 0) return null;
  const current = LEVELS[level - 1];

  return (
    <div className="mt-2">
      <div className="flex gap-1 h-1.5 mb-1">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`flex-1 rounded-full ${step <= level ? current.color : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className="text-sm text-gray-600">{current.text}</p>
    </div>
  );
}
