import React, { useState } from 'react';
import { User, Mail, Lock, Shield, UserPlus, Eye, EyeOff } from 'lucide-react';
import { usersAPI } from '../../services/api';
import { ROLES } from '../../utils/permissions';
import { useNavigate } from 'react-router-dom';

export default function CriarUtilizadorPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: ROLES.PROCUREMENT_TECHNICIAN,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            await usersAPI.create(formData);
            setSuccess(true);
            setFormData({ name: '', email: '', password: '', role: ROLES.PROCUREMENT_TECHNICIAN });
            setTimeout(() => {
                navigate('/usuarios');
            }, 1500);
        } catch (err) {
            console.error("Error creating user:", err);
            setError("Ocorreu um erro ao criar o utilizador. Verifique os dados e tente novamente.");
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
                    Preencha os dados abaixo para registar um novo utilizador no sistema.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm font-medium">
                    Utilizador criado com sucesso! Redirecionando...
                </div>
            )}

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
                    </div>

                    {/* Senha */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Palavra-passe</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-gray-400" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all outline-none"
                                placeholder="Mínimo 6 caracteres"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
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
                        <p className="text-xs text-gray-500 mt-1">
                            Poderá configurar acessos específicos na Gestão de Permissões.
                        </p>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/usuarios')}
                        className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-[#44B16F] hover:bg-[#3A9E62] rounded-xl transition-all shadow-sm shadow-[#44B16F]/30 disabled:opacity-70 flex items-center gap-2"
                    >
                        {isSubmitting ? 'A criar...' : 'Criar Utilizador'}
                    </button>
                </div>
            </form>
        </div>
    );
}
