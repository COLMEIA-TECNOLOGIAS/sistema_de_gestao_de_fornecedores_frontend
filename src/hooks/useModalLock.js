import { useEffect } from 'react';

// Número de modais abertos em simultâneo (ex.: modal de confirmação sobre outro modal)
let openModals = 0;

/**
 * Locks body scroll when a modal is open and compensates for scrollbar width
 * to prevent the navbar/layout from shifting.
 */
export function useModalLock(isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    if (openModals === 0) {
      // Measure actual scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
      document.body.classList.add('modal-open');
    }
    openModals += 1;

    return () => {
      openModals -= 1;
      // Só desbloquear quando o último modal fechar
      if (openModals === 0) {
        document.body.classList.remove('modal-open');
        document.documentElement.style.removeProperty('--scrollbar-width');
      }
    };
  }, [isOpen]);
}
