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
            PERMISSIONS.CATEGORIAS,
        ],
        canManageUsers: false,
        canDeleteRecords: false,
        canApproveQuotations: true,
        canGenerateAcquisitions: true,
    },
};

/**
 * Verifica se um usuário tem permissão para acessar um módulo específico
 * @param {string} userRole - O role do usuário
 * @param {string} permission - A permissão a ser verificada
 * @returns {boolean}
 */
export function hasPermission(userRole, permission) {
    const roleConfig = ROLE_PERMISSIONS[userRole];
    if (!roleConfig) {
        console.warn(`Role desconhecido: ${userRole}`);
        return false;
    }
    return roleConfig.permissions.includes(permission);
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
