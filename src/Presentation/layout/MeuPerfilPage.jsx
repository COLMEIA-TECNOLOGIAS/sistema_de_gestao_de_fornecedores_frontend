import { useState, useEffect } from "react";
import { User, Mail, Shield, Camera, Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { usersAPI } from "../../services/api";

export default function MeuPerfilPage() {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        role: user?.role || "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ type: "", message: "" });

        try {
            const response = await usersAPI.update(user.id, {
                name: formData.name,
                email: formData.email,
                // Usually role shouldn't be editable by the user themselves in a profile page, 
                // but I'll keep it if the API expects it or just send name/email.
            });

            // Update local storage and context
            if (updateUser) {
                updateUser(response.user || { ...user, ...formData });
            }

            setStatus({
                type: "success",
                message: "Perfil atualizado com sucesso!",
            });
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            setStatus({
                type: "error",
                message: error.response?.data?.message || "Erro ao atualizar perfil. Tente novamente.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.name || "User")}`;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
                    <p className="text-gray-500">Gerencie suas informações pessoais e configurações de conta.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-[#44B16F] to-[#368d58]"></div>
                        <div className="px-6 pb-6">
                            <div className="relative -mt-16 mb-4 flex justify-center">
                                <div className="relative">
                                    <img
                                        src={userAvatar}
                                        alt={formData.name}
                                        className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md object-cover"
                                    />
                                    <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-100 text-gray-600 hover:text-[#44B16F] transition-colors">
                                        <Camera size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900">{formData.name}</h3>
                                <p className="text-sm text-gray-500 capitalize">{user?.role || "Utilizador"}</p>
                            </div>

                            <div className="mt-6 space-y-4">
                                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                                    <Mail size={18} className="text-[#44B16F]" />
                                    <span className="truncate">{formData.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                                    <Shield size={18} className="text-[#44B16F]" />
                                    <span className="capitalize">{user?.role || "Acesso Padrão"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <User size={20} className="text-[#44B16F]" />
                            Informações Pessoais
                        </h3>

                        {status.message && (
                            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                                }`}>
                                {status.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                <p className="text-sm font-medium">{status.message}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-semibold text-gray-700 px-1">
                                        Nome Completo
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Seu nome"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-semibold text-gray-700 px-1">
                                        Endereço de E-mail
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="seu@email.com"
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center gap-2 px-8 py-3 bg-[#44B16F] text-white font-bold rounded-xl hover:bg-[#368d58] transition-all shadow-lg shadow-[#44B16F]/20 disabled:opacity-70 disabled:cursor-not-allowed group"
                                >
                                    {isLoading ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <Save size={20} className="group-hover:scale-110 transition-transform" />
                                    )}
                                    {isLoading ? "Salvando..." : "Salvar Alterações"}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Shield size={20} className="text-[#44B16F]" />
                            Segurança
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Para alterar sua senha ou outras configurações de segurança, entre em contato com o administrador do sistema.
                        </p>
                        <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                            <div className="flex items-center gap-3 text-yellow-800">
                                <AlertCircle size={20} />
                                <span className="text-sm font-medium">A autenticação de dois fatores não está ativa.</span>
                            </div>
                            <button disabled className="text-sm font-bold text-yellow-800 hover:underline opacity-50 cursor-not-allowed">
                                Ativar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
