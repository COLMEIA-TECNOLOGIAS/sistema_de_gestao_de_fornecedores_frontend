import { useEffect } from 'react';

/**
 * Locks body scroll when a modal is open and compensates for scrollbar width
 * to prevent the navbar/layout from shifting.
 */
export function useModalLock(isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    // Measure actual scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
    document.body.classList.add('modal-open');

    return () => {
      document.body.classList.remove('modal-open');
      document.documentElement.style.removeProperty('--scrollbar-width');
    };
  }, [isOpen]);
}
