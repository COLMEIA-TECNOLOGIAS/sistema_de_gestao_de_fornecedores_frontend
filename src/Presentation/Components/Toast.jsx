import { CheckCircle, XCircle, Info, AlertCircle, X } from "lucide-react";
import { useEffect, useRef } from "react";

export default function Toast({ type = "success", message, onClose, duration = 3000 }) {
    // Guardar o callback num ref: um onClose inline não reinicia o temporizador
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => onCloseRef.current?.(), duration);
            return () => clearTimeout(timer);
        }
    }, [duration, message]);

    const config = {
        success: {
            icon: CheckCircle,
            bgColor: "bg-green-50",
            borderColor: "border-green-200",
            iconColor: "text-green-600",
            textColor: "text-green-800",
        },
        error: {
            icon: XCircle,
            bgColor: "bg-red-50",
            borderColor: "border-red-200",
            iconColor: "text-red-600",
            textColor: "text-red-800",
        },
        info: {
            icon: Info,
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
            iconColor: "text-blue-600",
            textColor: "text-blue-800",
        },
        warning: {
            icon: AlertCircle,
            bgColor: "bg-amber-50",
            borderColor: "border-amber-200",
            iconColor: "text-amber-600",
            textColor: "text-amber-800",
        },
    };

    const { icon: Icon, bgColor, borderColor, iconColor, textColor } = config[type] || config.info;

    return (
        <div className="fixed top-4 right-4 z-[10000] animate-slide-in-right">
            <div className={`${bgColor} ${borderColor} border rounded-xl shadow-lg p-4 flex items-center gap-3 min-w-[300px] max-w-md`}>
                <Icon className={iconColor} size={20} />
                <p className={`${textColor} flex-1 text-sm font-medium`}>{message}</p>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-black/5 rounded transition-colors"
                >
                    <X size={16} className="text-gray-500" />
                </button>
            </div>
        </div>
    );
}
