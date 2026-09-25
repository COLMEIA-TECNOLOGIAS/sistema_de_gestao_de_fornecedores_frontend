import { useRef } from "react";

export default function OtpInput({ value = "", onChange, length = 6, disabled = false, autoFocus = true }) {
    const inputRefs = useRef([]);

    const fillFrom = (index, digits) => {
        const chars = value.padEnd(length, " ").split("");
        digits.split("").forEach((d, i) => {
            if (index + i < length) chars[index + i] = d;
        });
        onChange(chars.join("").replace(/ /g, ""));
        inputRefs.current[Math.min(index + digits.length, length - 1)]?.focus();
    };

    const handleChange = (index, e) => {
        const digits = e.target.value.replace(/\D/g, "");
        // Vários dígitos de uma vez (preenchimento automático do SMS/e-mail em telemóveis)
        if (digits.length > 1 && !value[index]) {
            fillFrom(index, digits.slice(0, length - index));
            return;
        }
        // Mantém apenas o último dígito escrito, permitindo substituir o existente
        const digit = digits.slice(-1);
        const chars = value.padEnd(length, " ").split("").map((c, i) => (i === index ? digit : c));
        onChange(chars.join("").replace(/ /g, ""));
        if (digit && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !value[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === "ArrowRight" && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
        if (!pasted) return;
        onChange(pasted);
        const targetIndex = Math.min(pasted.length, length - 1);
        inputRefs.current[targetIndex]?.focus();
    };

    return (
        <div className="flex gap-3 justify-center" onPaste={handlePaste}>
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={`Dígito ${index + 1} de ${length}`}
                    onFocus={(e) => e.target.select()}
                    autoFocus={autoFocus && index === 0}
                    value={value[index] || ""}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={disabled}
                    className="w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-[#44B16F]/30 focus:border-[#44B16F] transition-all"
                    style={{
                        background: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-primary)',
                    }}
                />
            ))}
        </div>
    );
}