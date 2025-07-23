export default function PasswordStrength({ strength }) {
  const levels = [
    { color: 'bg-red-500', text: 'Fraca' },
    { color: 'bg-yellow-500', text: 'Média' },
    { color: 'bg-green-500', text: 'Forte' }
  ];
  
  return (
    <div className="mt-2">
      <div className="flex gap-1 h-1.5 mb-1">
        {[1, 2, 3].map((level) => (
          <div 
            key={level} 
            className={`flex-1 rounded-full ${level <= strength ? levels[strength-1].color : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className="text-sm text-gray-600">{levels[strength-1].text}</p>
    </div>
  );
}