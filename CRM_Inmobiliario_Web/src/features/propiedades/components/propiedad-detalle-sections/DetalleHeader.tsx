import { X, Pencil, MessageSquare } from 'lucide-react';
import PDFLinkInternal from '../PDFLinkInternal';
import { PropiedadStatusDropdown } from '../PropiedadStatusDropdown';
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
  activeTab: 'detalle' | 'ia';
  onTabChange: (tab: 'detalle' | 'ia') => void;
}

export const DetalleHeader = ({
  id,
  propiedad,
  onClose,
  onShowEditModal,
  isUpdatingStatus,
  isStatusDropdownOpen,
  setIsStatusDropdownOpen,
  handleStatusChange,
  handleWhatsAppShare,
  activeTab,
  onTabChange,
}: DetalleHeaderProps) => {
  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="px-6 py-4 flex items-center justify-between">
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

          <PropiedadStatusDropdown
            propiedad={propiedad}
            isUpdating={isUpdatingStatus}
            isOpen={isStatusDropdownOpen}
            onToggle={setIsStatusDropdownOpen}
            onStatusChange={(_id, status) => handleStatusChange(status)}
            variant="header"
          />
        </div>
      </div>

      {/* Tab pills: Detalles | IA */}
      <div className="flex gap-1 px-6 pb-3">
        <button
          onClick={() => onTabChange('detalle')}
          className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'detalle'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          Detalles
        </button>
        <button
          onClick={() => onTabChange('ia')}
          className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'ia'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          IA
        </button>
      </div>
    </div>
  );
};
