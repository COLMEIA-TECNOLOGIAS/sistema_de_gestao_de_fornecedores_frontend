import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Faixa fixa mostrada enquanto o navegador estiver sem ligação. */
export default function OfflineBanner() {
    const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

    useEffect(() => {
        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);
        window.addEventListener("online", goOnline);
        window.addEventListener("offline", goOffline);
        return () => {
            window.removeEventListener("online", goOnline);
            window.removeEventListener("offline", goOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div
            role="status"
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium bg-gray-900 text-white"
        >
            <WifiOff size={16} />
            Sem ligação à Internet — os dados serão actualizados quando a ligação voltar.
        </div>
    );
}
