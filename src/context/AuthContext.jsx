import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { authAPI, permissionsAPI, menusAPI } from '../services/api';
import { queryClient } from '../lib/queryClient';
import {
    hasPermission as checkPermission,
    hasWritePermission as checkWritePermission,
    isAdmin as checkIsAdmin,
    canManageUsers as checkCanManageUsers,
    canDeleteRecords as checkCanDeleteRecords,
    canApproveQuotations as checkCanApproveQuotations,
    canGenerateAcquisitions as checkCanGenerateAcquisitions,
    getRoleName,
    getAvailableMenuItems,
    normalizePermissions
} from '../utils/permissions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);

    // Carrega as permissões do utilizador autenticado a partir da API
    const fetchUserPermissions = useCallback(async (currentUser) => {
        try {
            let apiData = await permissionsAPI.getMyPermissions();

            // Injectar o slug caso a API devolva apenas o menu_id (necessário para a UI saber qual menu é qual)
            try {
                let rawPerms = apiData?.data || apiData || [];
                if (rawPerms && Array.isArray(rawPerms.permissions)) rawPerms = rawPerms.permissions;
                
                if (Array.isArray(rawPerms) && rawPerms.length > 0 && rawPerms.some(p => p.menu_id && !p.slug)) {
                    const menusData = await menusAPI.getAll().catch(() => []);
                    const menusList = Array.isArray(menusData) ? menusData : (menusData.data || []);
                    
                    rawPerms.forEach(p => {
                        const menu = menusList.find(m => m.id === p.menu_id);
                        if (menu) p.slug = menu.slug || menu.name;
                    });
                    
                    if (apiData?.data) {
                        if (Array.isArray(apiData.data.permissions)) apiData.data.permissions = rawPerms;
                        else apiData.data = rawPerms;
                    } else if (apiData?.permissions) {
                        apiData.permissions = rawPerms;
                    } else {
                        apiData = rawPerms;
                    }
                }
            } catch (e) {
                console.warn('Falha ao tentar injectar slugs nos menus', e);
            }

            const normalized = normalizePermissions(apiData);

            // Actualizar o user com as permissões da API. Usa o estado mais recente
            // para não perder alterações feitas entretanto (ex.: updateUser) e para
            // não "ressuscitar" a sessão se o utilizador fez logout durante o pedido.
            setUser(prev => {
                if (!prev || prev.id !== currentUser.id) return prev;
                const updatedUser = { ...prev, apiPermissions: normalized };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return updatedUser;
            });
            localStorage.setItem('apiPermissions', JSON.stringify(normalized));
            setPermissionsLoaded(true);
        } catch (error) {
            console.warn('Não foi possível carregar permissões da API, a usar fallback por role:', error);
            setPermissionsLoaded(true);
        }
    }, []);

    // Load auth state from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        let parsedUser = null;
        if (storedToken && storedUser) {
            try {
                parsedUser = JSON.parse(storedUser);
            } catch {
                // Dados corrompidos no localStorage — tratar como sessão inexistente
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('apiPermissions');
            }
        }

        if (storedToken && parsedUser) {
            // Tentar restaurar permissões do cache
            const cachedPermissions = localStorage.getItem('apiPermissions');
            if (cachedPermissions) {
                try {
                    parsedUser.apiPermissions = JSON.parse(cachedPermissions);
                } catch { /* ignore */ }
            }

            setToken(storedToken);
            setUser(parsedUser);
            
            // Recarregar permissões da API em background (sempre frescos)
            fetchUserPermissions(parsedUser);
        } else {
            setPermissionsLoaded(true);
        }
        setIsLoading(false);
    }, [fetchUserPermissions]);

    const login = async (email, password) => {
        const response = await authAPI.login(email, password);
        // API returns access_token, not token
        const { access_token: newToken, user: newUser } = response;

        // Limpar permissões antigas imediatamente para evitar que o novo utilizador
        // veja os menus do utilizador anterior enquanto as novas permissões carregam
        localStorage.removeItem('apiPermissions');
        // Descartar dados em cache da sessão anterior
        queryClient.clear();

        // Store in localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));

        // Update state — sem apiPermissions para garantir sidebar limpa
        setToken(newToken);
        setUser({ ...newUser, apiPermissions: undefined });
        setPermissionsLoaded(false);

        // Carregar permissões do utilizador após login
        await fetchUserPermissions(newUser);

        return response;
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear storage and state regardless of API call result
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('apiPermissions');
            queryClient.clear();
            setToken(null);
            setUser(null);
            setPermissionsLoaded(false);
        }
    };

    // Função para verificar permissão de leitura do utilizador actual
    const hasPermission = useCallback((permission) => {
        if (!user) return false;
        return checkPermission(user, permission);
    }, [user]);

    // Função para verificar permissão de escrita/edição do utilizador actual
    const hasWritePermission = useCallback((permission) => {
        if (!user) return false;
        return checkWritePermission(user, permission);
    }, [user]);

    // Verifica se o utilizador é admin
    const isAdmin = useMemo(() => {
        if (!user?.role) return false;
        return checkIsAdmin(user.role);
    }, [user?.role]);

    // Verifica se pode gerir utilizadores
    const canManageUsers = useMemo(() => {
        if (!user?.role) return false;
        return checkCanManageUsers(user.role);
    }, [user?.role]);

    // Verifica se pode eliminar registos
    const canDeleteRecords = useMemo(() => {
        if (!user?.role) return false;
        return checkCanDeleteRecords(user.role);
    }, [user?.role]);

    // Verifica se pode aprovar cotações
    const canApproveQuotations = useMemo(() => {
        if (!user?.role) return false;
        return checkCanApproveQuotations(user.role);
    }, [user?.role]);

    // Verifica se pode gerar aquisições
    const canGenerateAcquisitions = useMemo(() => {
        if (!user?.role) return false;
        return checkCanGenerateAcquisitions(user.role);
    }, [user?.role]);

    // Obtém o nome do role
    const userRoleName = useMemo(() => {
        if (!user?.role) return 'Utilizador';
        return getRoleName(user.role);
    }, [user?.role]);

    // Obtém os items de menu disponíveis (prioriza API)
    const availableMenuItems = useMemo(() => {
        if (!user?.role) return [];
        return getAvailableMenuItems(user.role, user?.apiPermissions);
    }, [user?.role, user?.apiPermissions]);

    // Força recarga das permissões (útil após admin alterar permissões)
    const refreshPermissions = useCallback(async () => {
        if (user) {
            await fetchUserPermissions(user);
        }
    }, [user, fetchUserPermissions]);

    // Sincronizar sessão entre separadores: logout/login noutro separador
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key !== 'token') return;
            if (!e.newValue) {
                queryClient.clear();
                setToken(null);
                setUser(null);
                setPermissionsLoaded(false);
            } else if (e.newValue !== token) {
                // Outro utilizador iniciou sessão noutro separador: recarregar para evitar estado misto
                window.location.reload();
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [token]);

    // Recarregar permissões ao voltar ao separador (no máximo 1x por minuto),
    // para que alterações feitas pelo administrador se apliquem sem novo login.
    const lastPermissionsRefresh = useRef(0);
    const userRef = useRef(user);
    useEffect(() => {
        userRef.current = user;
    }, [user]);
    const hasSession = !!token && !!user;
    useEffect(() => {
        if (!hasSession) return;
        lastPermissionsRefresh.current = Date.now();
        const onVisible = () => {
            if (document.visibilityState !== 'visible' || !userRef.current) return;
            if (Date.now() - lastPermissionsRefresh.current < 60 * 1000) return;
            lastPermissionsRefresh.current = Date.now();
            fetchUserPermissions(userRef.current);
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [hasSession, fetchUserPermissions]);

    const updateUser = useCallback((newData) => {
        setUser(prev => {
            const updatedUser = { ...prev, ...newData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        });
    }, []);

    // Verifica se o utilizador pode aceder a um menu/página.
    // Admin: sempre. Restantes: estritamente segundo as permissões da API
    // (enquanto não carregarem, o acesso é negado por segurança).
    const canAccessMenu = useCallback((permission) => {
        if (isAdmin) return true;
        if (!permission) return false;
        const map = user?.apiPermissions?.permissionsMap;
        if (!map) return false;
        const perm = map[permission];
        return !!(perm && perm.access !== false);
    }, [isAdmin, user?.apiPermissions]);

    const value = {
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        permissionsLoaded,
        login,
        logout,
        updateUser,
        refreshPermissions,
        // Funções de permissão
        hasPermission,
        hasWritePermission,
        canAccessMenu,
        isAdmin,
        canManageUsers,
        canDeleteRecords,
        canApproveQuotations,
        canGenerateAcquisitions,
        userRoleName,
        availableMenuItems,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
