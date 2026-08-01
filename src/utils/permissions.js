/**
 * Sistema de Controle de Acesso baseado em Permissões da API
 * 
 * As permissões são agora carregadas do backend via GET /api/user/permissions.
 * O Admin recebe todas as permissões automaticamente (tratado pelo backend).
 * 
 * O frontend guarda a árvore de menus/permissões no AuthContext e valida
 * os acessos com base nessa lista dinâmica.
 */

// Definição dos roles (mantido para referência e fallbacks)
export const ROLES = {
    ADMIN: 'admin',
    PROCUREMENT_TECHNICIAN: 'procurement_technician',
};

// Slugs de permissões por módulo (usados como identificadores, agora sincronizados com a API)
export const PERMISSIONS = {
    DASHBOARD: 'dashboard',
    FORNECEDORES: 'suppliers',
    COTACOES: 'quotation-requests',
    USUARIOS: 'users',
    RELATORIOS: 'relatorios',
    AQUISICOES: 'acquisitions',
    CONFIGURACOES: 'configuracoes',
    CATEGORIAS: 'categories',
    PRODUTOS: 'products',
    AVALIACOES: 'supplier-evaluations',
    DOCUMENTOS: 'documents',
    NOTIFICACOES: 'notifications',
    AUDITORIA: 'audit-logs',
    EXCLUSAO: 'deletion-requests',
};

// Mapeamento de permissões por role (fallback se a API não responder)
export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: {
        name: 'Administrador',
        description: 'Acesso total ao sistema',
        permissions: Object.values(PERMISSIONS),
        canManageUsers: true,
        canDeleteRecords: true,
        canApproveQuotations: true,
        canGenerateAcquisitions: true,
    },
    [ROLES.PROCUREMENT_TECHNICIAN]: {
        name: 'Técnico de Compras',
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
 * Normaliza a resposta da API de permissões para um formato interno consistente.
 * Suporta vários formatos que a API pode devolver:
 *   1. Array de objectos com { slug, permissions: [...] } (árvore de menus)
 *   2. Array de strings ["dashboard", "fornecedores.read", ...]
 *   3. Objecto { dashboard: { access: true, level: 'write' }, ... }
 *   4. Array de objectos com { name/menu_name, can_view, can_create, can_edit, can_delete }
 * 
 * @param {any} apiData - Dados devolvidos pela API
 * @returns {{ menuSlugs: string[], permissionsMap: Object }}
 */
export function normalizePermissions(apiData) {
    if (!apiData) return { menuSlugs: [], permissionsMap: {} };

    let raw = apiData.data || apiData;
    
    // Se o backend devolveu o modelo do utilizador com as permissões lá dentro
    if (raw && !Array.isArray(raw) && Array.isArray(raw.permissions)) {
        raw = raw.permissions;
    }

    const menuSlugs = [];
    const permissionsMap = {};

    // Formato 1: Array de objectos com slug
    if (Array.isArray(raw)) {
        raw.forEach(item => {
            if (typeof item === 'string') {
                // Formato 2: Array de strings — "dashboard" ou "dashboard.read"
                const parts = item.split('.');
                const slug = parts[0].toLowerCase();
                const level = parts[1] || 'read';
                if (!menuSlugs.includes(slug)) menuSlugs.push(slug);
                if (!permissionsMap[slug]) permissionsMap[slug] = { access: true, level: 'read' };
                if (level === 'write' || level === 'edit' || level === 'create' || level === 'delete') {
                    permissionsMap[slug].level = 'write';
                }
            } else if (typeof item === 'object' && item !== null) {
                // Objecto com slug/name/menu_name
                const slug = (item.slug || item.name || item.menu_name || item.menu || '').toLowerCase()
                    .replace(/\s+/g, '_')
                    .replace(/[áàã]/g, 'a')
                    .replace(/[éèê]/g, 'e')
                    .replace(/[íìî]/g, 'i')
                    .replace(/[óòõô]/g, 'o')
                    .replace(/[úùû]/g, 'u')
                    .replace(/ç/g, 'c');

                if (!slug) return;
                if (!menuSlugs.includes(slug)) menuSlugs.push(slug);

                // Determinar nível de permissão
                const perms = item.permissions || [];
                const canWrite = item.can_create || item.can_edit || item.can_delete ||
                    (Array.isArray(perms) && perms.some(p => 
                        typeof p === 'string' && ['write', 'create', 'edit', 'delete', 'update'].includes(p.toLowerCase())
                    ));
                const canRead = item.can_view !== undefined ? item.can_view : true;

                permissionsMap[slug] = {
                    access: canRead || canWrite,
                    level: canWrite ? 'write' : 'read',
                    // Guardar os dados granulares originais
                    can_view: item.can_view ?? canRead,
                    can_create: item.can_create ?? canWrite,
                    can_edit: item.can_edit ?? canWrite,
                    can_delete: item.can_delete ?? canWrite,
                };

                // Processar sub-menus recursivamente se existirem
                if (Array.isArray(item.children || item.sub_menus || item.submenus)) {
                    const children = item.children || item.sub_menus || item.submenus;
                    const childResult = normalizePermissions(children);
                    childResult.menuSlugs.forEach(s => {
                        if (!menuSlugs.includes(s)) menuSlugs.push(s);
                    });
                    Object.assign(permissionsMap, childResult.permissionsMap);
                }
            }
        });
    } else if (typeof raw === 'object') {
        // Formato 3: Objecto directo { dashboard: { access: true, level: 'write' } }
        Object.entries(raw).forEach(([key, value]) => {
            const slug = key.toLowerCase();
            menuSlugs.push(slug);
            if (typeof value === 'object') {
                permissionsMap[slug] = {
                    access: value.access !== false,
                    level: value.level || (value.can_create || value.can_edit || value.can_delete ? 'write' : 'read'),
                    ...value,
                };
            } else {
                permissionsMap[slug] = { access: !!value, level: value ? 'write' : 'read' };
            }
        });
    }

    return { menuSlugs, permissionsMap };
}

/**
 * Verifica se um utilizador tem permissão para aceder a um módulo específico.
 * Prioriza as permissões carregadas da API (user.apiPermissions).
 * 
 * @param {Object|string} userOrRole - O objecto do utilizador ou o role
 * @param {string} permission - A permissão a ser verificada (ex: 'dashboard')
 * @returns {boolean}
 */
export function hasPermission(userOrRole, permission) {
    const isUserObject = typeof userOrRole === 'object' && userOrRole !== null;
    const userRole = isUserObject ? userOrRole.role : userOrRole;
    
    // Admin tem acesso total sempre
    if (userRole === ROLES.ADMIN) return true;

    // 1. Se o user tem permissões carregadas da API, verificar contra elas
    if (isUserObject && userOrRole.apiPermissions) {
        const { permissionsMap } = userOrRole.apiPermissions;
        if (permissionsMap) {
            const perm = permissionsMap[permission];
            return perm ? perm.access !== false : false;
        }
    }

    // 2. Fallback: verificar permissões granulares locais (formato antigo)
    if (isUserObject && userOrRole.permissions && userOrRole.permissions[permission]) {
        return userOrRole.permissions[permission].access === true;
    }

    // 3. Fallback final: permissões base do Role
    const roleConfig = ROLE_PERMISSIONS[userRole];
    if (!roleConfig) {
        console.warn(`Role desconhecido: ${userRole}`);
        return false;
    }
    return roleConfig.permissions.includes(permission);
}

/**
 * Verifica se o utilizador tem permissão de ESCRITA/EDIÇÃO num módulo
 * @param {Object} user - O objecto do utilizador
 * @param {string} permission - A permissão a ser verificada
 * @returns {boolean}
 */
export function hasWritePermission(user, permission) {
    if (!user) return false;
    
    // Admin tem acesso total sempre
    if (user.role === ROLES.ADMIN) return true;

    // 1. Verificar contra permissões da API
    if (user.apiPermissions) {
        const { permissionsMap } = user.apiPermissions;
        if (permissionsMap) {
            const perm = permissionsMap[permission];
            return perm ? (perm.access !== false && perm.level === 'write') : false;
        }
    }

    // 2. Fallback: formato antigo
    if (user.permissions && user.permissions[permission]) {
        return user.permissions[permission].access === true && user.permissions[permission].level === 'write';
    }
    
    // 3. Fallback por role
    return hasPermission(user, permission);
}

/**
 * Verifica se o utilizador é admin
 */
export function isAdmin(userRole) {
    return userRole === ROLES.ADMIN;
}

/**
 * Verifica se o utilizador pode gerir utilizadores
 */
export function canManageUsers(userRole) {
    const roleConfig = ROLE_PERMISSIONS[userRole];
    return roleConfig?.canManageUsers || false;
}

/**
 * Verifica se o utilizador pode eliminar registos
 */
export function canDeleteRecords(userRole) {
    const roleConfig = ROLE_PERMISSIONS[userRole];
    return roleConfig?.canDeleteRecords || false;
}

/**
 * Verifica se o utilizador pode aprovar cotações
 */
export function canApproveQuotations(userRole) {
    const roleConfig = ROLE_PERMISSIONS[userRole];
    return roleConfig?.canApproveQuotations || false;
}

/**
 * Verifica se o utilizador pode gerar aquisições
 */
export function canGenerateAcquisitions(userRole) {
    const roleConfig = ROLE_PERMISSIONS[userRole];
    return roleConfig?.canGenerateAcquisitions || false;
}

/**
 * Obtém a configuração do role
 */
export function getRoleConfig(userRole) {
    return ROLE_PERMISSIONS[userRole] || null;
}

/**
 * Obtém o nome amigável do role
 */
export function getRoleName(userRole) {
    const roleConfig = ROLE_PERMISSIONS[userRole];
    return roleConfig?.name || 'Utilizador';
}

/**
 * Obtém os itens de menu disponíveis.
 * Prioriza as permissões da API se existirem.
 * 
 * @param {string} userRole - O role do utilizador
 * @param {Object} apiPermissions - Permissões normalizadas da API (opcional)
 * @returns {Array<string>}
 */
export function getAvailableMenuItems(userRole, apiPermissions) {
    // Se temos permissões da API, usá-las
    if (apiPermissions && apiPermissions.menuSlugs && apiPermissions.menuSlugs.length > 0) {
        return apiPermissions.menuSlugs;
    }

    // Fallback para o role
    const roleConfig = ROLE_PERMISSIONS[userRole];
    if (!roleConfig) {
        return [];
    }
    return roleConfig.permissions;
}
