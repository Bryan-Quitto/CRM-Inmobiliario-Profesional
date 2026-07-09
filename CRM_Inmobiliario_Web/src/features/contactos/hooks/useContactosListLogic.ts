import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContactosList } from './useContactosList';
import { useScrollButtons } from '@/hooks/useScrollButtons';
import { toast } from 'sonner';

export const useContactosListLogic = () => {
  const navigate = useNavigate();
  const listContext = useContactosList();
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [isMigrarModalOpen, setIsMigrarModalOpen] = useState(false);
  const [migrarRoles, setMigrarRoles] = useState({ esCliente: true, esPropietario: false });

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

  const { showScrollTop, showScrollBottom, scrollToTop, scrollToBottom } = useScrollButtons();

  const handleOpenMigrarModal = () => {
    const isContactPickerSupported = 'contacts' in navigator;
    if (!isContactPickerSupported) return;
    setIsMigrarModalOpen(true);
  };

  const handleMigrarContactosTelefono = async (esCliente: boolean, esPropietario: boolean) => {
    setIsMigrarModalOpen(false);
    try {
      const isContactPickerSupported = 'contacts' in navigator;
      if (!isContactPickerSupported) return;

      const props = ['name', 'tel'];
      const opts = { multiple: true };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contactosSeleccionados = await (navigator as any).contacts.select(props, opts);
      
      if (!contactosSeleccionados || contactosSeleccionados.length === 0) return;

      const toastId = toast.loading(`Importando ${contactosSeleccionados.length} contactos...`);

      interface ContactPickerResult {
        name?: string[];
        tel?: string[];
      }

      const contactosAImportar = contactosSeleccionados.map((c: ContactPickerResult) => {
        const fullName = c.name && c.name.length > 0 ? c.name[0] : '';
        const phone = c.tel && c.tel.length > 0 ? c.tel[0] : null;
        
        const nameParts = fullName.trim().split(' ');
        const nombre = nameParts[0] || 'Desconocido';
        const apellido = nameParts.slice(1).join(' ');

        return {
          nombre,
          apellido,
          email: null,
          telefono: phone,
          origen: 'Whatsapp Directo',
          esCliente,
          esPropietario
        };
      });

      const { registrarContactosMasivo } = await import('../api/crearContactosMasivo');
      const response = await registrarContactosMasivo({ contactos: contactosAImportar });

      toast.success(response.message, { id: toastId });
      listContext.mutate();
    } catch (error: unknown) {
      console.error(error);
      toast.error('Ocurrió un error al importar contactos desde tu teléfono.');
    }
  };

  return {
    navigate,
    basePath,
    isAdvancedFiltersOpen,
    setIsAdvancedFiltersOpen,
    activeAdvancedCount,
    visiblePages,
    handleOpenCreateModal,
    showScrollTop,
    showScrollBottom,
    scrollToTop,
    scrollToBottom,
    handleMigrarContactosTelefono,
    isMigrarModalOpen,
    setIsMigrarModalOpen,
    migrarRoles,
    setMigrarRoles,
    handleOpenMigrarModal,
    ...listContext,
  };
};

export type ContactosListLogic = ReturnType<typeof useContactosListLogic>;
