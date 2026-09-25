import { Fragment, useEffect, useMemo, useState } from 'react';
import { Shield, Loader2, Save, AlertCircle, RefreshCw, Eye, Pencil, UserX } from 'lucide-react';
import { permissionsAPI } from '../../services/api';
import SearchInput from '../Components/ui/SearchInput';
import RefreshButton from '../Components/ui/RefreshButton';
import FilterChips from '../Components/ui/FilterChips';
import { EmptyState, ErrorState, StaleDataBanner } from '../Components/ui/StateViews';
import { useUsers, useUserPermissions, useMenus, useInvalidate } from '../../hooks/queries';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { queryKeys } from '../../lib/queryKeys';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage, matchesSearch } from '../../utils/apiHelpers';

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

// Converte a lista plana de menus da API numa árvore (pai -> filhos)
const buildMenuTree = (rawMenus) => {
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
    return menuTree;
};

// Normaliza a resposta de permissões da API para uma lista
const toPermissionList = (apiData) => {
    let rawPerms = apiData?.data || apiData || [];
    if (rawPerms && !Array.isArray(rawPerms) && Array.isArray(rawPerms.permissions)) {
        rawPerms = rawPerms.permissions;
    }
    return Array.isArray(rawPerms) ? rawPerms : [];
};

// Cruza a árvore de menus com as permissões do utilizador
const buildPermissionItems = (menuTree, apiData) => {
    const permByMenuId = {};
    toPermissionList(apiData).forEach(p => {
        const id = p.menu_id ?? p.id;
        if (id != null) permByMenuId[String(id)] = p;
    });

    const buildItem = (menu, withChildren) => {
        const perm = permByMenuId[String(menu.id)] || null;
        const hasAccess = perm !== null;
        return {
            menu_id: menu.id,
            slug: menu.slug || menu.name,
            label: translateMenu(menu),
            icon: menu.icon,
            access: hasAccess,
            level: hasAccess ? (perm.level || 'read') : 'read',
            children: withChildren ? (menu.children || []).map(child => buildItem(child, false)) : [],
        };
    };

    return menuTree.map(menu => buildItem(menu, true));
};

const ROLE_LABELS = {
    admin: 'Administrador',
    procurement_technician: 'Técnico de Procurement',
    manager: 'Gestor',
    viewer: 'Visualizador',
};
const getRoleLabel = (role) => ROLE_LABELS[(role || '').toLowerCase()] || role || 'N/A';

const FILTER_DEFAULTS = { q: '', funcao: '', utilizador: '' };

const selectClass = "w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#44B16F]";
const selectStyle = { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' };

export default function PermissoesPage() {
    const toast = useToast();
    const confirm = useConfirm();
    const invalidate = useInvalidate();
    const { user: currentUser, refreshPermissions } = useAuth();

    const { filters, setFilter, setFilters, countActive } = useUrlFilters(FILTER_DEFAULTS);
    const selectedId = filters.utilizador;

    const usersQuery = useUsers();
    const menusQuery = useMenus();
    const permsQuery = useUserPermissions(selectedId || null);

    // Edições locais ainda não guardadas (associadas ao utilizador a que pertencem)
    const [draft, setDraft] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const allUsers = usersQuery.data;
    const users = useMemo(
        () => (allUsers || []).filter(u => (u.role || '').toLowerCase() !== 'admin'),
        [allUsers]
    );
    const roleOptions = useMemo(
        () => [...new Set(users.map(u => u.role).filter(Boolean))].sort(),
        [users]
    );
    const filteredUsers = useMemo(() => users.filter(u => {
        if (!matchesSearch(filters.q, u.name, u.email, getRoleLabel(u.role))) return false;
        if (filters.funcao && u.role !== filters.funcao) return false;
        return true;
    }), [users, filters.q, filters.funcao]);

    const selectedUser = useMemo(
        () => (selectedId ? users.find(u => String(u.id) === selectedId) || null : null),
        [users, selectedId]
    );

    const menusData = menusQuery.data;
    const menuTree = useMemo(() => buildMenuTree(menusData || []), [menusData]);
    const permsData = permsQuery.data;
    const originalPermissions = useMemo(
        () => (permsData !== undefined ? buildPermissionItems(menuTree, permsData) : []),
        [menuTree, permsData]
    );

    const hasDraft = !!draft && draft.userId === selectedId;
    const userPermissions = hasDraft ? draft.perms : originalPermissions;
    const isDirty = hasDraft && JSON.stringify(draft.perms) !== JSON.stringify(originalPermissions);

    // Avisar ao fechar/recarregar o separador com alterações por guardar
    useEffect(() => {
        if (!isDirty) return;
        const onBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [isDirty]);

    const confirmDiscard = () => confirm({
        title: 'Alterações por guardar',
        message: selectedUser
            ? `As alterações às permissões de ${selectedUser.name} ainda não foram guardadas. Pretende descartá-las?`
            : 'Existem alterações por guardar. Pretende descartá-las?',
        confirmLabel: 'Descartar alterações',
        cancelLabel: 'Continuar a editar',
        variant: 'danger',
    });

    const handleSelectUser = async (user) => {
        if (isSaving || String(user.id) === selectedId) return;
        if (isDirty && !(await confirmDiscard())) return;
        setDraft(null);
        setFilter('utilizador', String(user.id));
    };

    const handleReloadPermissions = async () => {
        if (isSaving) return;
        if (isDirty && !(await confirmDiscard())) return;
        setDraft(null);
        permsQuery.refetch();
    };

    // Aplica uma alteração às permissões (partindo do rascunho actual ou do original)
    const updatePermissions = (updater) => {
        setDraft(prev => {
            const base = prev && prev.userId === selectedId ? prev.perms : originalPermissions;
            return { userId: selectedId, perms: updater(base) };
        });
    };

    const handleReadToggle = (index) => {
        updatePermissions(prev => {
            const updated = [...prev];
            const perm = updated[index];
            if (perm.access) {
                // Sem acesso ao menu pai, os submenus também deixam de estar acessíveis
                updated[index] = {
                    ...perm,
                    access: false,
                    level: 'read',
                    children: (perm.children || []).map(c => ({ ...c, access: false, level: 'read' })),
                };
            } else {
                updated[index] = { ...perm, access: true, level: 'read' };
            }
            return updated;
        });
    };

    const handleWriteToggle = (index) => {
        updatePermissions(prev => {
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
        updatePermissions(prev => {
            const updated = [...prev];
            const children = [...updated[parentIndex].children];
            const child = children[childIndex];
            children[childIndex] = { ...child, access: !child.access, level: 'read' };
            updated[parentIndex] = { ...updated[parentIndex], children };
            return updated;
        });
    };

    const handleChildWriteToggle = (parentIndex, childIndex) => {
        updatePermissions(prev => {
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

    const handleSavePermissions = async () => {
        if (!selectedUser || isSaving || !isDirty) return;
        setIsSaving(true);

        const savedUser = selectedUser;
        const savedUserId = selectedId;
        const permissions = [];
        userPermissions.forEach(perm => {
            if (!perm.access) return;
            permissions.push({ menu_id: perm.menu_id, level: perm.level });
            (perm.children || []).forEach(child => {
                if (child.access) {
                    permissions.push({ menu_id: child.menu_id, level: child.level });
                }
            });
        });

        try {
            await permissionsAPI.updateUserPermissions(savedUser.id, { permissions });
            toast.success(`Permissões de ${savedUser.name} actualizadas com sucesso!`);

            // Recarregar do servidor antes de descartar o rascunho (evita mostrar valores antigos)
            try {
                await invalidate(queryKeys.users.permissions(savedUserId), queryKeys.users.all);
            } catch {
                // A falha no refresh é mostrada pelo estado da query
            }
            setDraft(prev => (prev && prev.userId === savedUserId ? null : prev));

            // Se o administrador alterou as suas próprias permissões, aplicá-las já à sessão
            if (currentUser && String(currentUser.id) === savedUserId) {
                refreshPermissions();
            }
        } catch (error) {
            toast.error(getErrorMessage(error, 'Ocorreu um erro ao gravar as permissões.'));
        } finally {
            setIsSaving(false);
        }
    };

    const chips = [
        filters.q && { key: 'q', label: `"${filters.q}"`, onRemove: () => setFilter('q', '') },
        filters.funcao && { key: 'funcao', label: `Função: ${getRoleLabel(filters.funcao)}`, onRemove: () => setFilter('funcao', '') },
    ];
    const activeFilterCount = countActive(['utilizador']);
    const clearFilters = () => setFilters({ q: '', funcao: '' });

    const hasUsers = users.length > 0;
    const isLoadingPermissions = !!selectedId && (permsQuery.isLoading || menusQuery.isLoading);
    const permissionsError = permsQuery.isError && permsData === undefined;
    const menusError = menusQuery.isError && !(menusData?.length);

    return (
        <div className="flex gap-6 h-[calc(100vh-120px)]">
            <div className="w-1/3 rounded-2xl shadow-sm flex flex-col overflow-hidden"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                <div className="p-4 space-y-3" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                            <Shield size={18} className="text-[#44B16F]" />
                            Seleccione um Utilizador
                        </h3>
                        <RefreshButton
                            onClick={usersQuery.refetch}
                            isFetching={usersQuery.isFetching}
                            updatedAt={usersQuery.dataUpdatedAt}
                            showLabel={false}
                        />
                    </div>
                    <SearchInput
                        value={filters.q}
                        onChange={(q) => setFilter('q', q)}
                        placeholder="Procurar utilizador..."
                        className="w-full"
                    />
                    {roleOptions.length > 1 && (
                        <select value={filters.funcao} onChange={(e) => setFilter('funcao', e.target.value)} className={selectClass} style={selectStyle} aria-label="Filtrar por função">
                            <option value="">Todas as funções</option>
                            {roleOptions.map((role) => <option key={role} value={role}>{getRoleLabel(role)}</option>)}
                        </select>
                    )}
                    <FilterChips chips={chips} onClearAll={clearFilters} resultCount={activeFilterCount > 0 ? filteredUsers.length : undefined} />
                    {usersQuery.isError && hasUsers && (
                        <StaleDataBanner message="Não foi possível actualizar a lista." onRetry={usersQuery.refetch} isRetrying={usersQuery.isFetching} />
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {usersQuery.isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin" style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                    ) : usersQuery.isError && !hasUsers ? (
                        <ErrorState
                            message={getErrorMessage(usersQuery.error, 'Erro ao carregar utilizadores.')}
                            onRetry={usersQuery.refetch}
                            isRetrying={usersQuery.isFetching}
                        />
                    ) : filteredUsers.length === 0 ? (
                        hasUsers ? (
                            <EmptyState filtered onClearFilters={clearFilters} />
                        ) : (
                            <EmptyState icon={UserX} title="Nenhum utilizador encontrado" description="Não existem utilizadores (não administradores) para configurar." />
                        )
                    ) : (
                        filteredUsers.map(user => {
                            const isSelected = String(user.id) === selectedId;
                            return (
                                <button
                                    key={user.id}
                                    onClick={() => handleSelectUser(user)}
                                    disabled={isSaving && !isSelected}
                                    aria-current={isSelected ? 'true' : undefined}
                                    className="w-full text-left p-3 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    style={{
                                        background: isSelected ? 'rgba(68,177,111,0.1)' : 'transparent',
                                        border: isSelected ? '1px solid rgba(68,177,111,0.3)' : '1px solid transparent',
                                    }}
                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--color-bg)'; }}
                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                        {user.name}
                                        {isSelected && isDirty && (
                                            <span className="ml-2 text-[10px] font-medium text-amber-700" title="Alterações por guardar">● por guardar</span>
                                        )}
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
                            );
                        })
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
                                    onClick={handleReloadPermissions}
                                    disabled={isLoadingPermissions || isSaving || permsQuery.isFetching}
                                    className="p-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-light)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    title="Recarregar permissões"
                                >
                                    <RefreshCw size={16} className={permsQuery.isFetching && !isLoadingPermissions ? 'animate-spin' : ''} />
                                </button>
                                <button
                                    onClick={handleSavePermissions}
                                    disabled={isSaving || isLoadingPermissions || !isDirty}
                                    aria-busy={isSaving}
                                    className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        background: isDirty ? '#44B16F' : 'var(--color-text-muted)',
                                        boxShadow: isDirty ? '0 2px 8px rgba(68,177,111,0.3)' : 'none',
                                    }}
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {isSaving ? 'A guardar...' : 'Guardar Alterações'}
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
                            ) : permissionsError ? (
                                <ErrorState
                                    title="Não foi possível carregar as permissões"
                                    message={getErrorMessage(permsQuery.error, 'Erro ao carregar permissões deste utilizador.')}
                                    onRetry={permsQuery.refetch}
                                    isRetrying={permsQuery.isFetching}
                                />
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
                                        {menusError
                                            ? getErrorMessage(menusQuery.error, 'Não foi possível carregar os menus do sistema.')
                                            : 'Não foi possível carregar os menus do sistema. Verifique a sua ligação ou as configurações do sistema.'}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => menusQuery.refetch()}
                                        disabled={menusQuery.isFetching}
                                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                                        style={{ background: 'var(--color-primary)' }}
                                    >
                                        <RefreshCw size={15} className={menusQuery.isFetching ? 'animate-spin' : ''} />
                                        Tentar novamente
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                {permsQuery.isError && (
                                    <StaleDataBanner onRetry={permsQuery.refetch} isRetrying={permsQuery.isFetching} />
                                )}
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
                                                <Fragment key={`menu-${perm.menu_id}-${index}`}>
                                                    <tr
                                                        style={{ borderBottom: '1px solid var(--color-border-light)', transition: 'background 0.15s' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <td className="px-6 py-4 font-semibold"
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
                                                </Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : selectedId && usersQuery.isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 size={32} className="animate-spin" style={{ color: '#44B16F' }} />
                    </div>
                ) : selectedId && hasUsers ? (
                    <div className="flex-1 flex items-center justify-center">
                        <EmptyState
                            icon={UserX}
                            title="Utilizador não encontrado"
                            description="O utilizador seleccionado já não existe ou não pode ter permissões configuradas."
                            action={(
                                <button
                                    type="button"
                                    onClick={() => setFilter('utilizador', '')}
                                    className="px-4 py-2 rounded-lg text-sm font-medium border hover:bg-gray-50"
                                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                                >
                                    Limpar selecção
                                </button>
                            )}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                            style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
                            <Shield size={32} />
                        </div>
                        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                            Nenhum utilizador seleccionado
                        </h3>
                        <p className="text-sm mt-2 max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            Seleccione um utilizador na lista à esquerda para configurar as suas permissões de acesso ao sistema.
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
