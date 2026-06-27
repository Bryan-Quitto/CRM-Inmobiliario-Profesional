import { Handshake, Pencil, MapPin, Plus, Image as ImageIcon } from 'lucide-react';
import { formatCurrency } from '../../constants/propiedades';
import { PropiedadStatusDropdown } from '../PropiedadStatusDropdown';
import { togglePropertyArchive } from '../../api/togglePropertyArchive';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import type { Propiedad } from '../../types';
import { ArchiveToggleButton } from '@/components/ui/ArchiveToggleButton';

interface PropiedadCardMobileProps {
  propiedad: Propiedad;
  syncing: boolean;
  updatingId: string | null;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  handleOpenDetail: (id: string) => void;
  handleStatusChange: (id: string, nuevoEstado: string) => void;
  setSelectedPropiedadIdForEdit: (id: string | null) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export const PropiedadCardMobile = ({
  propiedad: p,
  syncing,
  updatingId,
  openDropdownId,
  setOpenDropdownId,
  handleOpenDetail,
  handleStatusChange,
  setSelectedPropiedadIdForEdit,
  dropdownRef
}: PropiedadCardMobileProps) => {
  const { mutate } = useSWRConfig();
  const [isTogglingArchive, setIsTogglingArchive] = useState(false);

  const handleToggleArchive = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsTogglingArchive(true);
    const newState = !p.isArchivedForCurrentUser;
    try {
      await togglePropertyArchive(p.id);
      mutate(
        (key: unknown) => {
          const keyStr = Array.isArray(key) ? key[0] : key;
          return typeof keyStr === 'string' && keyStr.includes('propiedades');
        },
        undefined,
        { revalidate: true }
      );
      toast.success(newState ? 'Propiedad archivada' : 'Propiedad desarchivada');
    } catch {
      toast.error('Error al cambiar estado de archivo');
    } finally {
      setIsTogglingArchive(false);
    }
  };

  return (
    <div 
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm relative w-full ${
        openDropdownId === p.id ? 'z-[60]' : 'z-10'
      }`}
    >
      {syncing && <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px] z-20 pointer-events-none rounded-2xl" />}
      
      {/* Vertical Layout for Mobile Card */}
      <div className="flex flex-col p-4 gap-4 w-full">
        {/* Top: Thumbnail */}
        <div className="w-full h-48 shrink-0 bg-slate-200 relative overflow-hidden rounded-xl flex items-center justify-center">
          {p.imagenPortadaUrl ? (
            <img 
              src={p.imagenPortadaUrl} 
              alt={p.titulo} 
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="h-12 w-12 text-slate-300 shrink-0" />
          )}

          {/* Type Badge Overlay */}
          <div className="absolute top-3 left-3 z-20 max-w-[calc(100%-24px)] flex">
            <span className="text-[10px] font-black text-blue-600 bg-blue-50/90 backdrop-blur-sm px-2 py-1 rounded uppercase tracking-widest shadow-sm truncate">
              {p.tipoPropiedad}
            </span>
          </div>

          {/* Operation Badge */}
          <div className="absolute bottom-3 left-3 z-20 max-w-[calc(100%-24px)] flex">
            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm border border-white/20 rounded text-[10px] font-black uppercase tracking-wider text-slate-900 shadow-sm truncate">
              {p.operacion}
            </span>
          </div>
        </div>

        {/* Bottom: Details */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 w-full">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-start justify-between gap-2 w-full">
              <h3 className="text-base font-black text-slate-900 break-words min-w-0 flex-1 leading-tight">
                {p.titulo}
              </h3>
              {p.permissions?.canEditMasterData && !p.isArchivedForCurrentUser && (
                <button 
                  title="Editar"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPropiedadIdForEdit(p.id);
                  }}
                  className="h-8 w-8 shrink-0 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 active:bg-slate-100"
                >
                  <Pencil className="h-4 w-4 shrink-0" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 text-slate-500 min-w-0 w-full">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="text-xs font-bold flex-1 min-w-0 break-words italic">{p.sector}, {p.ciudad}</span>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full">
              {p.esCaptacionPropia && p.permissions?.canEditMasterData && (
                <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0 max-w-full">
                  <Handshake className="h-3 w-3 shrink-0" />
                  <span className="truncate">Captación</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-1 flex flex-col gap-3 w-full">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 w-full">
              <div className="flex flex-col flex-1 min-w-0 w-full">
                <span className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1 break-words min-w-0 flex-1 w-full">
                  {formatCurrency(p.precio)}
                </span>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 min-w-0 w-full">
                  <Handshake className="h-3 w-3 shrink-0" />
                  <span className="flex-1 min-w-0 break-words">Comisión: {p.porcentajeComision}%</span>
                </div>
              </div>
              <div className="flex gap-2 items-center shrink-0">
                <ArchiveToggleButton
                  isArchived={!!p.isArchivedForCurrentUser}
                  isToggling={isTogglingArchive}
                  onToggle={handleToggleArchive}
                  className="h-10 w-10 !p-0 shrink-0"
                />
                <button 
                  title="Ver"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetail(p.id);
                  }}
                  className="h-10 w-10 shrink-0 bg-blue-600 rounded-lg flex items-center justify-center text-white active:bg-blue-700 shadow-sm"
                >
                  <Plus className="h-5 w-5 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Dropdown Below (Full Width) */}
      <div className="border-t border-slate-100 p-2 w-full flex justify-center bg-slate-50/50 rounded-b-2xl">
        <PropiedadStatusDropdown
          propiedad={p}
          isUpdating={updatingId === p.id}
          isOpen={openDropdownId === p.id}
          onToggle={(open) => setOpenDropdownId(open ? p.id : null)}
          onStatusChange={handleStatusChange}
          dropdownRef={dropdownRef}
        />
      </div>
    </div>
  );
};
