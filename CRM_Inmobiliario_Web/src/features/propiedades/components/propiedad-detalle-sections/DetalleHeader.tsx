import { useState } from 'react';
import { toast } from 'sonner';
import { X, Pencil, MessageSquare, MessageCircle, Copy, Check, RefreshCw } from 'lucide-react';
import { useSWRConfig } from 'swr';
import { generarCodigoCorto } from '../../api/generarCodigoCorto';
import PDFLinkInternal from '../PDFLinkInternal';
import { PropiedadStatusDropdown } from '../PropiedadStatusDropdown';
import type { Propiedad } from '../../types';
import { ArchiveToggleButton } from '@/components/ui/ArchiveToggleButton';

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
  handleMessengerShare: () => void;
  activeTab: 'detalle' | 'ia';
  onTabChange: (tab: 'detalle' | 'ia') => void;
  isTogglingArchive: boolean;
  onToggleArchive: () => void;
}

export const DetalleHeader = ({
  propiedad,
  onClose,
  onShowEditModal,
  isUpdatingStatus,
  isStatusDropdownOpen,
  setIsStatusDropdownOpen,
  handleStatusChange,
  handleWhatsAppShare,
  handleMessengerShare,
  activeTab,
  onTabChange,
  isTogglingArchive,
  onToggleArchive
}: DetalleHeaderProps) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { mutate } = useSWRConfig();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generarCodigoCorto(propiedad.id);
      toast.success('Código corto generado con éxito');
      mutate(`/propiedades/${propiedad.id}`);
      mutate('/propiedades');
    } catch {
      toast.error('Error al generar código corto');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (!propiedad.codigoCorto) return;
    navigator.clipboard.writeText(propiedad.codigoCorto);
    toast.success('Código copiado al portapapeles');
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
            <h2 className="text-xl font-black text-slate-900 tracking-tight contactoing-none">Detalles de la Propiedad</h2>
            <div className="flex items-center gap-3 mt-1 h-6">
              {propiedad.codigoCorto ? (
                  <button
                    title="Copiar para Anuncios de Meta (Payload)"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    Ref: {propiedad.codigoCorto}
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </button>
              ) : (
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    title="Generar Código Corto"
                    className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Generar Ref
                    <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                  </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!propiedad.isArchivedForCurrentUser && (
            <>
              <PDFLinkInternal propiedad={propiedad} />

                <button
                  title="Compartir por WhatsApp"
                  data-testid="btn-share-whatsapp"
                  onClick={handleWhatsAppShare}
                  className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md shadow-emerald-500/20 transition-all active:scale-90 group/wa cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5 fill-white group-hover/wa:scale-110 transition-transform" />
                </button>
                <button
                  title="Compartir por Messenger"
                  data-testid="btn-share-messenger"
                  onClick={handleMessengerShare}
                  className="h-7 w-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md shadow-blue-500/20 transition-all active:scale-90 group/ms cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5 fill-white group-hover/ms:scale-110 transition-transform" />
                </button>
            </>
          )}

          <ArchiveToggleButton
            isArchived={!!propiedad.isArchivedForCurrentUser}
            isToggling={isTogglingArchive}
            onToggle={onToggleArchive}
          />

          {!propiedad.isArchivedForCurrentUser && propiedad.permissions?.canEditMasterData && (
            <button
              data-testid="btn-edit-entity"
              onClick={onShowEditModal}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil className="h-3 w-3 text-indigo-600" />
              Editar
            </button>
          )}

          <div>
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

