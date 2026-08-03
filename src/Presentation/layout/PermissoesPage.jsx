import React, { useState, useEffect, useRef } from 'react';
import { Shield, Search, Loader2, Save, AlertCircle, RefreshCw, Eye, Pencil } from 'lucide-react';
import { usersAPI, permissionsAPI, menusAPI } from '../../services/api';
import Toast from '../Components/Toast';

const MENU_TRANSLATIONS = {
    dashboard: 'Painel de Controlo',
    suppliers: 'Fornecedores',
    'quotation-requests': 'Pedidos de Cotação',
    users: 'Utilizadores',
    relatorios: 'Relatórios',
    acquisitions: 'Aquisições',
    configuracoes: 'Configurações',
    categories: 'Categorias',
    products: 'Produtos',
    'supplier-evaluations': 'Avaliações',
    documents: 'Documentos',
    notifications: 'Notificações',
    'audit-logs': 'Registo de Eventos',
    'deletion-requests': 'Pedidos de Exclusão',
};

const translateMenu = (menu) => {
    const slug = (menu.slug || menu.name || '').toLowerCase();
    return MENU_TRANSLATIONS[slug] || menu.name || menu.slug || slug;
};

export default function PermissoesPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userPermissions, setUserPermissions] = useState([]);
    const [originalPermissions, setOriginalPermissions] = useState([]);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const systemMenusRef = useRef([]);
    const [systemMenus, setSystemMenus] = useState([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [usersData, menusData] = await Promise.all([
                usersAPI.getAll(),
                menusAPI.getAll().catch(() => [])
            ]);

            const usersList = Array.isArray(usersData) ? usersData : (usersData.data || []);
            const nonAdmins = usersList.filter(u =>
                (u.role || '').toLowerCase() !== 'admin'
            );
            setUsers(nonAdmins);

            const rawMenus = Array.isArray(menusData) ? menusData : (menusData.data || []);
            const menuMap = {};
            rawMenus.forEach(m => { menuMap[m.id] = { ...m, children: [] }; });
            const menuTree = [];
            rawMenus.forEach(m => {
                if (m.parent_id && menuMap[m.parent_id]) {
                    menuMap[m.parent_id].children.push(menuMap[m.id]);
                } else {
                    menuTree.push(menuMap[m.id]);
                }
            });

            systemMenusRef.current = menuTree;
            setSystemMenus(menuTree);

        } catch (error) {
            console.error('Error fetching initial data:', error);
            showToast('error', 'Erro ao carregar dados iniciais.');
        } finally {
            setIsLoading(false);
        }
    };

    const showToast = (type, message) => {
        setToast({ type, message });
    };

    const handleSelectUser = async (user) => {
        setSelectedUser(user);
        setIsLoadingPermissions(true);

        let menus = systemMenusRef.current;
        if (!menus || menus.length === 0) {
            try {
                const menusData = await menusAPI.getAll();
                const rawMenus = Array.isArray(menusData) ? menusData : (menusData.data || []);
                const menuMap = {};
                rawMenus.forEach(m => { menuMap[m.id] = { ...m, children: [] }; });
                const menuTree = [];
                rawMenus.forEach(m => {
                    if (m.parent_id && menuMap[m.parent_id]) {
                        menuMap[m.parent_id].children.push(menuMap[m.id]);
                    } else {
                        menuTree.push(menuMap[m.id]);
                    }
                });
                systemMenusRef.current = menuTree;
                setSystemMenus(menuTree);
                menus = menuTree;
            } catch (e) {
                console.error('Erro ao recarregar menus:', e);
            }
        }

        try {
            const apiData = await permissionsAPI.getUserPermissions(user.id);
            let rawPerms = apiData?.data || apiData || [];

            if (rawPerms && !Array.isArray(rawPerms) && Array.isArray(rawPerms.permissions)) {
                rawPerms = rawPerms.permissions;
            }

            const permsList = Array.isArray(rawPerms) ? rawPerms : [];

            const permByMenuId = {};
            permsList.forEach(p => {
                const id = p.menu_id ?? p.id;
                if (id != null) permByMenuId[String(id)] = p;
            });

            const buildItem = (menu) => {
                const perm = permByMenuId[String(menu.id)] || null;
                const hasAccess = perm !== null;
                const level = perm?.level || 'read';

                return {
                    menu_id: menu.id,
                    slug: menu.slug || menu.name,
                    label: translateMenu(menu),
                    icon: menu.icon,
                    access: hasAccess,
                    level: hasAccess ? level : 'read',
                    children: (menu.children || []).map(child => {
                        const cPerm = permByMenuId[String(child.id)] || null;
                        const cHasAccess = cPerm !== null;
                        const cLevel = cPerm?.level || 'read';
                        return {
                            menu_id: child.id,
                            slug: child.slug || child.name,
                            label: translateMenu(child),
                            icon: child.icon,
                            access: cHasAccess,
                            level: cHasAccess ? cLevel : 'read',
                            children: [],
                        };
                    }),
                };
            };

            const mapped = menus.map(buildItem);
            setUserPermissions(mapped);
            setOriginalPermissions(JSON.parse(JSON.stringify(mapped)));

        } catch (error) {
            console.error('Erro ao carregar permissões:', error);
            const status = error.response?.status;
            if (status === 403) {
                showToast('error', 'Sem permissão para ver as permissões deste utilizador.');
            } else {
                showToast('error', 'Erro ao carregar permissões deste utilizador.');
            }
            setUserPermissions([]);
            setOriginalPermissions([]);
        } finally {
            setIsLoadingPermissions(false);
        }
    };

    const handleReadToggle = (index) => {
        setUserPermissions(prev => {
            const updated = [...prev];
            const perm = updated[index];
            if (perm.access) {
                updated[index] = { ...perm, access: false, level: 'read' };
            } else {
                updated[index] = { ...perm, access: true, level: 'read' };
            }
            return updated;
        });
    };

    const handleWriteToggle = (index) => {
        setUserPermissions(prev => {
            const updated = [...prev];
            const perm = updated[index];
            if (perm.access && perm.level === 'write') {
                updated[index] = { ...perm, access: true, level: 'read' };
            } else {
                updated[index] = { ...perm, access: true, level: 'write' };
            }
            return updated;
        });
    };

    const handleChildReadToggle = (parentIndex, childIndex) => {
        setUserPermissions(prev => {
            const updated = [...prev];
            const children = [...updated[parentIndex].children];
            const child = children[childIndex];
            if (child.access) {
                children[childIndex] = { ...child, access: false, level: 'read' };
            } else {
                children[childIndex] = { ...child, access: true, level: 'read' };
            }
            updated[parentIndex] = { ...updated[parentIndex], children };
            return updated;
        });
    };

    const handleChildWriteToggle = (parentIndex, childIndex) => {
        setUserPermissions(prev => {
            const updated = [...prev];
            const children = [...updated[parentIndex].children];
            const child = children[childIndex];
            if (child.access && child.level === 'write') {
                children[childIndex] = { ...child, access: true, level: 'read' };
            } else {
                children[childIndex] = { ...child, access: true, level: 'write' };
            }
            updated[parentIndex] = { ...updated[parentIndex], children };
            return updated;
        });
    };

    const hasChanges = () =>
        JSON.stringify(userPermissions) !== JSON.stringify(originalPermissions);

    const handleSavePermissions = async () => {
        if (!selectedUser) return;
        setIsSaving(true);

        try {
            const permissions = [];

            userPermissions.forEach(perm => {
                if (perm.access) {
                    permissions.push({ menu_id: perm.menu_id, level: perm.level });
                }
                (perm.children || []).forEach(child => {
                    if (child.access) {
                        permissions.push({ menu_id: child.menu_id, level: child.level });
                    }
                });
            });

            await permissionsAPI.updateUserPermissions(selectedUser.id, { permissions });
            showToast('success', `Permissões de ${selectedUser.name} actualizadas com sucesso!`);
            setOriginalPermissions(JSON.parse(JSON.stringify(userPermissions)));

        } catch (error) {
            console.error('Erro ao gravar permissões:', error);
            const status = error.response?.status;
            if (status === 403) {
                showToast('error', 'Sem permissão para alterar as permissões deste utilizador.');
            } else {
                const msg = error.response?.data?.message || 'Ocorreu um erro ao gravar as permissões.';
                showToast('error', msg);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleLabel = (role) => {
        const roles = {
            admin: 'Administrador',
            procurement_technician: 'Técnico de Procurement',
            manager: 'Gestor',
            viewer: 'Visualizador',
        };
        return roles[(role || '').toLowerCase()] || role || 'N/A';
    };

    return (
        <div className="flex gap-6 h-[calc(100vh-120px)]">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <div className="w-1/3 rounded-2xl shadow-sm flex flex-col overflow-hidden"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                <div className="p-4" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        <Shield size={18} className="text-[#44B16F]" />
                        Selecione um Utilizador
                    </h3>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                            style={{ color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Procurar utilizador..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="input-field w-full"
                            style={{ paddingLeft: '36px' }}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-sm"
                            style={{ color: 'var(--color-text-secondary)' }}>
                            Nenhum utilizador encontrado.
                        </div>
                    ) : (
                        filteredUsers.map(user => (
                            <button
                                key={user.id}
                                onClick={() => handleSelectUser(user)}
                                className="w-full text-left p-3 rounded-xl transition-all"
                                style={{
                                    background: selectedUser?.id === user.id ? 'rgba(68,177,111,0.1)' : 'transparent',
                                    border: selectedUser?.id === user.id ? '1px solid rgba(68,177,111,0.3)' : '1px solid transparent',
                                }}
                                onMouseEnter={e => { if (selectedUser?.id !== user.id) e.currentTarget.style.background = 'var(--color-bg)'; }}
                                onMouseLeave={e => { if (selectedUser?.id !== user.id) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                    {user.name}
                                </div>
                                <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                    {user.email}
                                </div>
                                <div className="mt-2 inline-flex items-center gap-1.5">
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                                        style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-light)' }}>
                                        {getRoleLabel(user.role)}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="flex-1 rounded-2xl shadow-sm flex flex-col overflow-hidden"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                {selectedUser ? (
                    <>
                        <div className="p-6 flex items-center justify-between"
                            style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                            <div>
                                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                    Permissões de Acesso
                                </h2>
                                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                    A configurar acessos para{' '}
                                    <strong style={{ color: 'var(--color-text-primary)' }}>{selectedUser.name}</strong>
                                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                                        style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
                                        {getRoleLabel(selectedUser.role)}
                                    </span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleSelectUser(selectedUser)}
                                    className="p-2.5 rounded-xl transition-all"
                                    style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-light)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    title="Recarregar permissões"
                                >
                                    <RefreshCw size={16} />
                                </button>
                                <button
                                    onClick={handleSavePermissions}
                                    disabled={isSaving || !hasChanges()}
                                    className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        background: hasChanges() ? '#44B16F' : 'var(--color-text-muted)',
                                        boxShadow: hasChanges() ? '0 2px 8px rgba(68,177,111,0.3)' : 'none',
                                    }}
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Guardar Alterações
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--color-bg)' }}>
                            {isLoadingPermissions ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Loader2 size={32} className="animate-spin mb-3" style={{ color: '#44B16F' }} />
                                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                        A carregar permissões...
                                    </p>
                                </div>
                            ) : userPermissions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                                        style={{ background: 'rgba(245,158,11,0.1)' }}>
                                        <AlertCircle size={32} style={{ color: '#F59E0B' }} />
                                    </div>
                                    <h4 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                                        Nenhum menu disponível
                                    </h4>
                                    <p className="text-sm text-center max-w-sm"
                                        style={{ color: 'var(--color-text-secondary)' }}>
                                        Não foi possível carregar os menus do sistema.
                                        Verifique a sua ligação ou as configurações do sistema.
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-xl overflow-hidden shadow-sm"
                                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                                    <table className="w-full text-sm text-left">
                                        <thead style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border-light)' }}>
                                            <tr>
                                                <th className="px-6 py-4 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                                                    Módulo do Sistema
                                                </th>
                                                <th className="px-6 py-4 text-center font-semibold w-28" style={{ color: 'var(--color-text-secondary)' }}>
                                                    <span className="flex items-center justify-center gap-1.5">
                                                        <Eye size={14} />
                                                        Ler
                                                    </span>
                                                </th>
                                                <th className="px-6 py-4 text-center font-semibold w-28" style={{ color: 'var(--color-text-secondary)' }}>
                                                    <span className="flex items-center justify-center gap-1.5">
                                                        <Pencil size={14} />
                                                        Escrever
                                                    </span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {userPermissions.map((perm, index) => (
                                                <React.Fragment key={`menu-${perm.menu_id}-${index}`}>
                                                    <tr
                                                        style={{ borderBottom: '1px solid var(--color-border-light)', transition: 'background 0.15s' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <td className="px-6 py-4 font-semibold flex items-center gap-2"
                                                            style={{ color: 'var(--color-text-primary)' }}>
                                                            {perm.label}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <Checkbox
                                                                checked={perm.access}
                                                                onChange={() => handleReadToggle(index)}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <Checkbox
                                                                checked={perm.access && perm.level === 'write'}
                                                                disabled={!perm.access}
                                                                onChange={() => handleWriteToggle(index)}
                                                            />
                                                        </td>
                                                    </tr>

                                                    {perm.children && perm.children.map((child, childIndex) => (
                                                        <tr key={`child-${child.menu_id}-${childIndex}`}
                                                            style={{
                                                                borderBottom: '1px solid var(--color-border-light)',
                                                                background: 'rgba(0,0,0,0.02)',
                                                                transition: 'background 0.15s',
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                                                        >
                                                            <td className="px-6 py-3 pl-12 text-sm"
                                                                style={{ color: 'var(--color-text-secondary)' }}>
                                                                <span className="flex items-center gap-2">
                                                                    <span style={{ color: 'var(--color-border)' }}>└</span>
                                                                    {child.label || child.slug}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3 text-center">
                                                                <Checkbox
                                                                    checked={child.access}
                                                                    disabled={!perm.access}
                                                                    onChange={() => handleChildReadToggle(index, childIndex)}
                                                                    small
                                                                />
                                                            </td>
                                                            <td className="px-6 py-3 text-center">
                                                                <Checkbox
                                                                    checked={child.access && child.level === 'write'}
                                                                    disabled={!perm.access || !child.access}
                                                                    onChange={() => handleChildWriteToggle(index, childIndex)}
                                                                    small
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                            style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
                            <Shield size={32} />
                        </div>
                        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                            Nenhum utilizador selecionado
                        </h3>
                        <p className="text-sm mt-2 max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            Selecione um utilizador na lista à esquerda para configurar as suas permissões de acesso ao sistema.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function Checkbox({ checked, onChange, disabled = false, small = false }) {
    const size = small ? 'w-4 h-4' : 'w-5 h-5';
    const iconSize = small ? 10 : 12;

    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange()}
            className={`${size} rounded flex items-center justify-center transition-all duration-150 focus:outline-none mx-auto ${
                disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:border-[#44B16F]'
            }`}
            style={{
                border: `2px solid ${checked ? '#44B16F' : 'var(--color-border)'}`,
                background: checked ? '#44B16F' : 'transparent',
            }}
        >
            {checked && (
                <svg width={iconSize} height={iconSize} viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </button>
    );
}
