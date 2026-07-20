import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { GlobalStorageFilters } from '../../api/almacenamiento';
import { useGlobalStorageHistory, deleteStorageFiles } from '../../api/almacenamiento';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import GlobalStorageHistoryPageDesktop from './GlobalStorageHistoryPageDesktop';
import GlobalStorageHistoryPageMobile from './GlobalStorageHistoryPageMobile';
import { toast } from 'sonner';

const GlobalStorageHistoryPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Historial Global de Almacenamiento';
  }, []);
  
  const isMobile = useIsMobile(768);
  
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Sincronizar el estado local con la URL cuando cambia externamente
  // (e.g. otra instancia del componente montada por el Layout, o el botón Atrás del navegador)
  useEffect(() => {
    if (urlSearch !== debouncedSearch) {
      setSearchQuery(urlSearch);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  useEffect(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const current = next.get('search') || '';
      const newVal = debouncedSearch || '';

      if (current !== newVal) {
        if (newVal) next.set('search', newVal);
        else next.delete('search');
        return next;
      }
      return prev;
    }, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const filters: GlobalStorageFilters = {
    search: searchQuery,
    targetType: searchParams.get('targetType') || 'Todas',
    status: searchParams.get('status') || 'Todos',
    startDate: searchParams.get('startDate') || null,
    endDate: searchParams.get('endDate') || null,
    sortBy: searchParams.get('sortBy') || 'uploadedAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  };
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const apiFilters = {
    ...filters,
    search: searchParams.get('search') || ''
  };

  const { history, totalCount, isLoading, isLoadingMore, isReachingEnd, setSize, size, mutate } = useGlobalStorageHistory(apiFilters, 50);

  const handleFilterChange = (key: keyof GlobalStorageFilters, value: string | null) => {
    if (key === 'search') {
      setSearchQuery(value || '');
      return;
    }

    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value && value !== 'Todas' && value !== 'Todos' && value !== 'uploadedAt' && value !== 'desc') {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    }, { replace: true });

    setSelectedIds(new Set()); // Reset selection when filters change
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    const activeItems = history.filter(h => !h.isDeleted);
    if (selectedIds.size === activeItems.length && activeItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeItems.map(h => h.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    
    const activeIds = Array.from(selectedIds);
    
    // Update cache optimistically
    mutate((currentData) => {
      if (!currentData) return currentData;
      return currentData.map(page => ({
        ...page,
        items: page.items.map(item => activeIds.includes(item.id) ? { ...item, isDeleted: true, deletedAt: new Date().toISOString() } : item)
      }));
    }, { revalidate: false });
    
    try {
      await deleteStorageFiles(activeIds);
      toast.success(`${activeIds.length} archivos eliminados exitosamente.`);
      setSelectedIds(new Set());
    } catch (error) {
      console.error(error);
      toast.error('Ocurrió un error al eliminar los archivos.');
      mutate(); // rollback
    } finally {
      setIsDeleting(false);
    }
  };

  const props = {
    history,
    totalCount,
    filters,
    onFilterChange: handleFilterChange,
    selectedIds,
    onSelect: handleSelect,
    onSelectAll: handleSelectAll,
    onDeleteSelected: handleDeleteSelected,
    isDeleting,
    isLoading,
    isLoadingMore: isLoadingMore || false,
    isReachingEnd: isReachingEnd || false,
    onLoadMore: () => setSize(size + 1)
  };

  return isMobile ? <GlobalStorageHistoryPageMobile {...props} /> : <GlobalStorageHistoryPageDesktop {...props} />;
};

export default GlobalStorageHistoryPage;
