import React, { useState, useEffect } from 'react';
import { Settings, Plus, List, Loader2, Save, X, Edit, Trash2 } from 'lucide-react';
import { menusAPI } from '../../services/api';

export default function ConfiguracoesPage() {
    const [menus, setMenus] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        parent_id: 0,
        description: '',
        icon: '',
        order: 0,
        is_active: true
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    useEffect(() => {
        fetchMenus();
    }, []);

    const fetchMenus = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await menusAPI.getAll();
            setMenus(data?.data || data || []);
        } catch (err) {
            console.error('Error fetching menus:', err);
            setError('Erro ao carregar menus do sistema.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setError(null);
        setSuccessMsg(null);
        try {
            await menusAPI.create(formData);
            setSuccessMsg('Menu criado com sucesso!');
            setIsCreating(false);
            setFormData({
                name: '',
                slug: '',
                parent_id: 0,
                description: '',
                icon: '',
                order: 0,
                is_active: true
            });
            fetchMenus();
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err) {
            console.error('Error creating menu:', err);
            setError('Erro ao criar o menu. Verifique os dados e tente novamente.');
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-[#44B16F]">
                        <Settings size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Configurações e Menus</h1>
                        <p className="text-sm text-gray-500">Faça a gestão dos menus e configurações do sistema</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 bg-[#44B16F] hover:bg-[#3A9E61] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    {isCreating ? <List size={18} /> : <Plus size={18} />}
                    {isCreating ? 'Listar Menus' : 'Criar Novo Menu'}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><X size={16} /></button>
                </div>
            )}
            
            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
                    <span>{successMsg}</span>
                    <button onClick={() => setSuccessMsg(null)}><X size={16} /></button>
                </div>
            )}

            {isCreating ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Plus size={18} className="text-[#44B16F]" />
                        Adicionar Novo Menu
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Menu *</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all"
                                    placeholder="Ex: Relatórios"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (Identificador) *</label>
                                <input
                                    type="text"
                                    name="slug"
                                    required
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all"
                                    placeholder="Ex: reports"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID do Parente (Parent ID)</label>
                                <input
                                    type="number"
                                    name="parent_id"
                                    value={formData.parent_id}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ordem (Order)</label>
                                <input
                                    type="number"
                                    name="order"
                                    value={formData.order}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ícone</label>
                                <input
                                    type="text"
                                    name="icon"
                                    value={formData.icon}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all"
                                    placeholder="Nome do ícone (Ex: BarChart3, Settings)"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all"
                                    placeholder="Descrição opcional..."
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-[#44B16F] bg-gray-100 border-gray-300 rounded focus:ring-[#44B16F]"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Menu está Ativo?</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="mr-3 px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={submitLoading}
                                className="flex items-center gap-2 bg-[#44B16F] hover:bg-[#3A9E61] text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {submitLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {submitLoading ? 'A Guardar...' : 'Salvar Menu'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <List size={18} className="text-gray-500" />
                            Menus do Sistema
                        </h2>
                    </div>
                    {isLoading ? (
                        <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                            <Loader2 size={32} className="animate-spin mb-3 text-[#44B16F]" />
                            <p>A carregar menus...</p>
                        </div>
                    ) : menus.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-700 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Nome</th>
                                        <th className="px-6 py-4">Slug</th>
                                        <th className="px-6 py-4">Ordem</th>
                                        <th className="px-6 py-4 text-center">Estado</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {menus.map((menu) => (
                                        <tr key={menu.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{menu.name}</td>
                                            <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600">{menu.slug}</span></td>
                                            <td className="px-6 py-4">{menu.order}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${menu.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {menu.is_active ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" title="Editar (Em breve)">
                                                    <Edit size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                            <List size={40} className="mb-3 opacity-20" />
                            <p>Nenhum menu encontrado no sistema.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
