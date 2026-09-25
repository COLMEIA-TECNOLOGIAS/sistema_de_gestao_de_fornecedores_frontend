import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authAPI, permissionsAPI, menusAPI } from '../services/api';
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
            
            // Actualizar o user com as permissões da API
            const updatedUser = { ...currentUser, apiPermissions: normalized };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('apiPermissions', JSON.stringify(normalized));
            setPermissionsLoaded(true);
        } catch (error) {
            console.warn('Não foi possível carregar permissões da API, a usar fallback por role:', error);
            setPermissionsLoaded(true);
        }
    }, []);

    // Load auth state from sessionStorage on mount (faster than localStorage)
    useEffect(() => {
        const storedToken = sessionStorage.getItem('token') || localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            const parsedUser = JSON.parse(storedUser);
            const cachedPermissions = localStorage.getItem('apiPermissions');
            if (cachedPermissions) {
                try { parsedUser.apiPermissions = JSON.parse(cachedPermissions); } catch (e) { /* ignore */ }
            }
            setToken(storedToken);
            setUser(parsedUser);
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

        // Store in localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));

        // Update state — sem apiPermissions para garantir sidebar limpa
        setToken(newToken);
        setUser({ ...newUser, apiPermissions: undefined });

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

    const updateUser = useCallback((newData) => {
        const updatedUser = { ...user, ...newData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    }, [user]);

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

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
