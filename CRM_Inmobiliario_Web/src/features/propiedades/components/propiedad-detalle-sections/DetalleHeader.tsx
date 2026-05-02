import { X, Pencil, MessageSquare, ChevronDown, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PDFLinkInternal from '../PDFLinkInternal';
import type { Propiedad } from '../../types';

interface DetalleHeaderProps {
  id: string;
  propiedad: Propiedad;
  onClose: () => void;
  onShowEditModal: () => void;
  isUpdatingStatus: boolean;
  isStatusDropdownOpen: boolean;
  setIsStatusDropdownOpen: (open: boolean) => void;
  handleStatusChange: (status: string) => void;
  handleWhatsAppShare: () => void;
}

const ESTADOS = [
  { label: 'Disponible', value: 'Disponible' },
  { label: 'Reservada', value: 'Reservada' },
  { label: 'Vendida', value: 'Vendida' },
  { label: 'Alquilada', value: 'Alquilada' },
  { label: 'Inactiva', value: 'Inactiva' },
];

export const DetalleHeader = ({
  id,
  propiedad,
  onClose,
  onShowEditModal,
  isUpdatingStatus,
  isStatusDropdownOpen,
  setIsStatusDropdownOpen,
  handleStatusChange,
  handleWhatsAppShare
}: DetalleHeaderProps) => {
  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900 cursor-pointer">
          <X className="h-6 w-6" />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight contactoing-none">Detalles del Inmueble</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {id.split('-')[0]}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <PDFLinkInternal propiedad={propiedad} />

        <button
          onClick={handleWhatsAppShare}
          className="h-9 w-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all active:scale-90 group/wa cursor-pointer"
          title="Compartir por WhatsApp"
        >
          <MessageSquare className="h-4 w-4 fill-white group-hover/wa:scale-110 transition-transform" />
        </button>

        {propiedad.permissions?.canEditMasterData && (
          <button
            onClick={onShowEditModal}
            className="px-4 py-1.5 bg-white border-2 border-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Pencil className="h-3 w-3 text-indigo-600" />
            Editar
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => {
              if (propiedad.permissions && !propiedad.permissions.canChangeStatus) {
                const responsable = propiedad.activeTransaction?.agenteNombre || 'otro agente';
                toast.warning('Acción restringida', {
                  description: `Esta propiedad está en proceso por ${responsable}.`
                });
                return;
              }
              setIsStatusDropdownOpen(!isStatusDropdownOpen);
            }}
            disabled={isUpdatingStatus}
            className={`cursor-pointer px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${propiedad.estadoComercial === 'Disponible' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white'} ${propiedad.permissions && !propiedad.permissions.canChangeStatus ? 'opacity-70 grayscale-[0.5]' : ''}`}
          >
            {isUpdatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : propiedad.estadoComercial}
            {(!propiedad.permissions || propiedad.permissions.canChangeStatus) && <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />}
          </button>
          {isStatusDropdownOpen && (!propiedad.permissions || propiedad.permissions.canChangeStatus) && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
              {ESTADOS.map((estado) => (
                <button
                  key={estado.value}
                  onClick={() => handleStatusChange(estado.value)}
                  className={`cursor-pointer w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 ${propiedad.estadoComercial === estado.value ? 'text-indigo-600 bg-indigo-50/30' : 'text-slate-600'}`}
                >
                  {estado.label}
                  {propiedad.estadoComercial === estado.value && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
