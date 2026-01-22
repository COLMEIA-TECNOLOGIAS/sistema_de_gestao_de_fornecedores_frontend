import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Componente para proteger rotas baseado em permissões
 * 
 * @param {Object} props
 * @param {string} props.permission - Permissão necessária para acessar a rota
 * @param {boolean} props.requireAdmin - Se true, exige que o usuário seja admin
 * @param {string} props.redirectTo - Rota para redirecionar se não autorizado (default: /dashboard)
 * @param {React.ReactNode} props.children - Conteúdo da rota
 */
export function RoleProtectedRoute({
    permission,
    requireAdmin = false,
    redirectTo = "/dashboard",
    children
}) {
    const { isAuthenticated, isLoading, hasPermission, isAdmin } = useAuth();

    // Se ainda está carregando, mostra loading
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#44B16F] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verificando permissões...</p>
                </div>
            </div>
        );
    }

    // Se não está autenticado, redireciona para login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Se requer admin e não é admin
    if (requireAdmin && !isAdmin) {
        return <Navigate to={redirectTo} replace />;
    }

    // Se precisa de permissão específica e não tem
    if (permission && !hasPermission(permission)) {
        return <Navigate to={redirectTo} replace />;
    }

    return children;
}

/**
 * Componente para proteger rotas apenas para admin
 */
export function AdminRoute({ children, redirectTo = "/dashboard" }) {
    return (
        <RoleProtectedRoute requireAdmin={true} redirectTo={redirectTo}>
            {children}
        </RoleProtectedRoute>
    );
}

export default RoleProtectedRoute;
