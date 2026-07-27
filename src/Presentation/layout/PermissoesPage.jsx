import React, { useState, useEffect } from 'react';
import { Shield, Search, Loader2, Save } from 'lucide-react';
import { usersAPI } from '../../services/api';
import { PERMISSIONS } from '../../utils/permissions';

export default function PermissoesPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userPermissions, setUserPermissions] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // List of configurable modules
    const modules = [
        { id: PERMISSIONS.DASHBOARD, label: "Dashboard" },
        { id: PERMISSIONS.FORNECEDORES, label: "Fornecedores" },
        { id: PERMISSIONS.AQUISICOES, label: "Aquisições" },
        { id: PERMISSIONS.COTACOES, label: "Cotações" },
        { id: PERMISSIONS.PRODUTOS, label: "Produtos" },
        { id: PERMISSIONS.RELATORIOS, label: "Relatórios" },
        { id: PERMISSIONS.USUARIOS, label: "Utilizadores (Acesso Admin)" },
        { id: PERMISSIONS.CONFIGURACOES, label: "Configurações" }
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await usersAPI.getAll();
            const list = Array.isArray(data) ? data : (data.data || []);
            setUsers(list);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setSuccessMessage('');
        
        // Simular leitura das permissões granulares do usuário.
        // Se a API suportar, aqui leríamos user.permissions.
        // Como fallback para o mock actual, preenchemos com base num dicionário ou criamos vazio
        const initialPerms = {};
        modules.forEach(mod => {
            // Defaulting based on role if no explicit permissions exist (mock logic)
            const hasAccess = user.role === 'admin' || (user.role === 'procurement_technician' && !['usuarios', 'configuracoes'].includes(mod.id));
            
            // Assume if it has access, it is 'write' except for maybe some modules
            initialPerms[mod.id] = {
                access: hasAccess,
                level: hasAccess ? 'write' : 'read' // 'read' or 'write'
            };
        });
        
        // Em caso de a API ter user.permissions
        if (user.permissions) {
            Object.assign(initialPerms, user.permissions);
        }

        setUserPermissions(initialPerms);
    };

    const handlePermissionChange = (moduleId, field, value) => {
        setUserPermissions(prev => ({
            ...prev,
            [moduleId]: {
                ...prev[moduleId],
                [field]: value
            }
        }));
    };

    const handleSavePermissions = async () => {
        if (!selectedUser) return;
        setIsSaving(true);
        setSuccessMessage('');
        
        try {
            // Aqui enviamos as permissões granulares para a API (Mock do comportamento)
            // Se o backend tiver um endpoint para isso: await api.put(`/users/${selectedUser.id}/permissions`, userPermissions)
            // Ou atualizamos o user inteiro com as novas permissions.
            const updatedData = {
                ...selectedUser,
                permissions: userPermissions
            };
            
            // await usersAPI.update(selectedUser.id, updatedData); // A API deve permitir receber este objeto
            
            // Simulate API delay
            await new Promise(r => setTimeout(r, 800));
            setSuccessMessage(`Permissões de ${selectedUser.name} atualizadas com sucesso!`);
        } catch (error) {
            console.error("Erro ao gravar permissões", error);
            alert("Ocorreu um erro ao gravar as permissões.");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = users.filter(u => 
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex gap-6 h-[calc(100vh-120px)]">
            {/* Lista de Utilizadores (Sidebar interna) */}
            <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Shield size={18} className="text-[#44B16F]" />
                        Selecione um Utilizador
                    </h3>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Procurar utilizador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[#44B16F]/20 focus:border-[#44B16F] transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-gray-400" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">Nenhum utilizador encontrado.</div>
                    ) : (
                        filteredUsers.map(user => (
                            <button
                                key={user.id}
                                onClick={() => handleSelectUser(user)}
                                className={`w-full text-left p-3 rounded-xl transition-all ${
                                    selectedUser?.id === user.id 
                                    ? 'bg-[#44B16F]/10 border-[#44B16F]/20 border' 
                                    : 'hover:bg-gray-50 border border-transparent'
                                }`}
                            >
                                <div className="font-semibold text-sm text-gray-800">{user.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                                <div className="mt-2 inline-block px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-medium text-gray-600">
                                    {user.role}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Painel de Permissões */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                {selectedUser ? (
                    <>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Permissões de Acesso</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    A configurar acessos para <strong className="text-gray-700">{selectedUser.name}</strong>
                                </p>
                            </div>
                            <button
                                onClick={handleSavePermissions}
                                disabled={isSaving}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#44B16F] hover:bg-[#3A9E62] rounded-xl transition-all shadow-sm shadow-[#44B16F]/30 flex items-center gap-2 disabled:opacity-70"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Guardar Alterações
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                            {successMessage && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm font-medium">
                                    {successMessage}
                                </div>
                            )}

                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Módulo do Sistema</th>
                                            <th className="px-6 py-4 text-center">Permitir Acesso</th>
                                            <th className="px-6 py-4">Nível de Permissão</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {modules.map((mod) => {
                                            const perm = userPermissions[mod.id] || { access: false, level: 'read' };
                                            return (
                                                <tr key={mod.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-800">
                                                        {mod.label}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                className="sr-only peer" 
                                                                checked={perm.access}
                                                                onChange={(e) => handlePermissionChange(mod.id, 'access', e.target.checked)}
                                                            />
                                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#44B16F]"></div>
                                                        </label>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            disabled={!perm.access}
                                                            value={perm.level}
                                                            onChange={(e) => handlePermissionChange(mod.id, 'level', e.target.value)}
                                                            className="bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-lg focus:ring-[#44B16F] focus:border-[#44B16F] block w-full p-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <option value="read">Leitura (Apenas ver)</option>
                                                            <option value="write">Escrita (Ver, Criar e Editar)</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
                            <Shield size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Nenhum utilizador selecionado</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-sm">
                            Selecione um utilizador na lista à esquerda para configurar as suas permissões de acesso ao sistema.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
