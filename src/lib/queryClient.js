import { QueryClient } from '@tanstack/react-query';

/**
 * Configuração central da cache de dados (TanStack Query).
 *
 * - Dados considerados "frescos" durante 30s: navegar entre páginas é instantâneo.
 * - Refresh automático ao voltar ao separador e ao recuperar a ligação.
 * - Novas tentativas apenas para falhas de rede/servidor (nunca para 4xx).
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: (failureCount, error) => {
                const status = error?.response?.status;
                if (status && status >= 400 && status < 500) return false;
                return failureCount < 2;
            },
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
        },
        mutations: {
            retry: false,
        },
    },
});
