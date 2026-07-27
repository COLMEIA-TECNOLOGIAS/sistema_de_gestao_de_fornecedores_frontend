/**
 * Sistema de Controle de Acesso baseado em Roles (RBAC)
 * 
 * Roles disponíveis:
 * - admin: Acesso total ao sistema
 * - procurement_technician: Gestão de cotações e fornecedores
 */

// Definição dos roles
export const ROLES = {
    ADMIN: 'admin',
    PROCUREMENT_TECHNICIAN: 'procurement_technician',
};

// Definição de permissões por módulo
export const PERMISSIONS = {
    DASHBOARD: 'dashboard',
    FORNECEDORES: 'fornecedores',
    COTACOES: 'cotacoes',
    USUARIOS: 'usuarios',
    RELATORIOS: 'relatorios',
    AQUISICOES: 'aquisicoes',
    CONFIGURACOES: 'configuracoes',
    CATEGORIAS: 'categorias',
    PRODUTOS: 'produtos',
};

// Mapeamento de permissões por role
export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: {
        name: 'Administrador',
        description: 'Acesso total ao sistema',
        permissions: [
            PERMISSIONS.DASHBOARD,
            PERMISSIONS.FORNECEDORES,
            PERMISSIONS.COTACOES,
            PERMISSIONS.USUARIOS,
            PERMISSIONS.RELATORIOS,
            PERMISSIONS.AQUISICOES,
            PERMISSIONS.CONFIGURACOES,
            PERMISSIONS.CATEGORIAS,
            PERMISSIONS.PRODUTOS,
        ],
        canManageUsers: true,
        canDeleteRecords: true,
        canApproveQuotations: true,
        canGenerateAcquisitions: true,
    },
    [ROLES.PROCUREMENT_TECHNICIAN]: {
        name: 'Técnico de Procurement',
        description: 'Gestão de cotações e fornecedores',
        permissions: [
            PERMISSIONS.DASHBOARD,
            PERMISSIONS.FORNECEDORES,
            PERMISSIONS.COTACOES,
            PERMISSIONS.RELATORIOS,
            PERMISSIONS.AQUISICOES,
            PERMISSIONS.PRODUTOS,
        ],
        canManageUsers: false,
        canDeleteRecords: true,
        canApproveQuotations: true,
        canGenerateAcquisitions: true,
    },
};

/**
 * Verifica se um usuário tem permissão para acessar um módulo específico
 * @param {Object|string} userOrRole - O objeto do usuário ou o role (para retrocompatibilidade)
 * @param {string} permission - A permissão a ser verificada
 * @returns {boolean}
 */
export function hasPermission(userOrRole, permission) {
    const isUserObject = typeof userOrRole === 'object' && userOrRole !== null;
    const userRole = isUserObject ? userOrRole.role : userOrRole;
    
    // 1. Verificar permissões granulares (se existirem)
    if (isUserObject && userOrRole.permissions && userOrRole.permissions[permission]) {
        return userOrRole.permissions[permission].access === true;
    }

    // 2. Fallback para as permissões base do Role
    const roleConfig = ROLE_PERMISSIONS[userRole];
    if (!roleConfig) {
        console.warn(`Role desconhecido: ${userRole}`);
        return false;
    }
    return roleConfig.permissions.includes(permission);
}

/**
 * Verifica se o usuário tem permissão de ESCRITA/EDIÇÃO num módulo
 * @param {Object} user - O objeto do usuário
 * @param {string} permission - A permissão a ser verificada
 * @returns {boolean}
 */
export function hasWritePermission(user, permission) {
    if (!user) return false;
    
    if (user.permissions && user.permissions[permission]) {
        return user.permissions[permission].access === true && user.permissions[permission].level === 'write';
    }
    
    // Fallback para Role: Admin tem sempre write. Technician tem write onde tem acesso (simplificação do fallback)
    if (user.role === ROLES.ADMIN) return true;
    return hasPermission(user, permission);
}

/**
 * Verifica se o usuário é admin
 * @param {string} userRole - O role do usuário
 * @returns {boolean}
 */
export function isAdmin(userRole) {
    return userRole === ROLES.ADMIN;
}

/**
 * Verifica se o usuário pode gerenciar usuários
 * @param {string} userRole - O role do usuário
 * @returns {boolean}
 */
export function canManageUsers(userRole) {
    const roleConfig = ROLE_PERMISSIONS[userRole];
    return roleConfig?.canManageUsers || false;
}

/**
 * Verifica se o usuário pode deletar registros
 * @param {string} userRole - O role do usuário
 * @returns {boolean}
 */
export function canDeleteRecords(userRole) {
    const roleConfig = ROLE_PERMISSIONS[userRole];
    return roleConfig?.canDeleteRecords || false;
}

/**
 * Verifica se o usuário pode aprovar cotações
 * @param {string} userRole - O role do usuário
 * @returns {boolean}
 */
export function canApproveQuotations(userRole) {
    const roleConfig = ROLE_PERMISSIONS[userRole];
    return roleConfig?.canApproveQuotations || false;
}

/**
 * Verifica se o usuário pode gerar aquisições
 * @param {string} userRole - O role do usuário
 * @returns {boolean}
 */
export function canGenerateAcquisitions(userRole) {
    const roleConfig = ROLE_PERMISSIONS[userRole];
    return roleConfig?.canGenerateAcquisitions || false;
}

/**
 * Obtém a configuração do role
 * @param {string} userRole - O role do usuário
 * @returns {Object|null}
 */
export function getRoleConfig(userRole) {
    return ROLE_PERMISSIONS[userRole] || null;
}

/**
 * Obtém o nome amigável do role
 * @param {string} userRole - O role do usuário
 * @returns {string}
 */
export function getRoleName(userRole) {
    const roleConfig = ROLE_PERMISSIONS[userRole];
    return roleConfig?.name || 'Usuário';
}

/**
 * Obtém os itens de menu disponíveis para um role
 * @param {string} userRole - O role do usuário
 * @returns {Array<string>}
 */
export function getAvailableMenuItems(userRole) {
    const roleConfig = ROLE_PERMISSIONS[userRole];
    if (!roleConfig) {
        return [];
    }
    return roleConfig.permissions;
}
