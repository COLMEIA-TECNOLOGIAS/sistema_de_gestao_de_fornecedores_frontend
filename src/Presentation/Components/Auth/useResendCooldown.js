import { useCallback, useEffect, useState } from "react";

/**
 * Tempo de espera entre reenvios de código (evita pedidos repetidos e bloqueios 429).
 *
 * const { remaining, isCoolingDown, start } = useResendCooldown(60);
 * start() depois de um reenvio bem-sucedido; o botão fica desactivado enquanto `isCoolingDown`.
 *
 * @param {number} seconds - duração do intervalo
 * @param {{ startActive?: boolean }} [options] - começar já em espera (ex.: o código acabou de ser enviado)
 */
export function useResendCooldown(seconds = 60, { startActive = false } = {}) {
    const [endsAt, setEndsAt] = useState(() => (startActive ? Date.now() + seconds * 1000 : 0));
    const [now, setNow] = useState(() => Date.now());

    const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));

    useEffect(() => {
        if (remaining <= 0) return;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [remaining]);

    const start = useCallback(() => {
        const current = Date.now();
        setNow(current);
        setEndsAt(current + seconds * 1000);
    }, [seconds]);

    return { remaining, isCoolingDown: remaining > 0, start };
}
