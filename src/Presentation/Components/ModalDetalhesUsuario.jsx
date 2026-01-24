import { X, User, Mail, Shield, CheckCircle2, XCircle } from "lucide-react";

export default function ModalDetalhesUsuario({ isOpen, onClose, user }) {
    if (!isOpen || !user) return null;

    const getRoleLabel = (role) => {
        const roles = {
            admin: "Administrador",
            procurement_technician: "Técnico de Compras",
            manager: "Gestor",
            viewer: "Visualizador",
        };
        return roles[role] || role;
    };

    const userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || user.nome || "User")}`;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fadeIn relative">

                {/* Close Button Absolute */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm text-gray-500 hover:text-gray-700 transition-all z-10"
                >
                    <X size={20} />
                </button>

                {/* Banner Header */}
                <div className="h-32 bg-gradient-to-r from-[#44B16F] to-[#368d58] relative"></div>

                {/* Profile Content */}
                <div className="px-8 pb-8">
                    {/* Avatar - Negative Margin to overlap header */}
                    <div className="relative -mt-16 mb-4 flex justify-center">
                        <div className="relative">
                            <img
                                src={userAvatar}
                                alt={user.name}
                                className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md object-cover"
                            />
                            <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white ${user.is_active !== false ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">{user.name || user.nome}</h2>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 mt-2">
                            <Shield size={12} />
                            {getRoleLabel(user.role)}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-[#44B16F]">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Email</p>
                                <p className="text-gray-900 font-medium">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-[#44B16F]">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">ID do Usuário</p>
                                <p className="text-gray-900 font-medium">#{user.id}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                            <div className={`p-2 bg-white rounded-lg shadow-sm ${user.is_active !== false ? 'text-green-600' : 'text-red-600'}`}>
                                {user.is_active !== false ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Status da Conta</p>
                                <p className={`font-medium ${user.is_active !== false ? 'text-green-700' : 'text-red-700'}`}>
                                    {user.is_active !== false ? 'Ativa' : 'Inativa'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm shadow-sm"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
