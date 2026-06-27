import { Loader2 } from 'lucide-react';
import { DetalleHeader } from './propiedad-detalle-sections/DetalleHeader';
import { DetalleHeroInfo } from './propiedad-detalle-sections/DetalleHeroInfo';
import { DetalleStatsGrid } from './propiedad-detalle-sections/DetalleStatsGrid';
import { DetalleContentLayout } from './propiedad-detalle-sections/DetalleContentLayout';
import { DetalleGalleryManager } from './propiedad-detalle-sections/DetalleGalleryManager';
import { DetalleHistoryTimeline } from './propiedad-detalle-sections/DetalleHistoryTimeline';
import { DetalleModalsOrchestrator } from './propiedad-detalle-sections/DetalleModalsOrchestrator';
import { DetalleFaqManager } from './propiedad-detalle-sections/DetalleFaqManager';
import { formatCurrency, formatDate, type PropiedadDetalleLogic } from '../hooks/usePropiedadDetalleLogic';

interface Props {
  id: string;
  onClose: () => void;
  logic: PropiedadDetalleLogic;
}

export const PropiedadDetalleDesktop = ({ id, onClose, logic }: Props) => {
  const {
    activeTab, setActiveTab, user, propiedad, historial, syncing, isUpdatingStatus,
    isAddingSection, isCreatingInline, newSectionName, statusConfirmation, isClosingModalOpen,
    closingState, isStatusDropdownOpen, showEditModal, showReversionModal,
    setNewSectionName, setIsCreatingInline, setIsStatusDropdownOpen, setShowEditModal,
    setStatusConfirmation, setIsClosingModalOpen, setClosingState, setShowReversionModal,
    handleClosingConfirm, handleSetCover, handleDeleteMedia, handleAddSection,
    handleConfirmAddSection, handleDeleteSection, handleRenameSection, handleClearGallery,
    handleMoveSection, handleInlineUpdateNote, handleStatusChange, handleRelist,
    handleCancelTransaction, mutate, isTogglingArchive, handleToggleArchive,
    handleDragEnd, handleWhatsAppShare
  } = logic;

  if (!propiedad && syncing) {
    return (
      <div className="fixed inset-0 z-[200] hidden lg:flex justify-end">
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
    <div className="fixed inset-0 z-[200] hidden lg:flex justify-end">
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
          activeTab={activeTab}
          onTabChange={setActiveTab}
          handleWhatsAppShare={handleWhatsAppShare}
          isTogglingArchive={isTogglingArchive}
          onToggleArchive={handleToggleArchive}
        />

        <div className="p-8 space-y-12 pb-24">
          {activeTab === 'detalle' && (
            <>
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
                isArchived={propiedad.isArchivedForCurrentUser}
              />

              <DetalleHistoryTimeline
                historial={historial}
                handleInlineUpdateNote={handleInlineUpdateNote}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                isArchived={propiedad.isArchivedForCurrentUser}
              />
            </>
          )}

          {activeTab === 'ia' && (
            <DetalleFaqManager
              propiedadId={propiedad.id}
              canManage={!!propiedad.permissions?.canEditMasterData}
              currentAgenteId={user?.id ?? ''}
              isArchived={propiedad.isArchivedForCurrentUser}
            />
          )}
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
