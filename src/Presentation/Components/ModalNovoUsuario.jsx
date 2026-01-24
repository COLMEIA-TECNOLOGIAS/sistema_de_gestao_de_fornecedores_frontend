import { X, UserPlus, Eye, EyeOff, Edit, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { usersAPI } from "../../services/api";

export default function ModalNovoUsuario({ isOpen, onClose, onSuccess, userToEdit }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "",
        is_active: true,
    });

    useEffect(() => {
        if (isOpen && userToEdit) {
            setFormData({
                name: userToEdit.name || "",
                email: userToEdit.email || "",
                password: "", // Password empty on edit means "don't change"
                role: userToEdit.role || "",
                is_active: userToEdit.is_active !== false,
            });
        } else if (isOpen) {
            setFormData({
                name: "",
                email: "",
                password: "",
                role: "",
                is_active: true,
            });
        }
        setError("");
    }, [isOpen, userToEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            if (userToEdit) {
                // Remove password if empty so it doesn't try to update it
                const dataToUpdate = { ...formData };
                if (!dataToUpdate.password) delete dataToUpdate.password;

                await usersAPI.update(userToEdit.id, dataToUpdate);
            } else {
                await usersAPI.create(formData);
            }

            // Reset form
            setFormData({
                name: "",
                email: "",
                password: "",
                role: "",
                is_active: true,
            });
            onSuccess?.();
        } catch (err) {
            console.error("Error saving user:", err);
            setError(
                err.response?.data?.message ||
                "Erro ao salvar usuário. Verifique os dados e tente novamente."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#44B16F]/10 rounded-lg">
                            {userToEdit ? <Edit className="w-5 h-5 text-[#44B16F]" /> : <UserPlus className="w-5 h-5 text-[#44B16F]" />}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{userToEdit ? "Editar Usuário" : "Adicionar Novo Usuário"}</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Row 1: Nome Completo e Email */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nome Completo *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Digite o nome completo"
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent transition-all disabled:bg-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="email@exemplo.com"
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent transition-all disabled:bg-gray-100"
                                />
                            </div>
                        </div>

                        {/* Row 2: Senha e Função */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {userToEdit ? "Senha (opcional)" : "Senha *"}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder={userToEdit ? "Deixe em branco para manter" : "Mínimo 6 caracteres"}
                                        required={!userToEdit}
                                        minLength={!userToEdit ? 6 : undefined}
                                        disabled={isLoading}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent transition-all pr-12 disabled:bg-gray-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Função *
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent transition-all bg-white disabled:bg-gray-100"
                                >
                                    <option value="">Selecione a função</option>
                                    <option value="admin">Admin - Acesso total ao sistema</option>
                                    <option value="procurement_technician">Procurement Technician - Gestão de cotações e fornecedores</option>
                                </select>
                                {formData.role && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        {formData.role === 'admin' && '✓ Acesso completo a todas as funcionalidades'}
                                        {formData.role === 'procurement_technician' && '✓ Gestão de fornecedores, cotações e relatórios'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Row 3: Status da Conta */}
                        <div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    className="w-5 h-5 rounded border-gray-300 text-[#44B16F] focus:ring-[#44B16F] disabled:opacity-50"
                                />
                                <span className="text-sm font-medium text-gray-700">Conta ativa</span>
                            </label>
                            <p className="text-xs text-gray-500 mt-1 ml-8">
                                Desmarque para criar a conta como inativa
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2.5 bg-[#44B16F] text-white rounded-lg hover:bg-[#3a9d5f] transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    {userToEdit ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                    {userToEdit ? "Salvar Alterações" : "Criar Usuário"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
