import { Loader2, Info } from 'lucide-react';
import { DetalleHeader } from './propiedad-detalle-sections/DetalleHeader';
import { DetalleModalsOrchestrator } from './propiedad-detalle-sections/DetalleModalsOrchestrator';
import { DetalleFaqManager } from './propiedad-detalle-sections/DetalleFaqManager';
import { DetalleHeroInfo } from './propiedad-detalle-sections/DetalleHeroInfo';
import { DetalleStatsGrid } from './propiedad-detalle-sections/DetalleStatsGrid';
import { DetalleContentLayout } from './propiedad-detalle-sections/DetalleContentLayout';
import { DetalleGalleryManager } from './propiedad-detalle-sections/DetalleGalleryManager';
import { DetalleHistoryTimeline } from './propiedad-detalle-sections/DetalleHistoryTimeline';
import { formatCurrency, formatDate, type PropiedadDetalleLogic } from '../hooks/usePropiedadDetalleLogic';
import { TruncatedText } from '@/components/ui/TruncatedText';

interface Props {
  id: string;
  onClose: () => void;
  logic: PropiedadDetalleLogic;
}

export const PropiedadDetalleMobile = ({ id, onClose, logic }: Props) => {
  const {
    activeTab, setActiveTab, user, propiedad, historial, syncing, isUpdatingStatus,
    isAddingSection, isCreatingInline, newSectionName, newSectionDesc, statusConfirmation, isClosingModalOpen,
    closingState, isStatusDropdownOpen, showEditModal, showReversionModal,
    setNewSectionName, setNewSectionDesc, setIsCreatingInline, setIsStatusDropdownOpen, setShowEditModal,
    setStatusConfirmation, setIsClosingModalOpen, setClosingState, setShowReversionModal,
    handleClosingConfirm, handleSetCover, handleDeleteMedia, handleAddSection,
    handleConfirmAddSection, handleDeleteSection, handleRenameSection, handleClearGallery,
    handleMoveSection, handleInlineUpdateNote, handleStatusChange, handleRelist,
    handleCancelTransaction, mutate, isTogglingArchive, handleToggleArchive,
    handleDragEnd, handleWhatsAppShare, handleMessengerShare, handleCopyWhatsAppAdLink
  } = logic;

  if (!propiedad && syncing) {
    return (
      <div className="fixed inset-0 z-[200] flex lg:hidden bg-white items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-2 w-full px-2">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin shrink-0" />
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse text-center break-words w-full">Sincronizando...</p>
        </div>
      </div>
    );
  }

  if (!propiedad) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col lg:hidden bg-white overflow-hidden">
      {syncing && (
        <div className="absolute top-20 right-4 z-[100] animate-in slide-in-from-top-4">
          <div className="bg-slate-900/90 text-white px-2 py-2 rounded-full shadow-2xl flex items-center gap-2 max-w-[90vw]">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
            <TruncatedText as="span" className="text-[10px] font-black uppercase tracking-[0.2em] truncate">Sync...</TruncatedText>
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
        activeTab={activeTab}
        onTabChange={setActiveTab}
        handleWhatsAppShare={handleWhatsAppShare}
        handleCopyWhatsAppAdLink={handleCopyWhatsAppAdLink}
        handleMessengerShare={handleMessengerShare}
        isTogglingArchive={isTogglingArchive}
        onToggleArchive={handleToggleArchive}
      />

      <div className="flex-1 overflow-y-auto p-4 pb-12 space-y-8 w-full">
        {activeTab === 'detalle' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            {propiedad.bloqueoAdministrativo && (
              <div className="bg-blue-50 text-blue-800 p-4 mx-0 rounded-xl shadow-lg border border-blue-200 flex flex-col items-center gap-2 animate-in slide-in-from-top-4">
                <div className="bg-blue-100 p-2 rounded-full shrink-0">
                  <Info className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 text-center">
                  <h4 className="font-black uppercase tracking-wider text-sm mb-1">
                    Propiedad Congelada (Almacenamiento Bloqueado)
                  </h4>
                  <p className="text-xs font-medium text-blue-900">
                    Esta propiedad ha sido congelada manualmente por administración. Ya no es posible subir nuevos archivos, crear secciones o generar la ficha. Si tiene consultas sobre el motivo de este bloqueo, por favor contacte con administración.
                  </p>
                </div>
              </div>
            )}
            <DetalleHeroInfo propiedad={propiedad} formatCurrency={formatCurrency} />
            <DetalleStatsGrid propiedad={propiedad} formatDate={formatDate} />
            <DetalleContentLayout propiedad={propiedad} />
          </div>
        )}

        {activeTab === 'galeria' && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <DetalleGalleryManager
              id={id}
              propiedad={propiedad}
              isCreatingInline={isCreatingInline}
              isAddingSection={isAddingSection}
              newSectionName={newSectionName}
              newSectionDesc={newSectionDesc}
              setNewSectionName={setNewSectionName}
              setNewSectionDesc={setNewSectionDesc}
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
              isArchived={propiedad.isArchivedForCurrentUser}
              showOnly="general"
            />
          </div>
        )}

        {activeTab === 'secciones' && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <DetalleGalleryManager
              id={id}
              propiedad={propiedad}
              isCreatingInline={isCreatingInline}
              isAddingSection={isAddingSection}
              newSectionName={newSectionName}
              newSectionDesc={newSectionDesc}
              setNewSectionName={setNewSectionName}
              setNewSectionDesc={setNewSectionDesc}
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
              isArchived={propiedad.isArchivedForCurrentUser}
              showOnly="secciones"
            />
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <DetalleHistoryTimeline
              historial={historial}
              handleInlineUpdateNote={handleInlineUpdateNote}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
              isArchived={propiedad.isArchivedForCurrentUser}
            />
          </div>
        )}

        {activeTab === 'ia' && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <DetalleFaqManager
              propiedadId={propiedad.id}
              canManage={!!propiedad.permissions?.canEditMasterData}
              currentAgenteId={user?.id ?? ''}
              isArchived={propiedad.isArchivedForCurrentUser}
            />
          </div>
        )}
      </div>

      <DetalleModalsOrchestrator
        propiedad={propiedad}
        statusConfirmation={statusConfirmation}
        ownerReactivationConfirmation={logic.ownerReactivationConfirmation}
        showEditModal={showEditModal}
        isClosingModalOpen={isClosingModalOpen}
        closingState={closingState}
        showReversionModal={showReversionModal}
        setStatusConfirmation={setStatusConfirmation}
        setOwnerReactivationConfirmation={logic.setOwnerReactivationConfirmation}
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
