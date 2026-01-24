import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authAPI } from '../services/api';
import {
    hasPermission as checkPermission,
    isAdmin as checkIsAdmin,
    canManageUsers as checkCanManageUsers,
    canDeleteRecords as checkCanDeleteRecords,
    canApproveQuotations as checkCanApproveQuotations,
    canGenerateAcquisitions as checkCanGenerateAcquisitions,
    getRoleName,
    getAvailableMenuItems
} from '../utils/permissions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load auth state from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await authAPI.login(email, password);
        // API returns access_token, not token
        const { access_token: newToken, user: newUser } = response;

        // Store in localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));

        // Update state
        setToken(newToken);
        setUser(newUser);

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
            setToken(null);
            setUser(null);
        }
    };

    // Função para verificar permissão do usuário atual
    const hasPermission = useCallback((permission) => {
        if (!user?.role) return false;
        return checkPermission(user.role, permission);
    }, [user?.role]);

    // Verifica se o usuário é admin
    const isAdmin = useMemo(() => {
        if (!user?.role) return false;
        return checkIsAdmin(user.role);
    }, [user?.role]);

    // Verifica se pode gerenciar usuários
    const canManageUsers = useMemo(() => {
        if (!user?.role) return false;
        return checkCanManageUsers(user.role);
    }, [user?.role]);

    // Verifica se pode deletar registros
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
        if (!user?.role) return 'Usuário';
        return getRoleName(user.role);
    }, [user?.role]);

    // Obtém os items de menu disponíveis
    const availableMenuItems = useMemo(() => {
        if (!user?.role) return [];
        return getAvailableMenuItems(user.role);
    }, [user?.role]);

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
        login,
        logout,
        updateUser,
        // Funções de permissão
        hasPermission,
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
