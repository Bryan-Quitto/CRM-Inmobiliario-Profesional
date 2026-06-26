import { Handshake, Pencil, MapPin, Plus, Image as ImageIcon } from 'lucide-react';
import { formatCurrency } from '../../constants/propiedades';
import { PropiedadStatusDropdown } from '../PropiedadStatusDropdown';
import { togglePropertyArchive } from '../../api/togglePropertyArchive';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import type { Propiedad } from '../../types';
import { ArchiveToggleButton } from '@/components/ui/ArchiveToggleButton';

interface PropiedadCardProps {
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

export const PropiedadCard = ({
  propiedad: p,
  syncing,
  updatingId,
  openDropdownId,
  setOpenDropdownId,
  handleOpenDetail,
  handleStatusChange,
  setSelectedPropiedadIdForEdit,
  dropdownRef
}: PropiedadCardProps) => {
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
      className={`bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative ${
        openDropdownId === p.id ? 'z-[60]' : 'z-10'
      }`}
    >
      {syncing && <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px] z-20 pointer-events-none" />}
      
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 z-50 pointer-events-none">
        <div className="flex flex-wrap gap-2 pointer-events-auto">
          <PropiedadStatusDropdown
            propiedad={p}
            isUpdating={updatingId === p.id}
            isOpen={openDropdownId === p.id}
            onToggle={(open) => setOpenDropdownId(open ? p.id : null)}
            onStatusChange={handleStatusChange}
            dropdownRef={dropdownRef}
          />
          
          <span className="px-3 py-1 bg-white/90 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-900 shadow-sm h-fit">
            {p.operacion}
          </span>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          {p.permissions?.canEditMasterData && !p.isArchivedForCurrentUser && (
            <button 
              title="Editar Propiedad"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPropiedadIdForEdit(p.id);
              }}
              className="h-8 w-8 bg-white/90 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:scale-110 transition-all shadow-sm opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="h-56 bg-slate-200 relative overflow-hidden flex items-center justify-center rounded-t-3xl">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none"></div>
        {p.imagenPortadaUrl ? (
          <img 
            src={p.imagenPortadaUrl} 
            alt={p.titulo} 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <ImageIcon className="h-12 w-12 text-slate-300" />
        )}

        {p.esCaptacionPropia && p.permissions?.canEditMasterData && (
          <div className="absolute bottom-4 left-4 z-20 px-3 py-1 bg-blue-600/90 backdrop-blur-md text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl border border-white/20 pointer-events-none">
            <Handshake className="h-3 w-3" />
            Captación Propia
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-widest">
            {p.tipoPropiedad}
          </span>
        </div>
        
        <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate mb-1">
          {p.titulo}
        </h3>
        
        <div className="flex items-center gap-1.5 text-slate-500 mb-6">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-bold truncate italic">{p.sector}, {p.ciudad}</span>
        </div>

        <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(p.precio)}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase tracking-widest border border-blue-100">
                <Handshake className="h-2.5 w-2.5" />
                Comisión: {p.porcentajeComision}%
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <ArchiveToggleButton
              isArchived={!!p.isArchivedForCurrentUser}
              isToggling={isTogglingArchive}
              onToggle={handleToggleArchive}
            />
            <button 
              title="Ver Expediente"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetail(p.id);
              }}
              className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-blue-600 hover:text-white transition-all border border-slate-100 cursor-pointer hover:scale-110 active:scale-95 shadow-sm"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
