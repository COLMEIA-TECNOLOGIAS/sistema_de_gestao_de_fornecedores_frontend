import { useAuth } from "../../context/AuthContext";

/**
 * Componente para proteger elementos baseado em permissões
 * 
 * @param {Object} props
 * @param {string} props.permission - Permissão necessária para renderizar o children
 * @param {boolean} props.requireAdmin - Se true, exige que o usuário seja admin
 * @param {React.ReactNode} props.children - Conteúdo a ser renderizado se autorizado
 * @param {React.ReactNode} props.fallback - Conteúdo alternativo se não autorizado (opcional)
 */
export function PermissionGuard({ permission, requireAdmin = false, children, fallback = null }) {
    const { hasPermission, isAdmin } = useAuth();

    // Se requer admin e não é admin
    if (requireAdmin && !isAdmin) {
        return fallback;
    }

    // Se precisa de permissão específica e não tem
    if (permission && !hasPermission(permission)) {
        return fallback;
    }

    return children;
}

/**
 * Componente para renderizar conteúdo apenas para admin
 */
export function AdminOnly({ children, fallback = null }) {
    const { isAdmin } = useAuth();
    return isAdmin ? children : fallback;
}

/**
 * Componente para renderizar conteúdo apenas se pode gerenciar usuários
 */
export function CanManageUsersGuard({ children, fallback = null }) {
    const { canManageUsers } = useAuth();
    return canManageUsers ? children : fallback;
}

/**
 * Componente para renderizar conteúdo apenas se pode deletar registros
 */
export function CanDeleteGuard({ children, fallback = null }) {
    const { canDeleteRecords } = useAuth();
    return canDeleteRecords ? children : fallback;
}

/**
 * Componente para renderizar conteúdo apenas se pode aprovar cotações
 */
export function CanApproveQuotationsGuard({ children, fallback = null }) {
    const { canApproveQuotations } = useAuth();
    return canApproveQuotations ? children : fallback;
}

/**
 * Componente para renderizar conteúdo apenas se pode gerar aquisições
 */
export function CanGenerateAcquisitionsGuard({ children, fallback = null }) {
    const { canGenerateAcquisitions } = useAuth();
    return canGenerateAcquisitions ? children : fallback;
}

export default PermissionGuard;
