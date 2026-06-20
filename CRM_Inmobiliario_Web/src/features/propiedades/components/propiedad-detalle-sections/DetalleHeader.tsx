import { useState } from 'react';
import { X, Pencil, MessageSquare, Copy, Check, Loader2 } from 'lucide-react';
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
  isTogglingArchive: boolean;
  onToggleArchive: () => void;
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
  isTogglingArchive,
  onToggleArchive
}: DetalleHeaderProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!propiedad.codigoCorto) return;
    navigator.clipboard.writeText(propiedad.codigoCorto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900 cursor-pointer">
            <X className="h-6 w-6" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight contactoing-none">Detalles del Inmueble</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {id.split('-')[0]}</p>
              {propiedad.codigoCorto && (
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:bg-indigo-100 transition-colors cursor-pointer"
                  title="Copiar para Anuncios de Meta (Payload)"
                >
                  Ref: {propiedad.codigoCorto}
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!propiedad.isArchivedForCurrentUser && (
            <>
              <PDFLinkInternal propiedad={propiedad} />

              <button
                data-testid="btn-share-whatsapp"
                onClick={handleWhatsAppShare}
                className="h-9 w-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all active:scale-90 group/wa cursor-pointer"
                title="Compartir por WhatsApp"
              >
                <MessageSquare className="h-4 w-4 fill-white group-hover/wa:scale-110 transition-transform" />
              </button>
            </>
          )}

          <button 
            data-testid="btn-toggle-archive"
            onClick={onToggleArchive}
            disabled={isTogglingArchive}
            className={`px-4 py-1.5 font-black text-[10px] uppercase tracking-widest rounded-full transition-all shadow-sm border flex items-center gap-2 cursor-pointer ${
              propiedad.isArchivedForCurrentUser 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isTogglingArchive ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : propiedad.isArchivedForCurrentUser ? (
              'Desarchivar'
            ) : (
              'Archivar'
            )}
          </button>

          {!propiedad.isArchivedForCurrentUser && propiedad.permissions?.canEditMasterData && (
            <button
              data-testid="btn-edit-entity"
              onClick={onShowEditModal}
              className="px-4 py-1.5 bg-white border-2 border-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Pencil className="h-3 w-3 text-indigo-600" />
              Editar
            </button>
          )}

          <div className={propiedad.isArchivedForCurrentUser ? 'opacity-50 pointer-events-none' : ''}>
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
