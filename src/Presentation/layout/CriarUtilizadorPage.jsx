import { useState, useEffect, useRef } from 'react';
import { User, Mail, Shield, UserPlus } from 'lucide-react';
import { usersAPI } from '../../services/api';
import { ROLES } from '../../utils/permissions';
import { useNavigate } from 'react-router-dom';
import { useInvalidate } from '../../hooks/queries';
import { queryKeys } from '../../lib/queryKeys';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage, getFieldErrors } from '../../utils/apiHelpers';

function FieldError({ message }) {
    if (!message) return null;
    return <p className="text-xs text-red-600">{message}</p>;
}

export default function CriarUtilizadorPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const invalidate = useInvalidate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: ROLES.PROCUREMENT_TECHNICIAN,
        is_active: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const redirectTimerRef = useRef(null);

    // Cancela o redireccionamento pendente se o utilizador sair da página antes
    useEffect(() => () => clearTimeout(redirectTimerRef.current), []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || success) return;
        setIsSubmitting(true);
        setFieldErrors({});

        try {
            const payload = { ...formData, name: formData.name.trim(), email: formData.email.trim() };
            const resp = await usersAPI.create(payload);
            invalidate(queryKeys.users.all);
            toast.success(
                resp?.message || `Utilizador criado. Foi enviado um link para ${payload.email} para o utilizador definir a sua senha.`
            );
            setSuccess(true);
            setFormData({ name: '', email: '', role: ROLES.PROCUREMENT_TECHNICIAN, is_active: true });
            redirectTimerRef.current = setTimeout(() => {
                navigate('/usuarios');
            }, 1500);
        } catch (err) {
            setFieldErrors(getFieldErrors(err));
            toast.error(getErrorMessage(err, "Ocorreu um erro ao criar o utilizador. Verifique os dados e tente novamente."));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <UserPlus className="text-[#44B16F]" size={28} />
                    Criar Novo Utilizador
                </h2>
                <p className="text-gray-500 mt-2">
                    Preencha os dados abaixo para registar um novo utilizador no sistema. Será enviado um link
                    para o email do utilizador para ele activar a conta e definir a sua própria senha.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nome */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Nome Completo</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all outline-none"
                                placeholder="Ex: João Silva"
                            />
                        </div>
                        <FieldError message={fieldErrors.name} />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all outline-none"
                                placeholder="joao.silva@exemplo.com"
                            />
                        </div>
                        <FieldError message={fieldErrors.email} />
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Função Base</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Shield size={18} className="text-gray-400" />
                            </div>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all outline-none appearance-none"
                            >
                                <option value={ROLES.PROCUREMENT_TECHNICIAN}>Técnico de Procurement</option>
                                <option value={ROLES.ADMIN}>Administrador</option>
                            </select>
                        </div>
                        <FieldError message={fieldErrors.role} />
                        <p className="text-xs text-gray-500 mt-1">
                            Poderá configurar acessos específicos na Gestão de Permissões.
                        </p>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/usuarios')}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || success}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-[#44B16F] hover:bg-[#3A9E62] rounded-xl transition-all shadow-sm shadow-[#44B16F]/30 disabled:opacity-70 flex items-center gap-2"
                    >
                        {isSubmitting ? 'A criar...' : success ? 'A redireccionar...' : 'Criar Utilizador'}
                    </button>
                </div>
            </form>
        </div>
    );
}