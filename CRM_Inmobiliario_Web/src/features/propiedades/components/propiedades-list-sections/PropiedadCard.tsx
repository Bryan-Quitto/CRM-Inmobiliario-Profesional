import { Loader2, ChevronDown, Check, Handshake, Pencil, MapPin, Plus, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ESTADOS, formatCurrency } from '../../constants/propiedades';
import type { Propiedad } from '../../types';

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
  const getStatusStyles = (estado: string) => {
    const found = ESTADOS.find(e => e.value === estado);
    return found?.color || 'bg-slate-500 border-slate-400 text-white';
  };

  return (
    <div 
      className={`bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative ${
        openDropdownId === p.id ? 'z-[60]' : 'z-10'
      }`}
    >
      {syncing && <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px] pointer-events-none" />}
      
      <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 z-30">
        <div className="relative" ref={openDropdownId === p.id ? dropdownRef : null}>
          {updatingId === p.id ? (
            <div className="px-3 py-1 bg-white/90 backdrop-blur-md border border-white/20 rounded-full flex items-center gap-2 shadow-sm">
              <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">SYNC...</span>
            </div>
          ) : (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (p.permissions && !p.permissions.canChangeStatus) {
                    const responsable = p.activeTransaction?.agenteNombre || 'otro agente';
                    toast.warning('Acción restringida', {
                      description: `Esta propiedad está en proceso por ${responsable}.`
                    });
                    return;
                  }
                  setOpenDropdownId(openDropdownId === p.id ? null : p.id);
                }}
                className={`cursor-pointer px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm transition-all flex items-center gap-2 ${getStatusStyles(p.estadoComercial)} ${p.permissions && !p.permissions.canChangeStatus ? 'opacity-70 grayscale-[0.5]' : ''}`}
              >
                {p.estadoComercial}
                {(!p.permissions || p.permissions.canChangeStatus) && <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${openDropdownId === p.id ? 'rotate-180' : ''}`} />}
              </button>

              {openDropdownId === p.id && (!p.permissions || p.permissions.canChangeStatus) && (
                <div className="absolute left-0 mt-2 w-40 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] py-2 animate-in fade-in zoom-in duration-200 origin-top-left backdrop-blur-xl bg-white/95">
                  {ESTADOS.map((estado) => (
                    <button
                      key={estado.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(p.id, estado.value);
                      }}
                      className={`cursor-pointer w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 ${
                        p.estadoComercial === estado.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                      }`}
                    >
                      {estado.label}
                      {p.estadoComercial === estado.value && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <span className="px-3 py-1 bg-white/90 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-900 shadow-sm h-fit">
          {p.operacion}
        </span>

        {p.esCaptacionPropia && p.permissions?.canEditMasterData && (
          <div className="px-3 py-1 bg-blue-600/90 backdrop-blur-md text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl shadow-blue-600/20 border border-white/20 animate-in zoom-in-95 duration-500">
            <Handshake className="h-3 w-3" />
            Captación Propia
          </div>
        )}
      </div>

      {p.permissions?.canEditMasterData && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPropiedadIdForEdit(p.id);
          }}
          className="absolute top-4 right-4 z-40 h-8 w-8 bg-white/90 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:scale-110 transition-all shadow-sm opacity-0 group-hover:opacity-100 cursor-pointer"
          title="Editar Propiedad"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="h-56 bg-slate-200 relative overflow-hidden flex items-center justify-center rounded-t-3xl">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
        {p.imagenPortadaUrl ? (
          <img 
            src={p.imagenPortadaUrl} 
            alt={p.titulo} 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <ImageIcon className="h-12 w-12 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
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
          <button 
            onClick={() => handleOpenDetail(p.id)}
            className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all border border-slate-100 cursor-pointer hover:scale-110 active:scale-95 shadow-sm"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
