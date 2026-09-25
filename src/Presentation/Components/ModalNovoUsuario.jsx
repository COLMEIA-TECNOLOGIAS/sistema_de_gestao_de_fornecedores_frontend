import { useModalLock } from '../../hooks/useModalLock';
import { X, UserPlus, Edit, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usersAPI } from "../../services/api";
import { getErrorMessage, getFieldErrors } from "../../utils/apiHelpers";

function FieldError({ message }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export default function ModalNovoUsuario({ isOpen, onClose, onSuccess, userToEdit }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "",
        is_active: true,
    });

    useEffect(() => {
        if (isOpen && userToEdit) {
            setFormData({
                name: userToEdit.name || "",
                email: userToEdit.email || "",
                role: userToEdit.role || "",
                is_active: userToEdit.is_active !== false,
            });
        } else if (isOpen) {
            setFormData({
                name: "",
                email: "",
                role: "",
                is_active: true,
            });
        }
        setError("");
        setFieldErrors({});
    }, [isOpen, userToEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return;
        setError("");
        setFieldErrors({});
        setIsLoading(true);

        const payload = { ...formData, name: formData.name.trim(), email: formData.email.trim() };

        try {
            if (userToEdit) {
                const resp = await usersAPI.update(userToEdit.id, payload);
                onSuccess?.({
                    message: resp?.message || "Utilizador actualizado com sucesso.",
                });
                return;
            }

            // Criação: o utilizador activa a conta e define a senha através do email recebido
            const resp = await usersAPI.create(payload);
            onSuccess?.({
                message: resp?.message || `Utilizador criado. Foi enviado um link para ${payload.email} para o utilizador definir a sua senha.`,
                email: payload.email,
            });
        } catch (err) {
            setFieldErrors(getFieldErrors(err));
            setError(getErrorMessage(err, "Erro ao guardar o utilizador. Verifique os dados e tente novamente."));
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    useModalLock(isOpen);
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#44B16F]/10 rounded-lg">
                            {userToEdit ? <Edit className="w-5 h-5 text-[#44B16F]" /> : <UserPlus className="w-5 h-5 text-[#44B16F]" />}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{userToEdit ? "Editar Utilizador" : "Adicionar Novo Utilizador"}</h2>
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

                        {/* Informativo sobre ativação por email */}
                        {!userToEdit && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-blue-700 text-sm">
                                    Será enviado um link para o email do utilizador para ele activar a conta e definir a sua própria senha.
                                </p>
                            </div>
                        )}

                        {/* Row 1: Nome Completo e Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nome Completo *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Introduza o nome completo"
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F] focus:border-transparent transition-all disabled:bg-gray-100"
                                />
                                <FieldError message={fieldErrors.name} />
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
                                <FieldError message={fieldErrors.email} />
                            </div>
                        </div>

                        {/* Row 2: Função */}
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
                                <option value="procurement_technician">Técnico de Procurement - Gestão de cotações e fornecedores</option>
                                {formData.role && !['admin', 'procurement_technician'].includes(formData.role) && (
                                    <option value={formData.role}>{formData.role}</option>
                                )}
                            </select>
                            <FieldError message={fieldErrors.role} />
                            {formData.role && (
                                <p className="text-xs text-gray-500 mt-2">
                                    {formData.role === 'admin' && '✓ Acesso completo a todas as funcionalidades'}
                                    {formData.role === 'procurement_technician' && '✓ Gestão de fornecedores, cotações e relatórios'}
                                </p>
                            )}
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
                                <span className="text-sm font-medium text-gray-700">Conta activa</span>
                            </label>
                            <p className="text-xs text-gray-500 mt-1 ml-8">
                                {userToEdit ? "Desmarque para desactivar a conta" : "Desmarque para criar a conta como inactiva"}
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
                                    A guardar...
                                </>
                            ) : (
                                <>
                                    {userToEdit ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                    {userToEdit ? "Guardar Alterações" : "Criar Utilizador"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}