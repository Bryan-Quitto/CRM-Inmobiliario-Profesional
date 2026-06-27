import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContactosList } from './useContactosList';

export const useContactosListLogic = () => {
  const navigate = useNavigate();
  const listContext = useContactosList();
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  const activeAdvancedCount = useMemo(() => {
    return Object.values(listContext.advancedFilters).filter(v => v !== undefined && v !== '').length;
  }, [listContext.advancedFilters]);

  const basePath = '/contactos';

  const getVisiblePages = (current: number, total: number) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, 5];
    if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
    return [current - 2, current - 1, current, current + 1, current + 2];
  };

  const visiblePages = useMemo(() => {
    return getVisiblePages(listContext.currentPage, listContext.totalPages);
  }, [listContext.currentPage, listContext.totalPages]);

  const handleOpenCreateModal = (action: 'create' | 'edit', extraProps?: Record<string, unknown>) => {
    window.dispatchEvent(new CustomEvent('open-crear-contacto-modal', { detail: { action, ...extraProps } }));
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  return {
    navigate,
    basePath,
    isAdvancedFiltersOpen,
    setIsAdvancedFiltersOpen,
    activeAdvancedCount,
    visiblePages,
    handleOpenCreateModal,
    scrollToTop,
    scrollToBottom,
    ...listContext,
  };
};

export type ContactosListLogic = ReturnType<typeof useContactosListLogic>;
