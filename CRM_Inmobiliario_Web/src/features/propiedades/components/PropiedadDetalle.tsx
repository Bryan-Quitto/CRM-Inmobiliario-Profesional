import { SWRConfig } from 'swr';
import { Loader2 } from 'lucide-react';
import type { DropResult } from '@hello-pangea/dnd';
import { localStorageProvider } from '@/lib/swr';
import { usePropiedadDetalle } from '../hooks/usePropiedadDetalle';
import { DetalleHeader } from './propiedad-detalle-sections/DetalleHeader';
import { DetalleHeroInfo } from './propiedad-detalle-sections/DetalleHeroInfo';
import { DetalleStatsGrid } from './propiedad-detalle-sections/DetalleStatsGrid';
import { DetalleContentLayout } from './propiedad-detalle-sections/DetalleContentLayout';
import { DetalleGalleryManager } from './propiedad-detalle-sections/DetalleGalleryManager';
import { DetalleHistoryTimeline } from './propiedad-detalle-sections/DetalleHistoryTimeline';
import { DetalleModalsOrchestrator } from './propiedad-detalle-sections/DetalleModalsOrchestrator';

interface PropiedadDetalleProps {
  id: string;
  onClose: () => void;
  onCoverUpdated?: (newUrl: string) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(dateString));
};

const PropiedadDetalleContent = ({ id, onClose, onCoverUpdated }: PropiedadDetalleProps) => {
  const {
    propiedad,
    historial,
    syncing,
    isUpdatingStatus,
    isAddingSection,
    isCreatingInline,
    newSectionName,
    statusConfirmation,
    isClosingModalOpen,
    closingState,
    isStatusDropdownOpen,
    showEditModal,
    isReordering,
    transactionMenuOpen,
    showReversionModal,
    setNewSectionName,
    setIsCreatingInline,
    setIsStatusDropdownOpen,
    setShowEditModal,
    setTransactionMenuOpen,
    setStatusConfirmation,
    setIsClosingModalOpen,
    setClosingState,
    setShowReversionModal,
    handleClosingConfirm,
    handleSetCover,
    handleDeleteMedia,
    handleAddSection,
    handleConfirmAddSection,
    handleDeleteSection,
    handleRenameSection,
    handleClearGallery,
    handleReorder,
    handleMoveSection,
    handleDeleteTransaction,
    handleInlineUpdateNote,
    handleStatusChange,
    handleRelist,
    handleCancelTransaction,
    mutate,
  } = usePropiedadDetalle({ id, onCoverUpdated });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !propiedad?.secciones || isReordering) return;
    if (result.destination.index === result.source.index) return;

    const ids = propiedad.secciones.map(s => s.id);
    const [reorderedItem] = ids.splice(result.source.index, 1);
    ids.splice(result.destination.index, 0, reorderedItem);

    handleReorder(ids);
  };

  if (!propiedad && syncing) {
    return (
      <div className="fixed inset-0 z-[200] flex justify-end">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
        <div className="relative w-full md:w-[700px] lg:w-[850px] bg-white h-full shadow-2xl flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Sincronizando expediente...</p>
        </div>
      </div>
    );
  }

  if (!propiedad) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300 cursor-pointer" onClick={onClose} />

      <div className="relative w-full md:w-[700px] lg:w-[850px] bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500 ease-out">
        {syncing && (
          <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-top-4 duration-300">
            <div className="bg-slate-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando...</span>
            </div>
          </div>
        )}

        <DetalleHeader
          id={id}
          propiedad={propiedad}
          onClose={onClose}
          onShowEditModal={() => setShowEditModal(true)}
          isUpdatingStatus={isUpdatingStatus}
          isStatusDropdownOpen={isStatusDropdownOpen}
          setIsStatusDropdownOpen={setIsStatusDropdownOpen}
          handleStatusChange={handleStatusChange}
          handleWhatsAppShare={() => {
            const emojiMap: Record<string, string> = {
              'Casa': '\u{1F3E0}', 'Departamento': '\u{1F3E2}', 'Oficina': '\u{1F4BC}', 
              'Terreno': '\u{1F4D0}', 'Local Comercial': '\u{1F3EA}', 'Suite': '\u{2728}', 
              'Galpón': '\u{1F3ED}', 'Bodega': '\u{1F4E6}', 'Hotel': '\u{1F3E8}'
            };
            const emojiTipo = emojiMap[propiedad.tipoPropiedad] || '\u{1F3E0}';
            const e = { wave: '\u{1F44B}', sparkle: '\u{2728}', money: '\u{1F4B0}', pin: '\u{1F4CD}', clipboard: '\u{1F4CB}', bed: '\u{1F6CF}', bath: '\u{1F6C1}', ruler: '\u{1F4CF}', smile: '\u{1F60A}' };
            let message = `¡Hola! ${e.wave} Mira esta increíble propiedad:\n\n*${propiedad.titulo.toUpperCase()}* ${emojiTipo}${e.sparkle}\n\n${e.money} *Precio:* ${formatCurrency(propiedad.precio)}\n${e.pin} *Ubicación:* ${propiedad.sector}, ${propiedad.ciudad}\n${e.clipboard} *Operación:* ${propiedad.operacion}\n`;
            if (['Casa', 'Departamento', 'Suite', 'Hotel'].includes(propiedad.tipoPropiedad)) { message += `${e.bed} *Habitaciones:* ${propiedad.habitaciones}\n${e.bath} *Baños:* ${propiedad.banos}\n`; }
            message += `${e.ruler} *Área Total:* ${propiedad.areaTotal} m²\n`;
            if (propiedad.urlRemax) message += `\nVer más: ${propiedad.urlRemax}\n`;
            message += `\n¿Te gustaría visitarla? ${e.smile}`;
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
          }}
        />

        <div className="p-8 space-y-12 pb-24">
          <DetalleHeroInfo propiedad={propiedad} formatCurrency={formatCurrency} />
          <DetalleStatsGrid propiedad={propiedad} formatDate={formatDate} />
          <DetalleContentLayout propiedad={propiedad} />
          
          <DetalleGalleryManager
            id={id}
            propiedad={propiedad}
            isCreatingInline={isCreatingInline}
            isAddingSection={isAddingSection}
            newSectionName={newSectionName}
            setNewSectionName={setNewSectionName}
            setIsCreatingInline={setIsCreatingInline}
            handleAddSection={handleAddSection}
            handleConfirmAddSection={handleConfirmAddSection}
            handleSetCover={handleSetCover}
            handleDeleteMedia={handleDeleteMedia}
            handleClearGallery={handleClearGallery}
            handleDeleteSection={handleDeleteSection}
            handleRenameSection={handleRenameSection}
            handleMoveSection={handleMoveSection}
            handleDragEnd={handleDragEnd}
            mutate={() => mutate()}
          />

          <DetalleHistoryTimeline
            historial={historial}
            transactionMenuOpen={transactionMenuOpen}
            setTransactionMenuOpen={setTransactionMenuOpen}
            handleDeleteTransaction={handleDeleteTransaction}
            handleInlineUpdateNote={handleInlineUpdateNote}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>

      <DetalleModalsOrchestrator
        propiedad={propiedad}
        statusConfirmation={statusConfirmation}
        showEditModal={showEditModal}
        isClosingModalOpen={isClosingModalOpen}
        closingState={closingState}
        showReversionModal={showReversionModal}
        setStatusConfirmation={setStatusConfirmation}
        setShowEditModal={setShowEditModal}
        setIsClosingModalOpen={setIsClosingModalOpen}
        setClosingState={setClosingState}
        setShowReversionModal={setShowReversionModal}
        handleStatusChange={handleStatusChange}
        handleClosingConfirm={handleClosingConfirm}
        handleRelist={handleRelist}
        handleCancelTransaction={handleCancelTransaction}
        mutate={() => mutate()}
      />
    </div>
  );
};

export const PropiedadDetalle = (props: PropiedadDetalleProps) => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <PropiedadDetalleContent {...props} />
    </SWRConfig>
  );
};
