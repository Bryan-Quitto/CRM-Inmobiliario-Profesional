import { useState } from 'react';
import { Loader2, X, WifiOff, User, History } from 'lucide-react';

// Sections
import { ContactoHeader } from './contacto-detalle-sections/ContactoHeader';
import { ContactoProfileCard } from './contacto-detalle-sections/ContactoProfileCard';
import { ContactoInterestsManager } from './contacto-detalle-sections/ContactoInterestsManager';
import { ContactoPropertiesOwned } from './contacto-detalle-sections/ContactoPropertiesOwned';
import { ContactoTimelineManager } from './contacto-detalle-sections/ContactoTimelineManager';
import { ContactoModalsOrchestrator } from './contacto-detalle-sections/ContactoModalsOrchestrator';
import { ContactoTransactions } from './contacto-detalle-sections/ContactoTransactions';
import { MergeContactosModal } from './MergeContactosModal';
import { useContactoDetalle } from '../hooks/useContactoDetalle';

export const ContactoDetalleMobile = ({ logic }: { logic: ReturnType<typeof useContactoDetalle> }) => {
  const [activeTab, setActiveTab] = useState<'perfil' | 'historial'>('perfil');

  const {
    contacto,
    isLoading,
    error,
    propiedadesOptions,
    nuevaNota,
    setNuevaNota,
    tipoNota,
    setTipoNota,
    notaEnEdicion,
    setNotaEnEdicion,
    isSavingNota,
    searchHistorial,
    setSearchHistorial,
    filterTipoTimeline,
    setFilterTipoTimeline,
    idInteraccionABorrar,
    setIdInteraccionABorrar,
    updatingInteresId,
    propiedadPendienteId,
    setPropiedadPendienteId,
    nivelInteresPendiente,
    setNivelInteresPendiente,
    dropdownInteresOpenId,
    setDropdownInteresOpenId,
    vincularStatus,
    newCycleConfirmation,
    setNewCycleConfirmation,
    isUpdatingEtapa,
    activeDropdown,
    setActiveDropdown,
    idInteresABorrar,
    setIdInteresABorrar,
    isDeletingInteres,
    handleStageChange,
    executeStageChange,
    handleSaveNota,
    handleEditarNota,
    handleEliminarNota,
    handleVincularPropiedad,
    handleUpdateNivelInteres,
    handleDesvincular,
    historialFiltrado,
    navigate,
    mutate,
    isTogglingArchive,
    handleToggleArchive,
    isMergeModalOpen,
    setIsMergeModalOpen
  } = logic;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-2">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando expediente...</p>
      </div>
    );
  }

  if (error || !contacto) {
    const isNetworkError = error && (!error.response || error.code === 'ERR_NETWORK' || error.message === 'Network Error');

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-2 text-center">
        <div className={`h-12 w-12 ${isNetworkError ? 'bg-amber-50' : 'bg-rose-50'} rounded-full flex items-center justify-center mb-4`}>
          {isNetworkError ? (
            <WifiOff className="h-8 w-8 text-amber-500" />
          ) : (
            <X className="h-8 w-8 text-rose-500" />
          )}
        </div>
        <h2 className="text-base md:text-xl font-black text-slate-900 mb-2">
          {isNetworkError ? 'Pérdida de conexión' : 'Expediente no encontrado'}
        </h2>
        <p className="text-sm text-slate-500 max-w-xs mb-6">
          {isNetworkError 
            ? 'No se pudo cargar la información del contacto. Verifica tu conexión a internet.' 
            : 'El contacto que buscas no existe o ha sido eliminado.'}
        </p>
        <button 
          onClick={() => isNetworkError ? window.location.reload() : navigate('/contactos')}
          className="px-3 py-3 bg-slate-900 text-white font-black rounded-lg hover:bg-slate-800 transition-all cursor-pointer w-full max-w-xs"
        >
          {isNetworkError ? 'Reintentar' : 'Volver a Cartera'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans antialiased flex flex-col">
      <div className="sticky top-0 z-40 bg-slate-50">
        <ContactoHeader 
          contacto={contacto}
          isUpdatingEtapa={isUpdatingEtapa}
          activeDropdown={activeDropdown}
          setActiveDropdown={setActiveDropdown}
          handleStageChange={handleStageChange}
          navigate={navigate}
          onEdit={() => window.dispatchEvent(new CustomEvent('open-crear-contacto-modal', { detail: { action: 'edit', contacto } }))}
          onMerge={() => setIsMergeModalOpen(true)}
          isTogglingArchive={isTogglingArchive}
          onToggleArchive={handleToggleArchive}
        />

        {/* Mobile Tabs */}
        <div className="px-2 py-3 bg-white border-b border-slate-200 flex space-x-2 overflow-x-auto hide-scrollbar shadow-sm">
          <button 
            onClick={() => setActiveTab('perfil')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-2 rounded-lg font-bold text-sm transition-all cursor-pointer min-w-max ${activeTab === 'perfil' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <User className="h-4 w-4" />
            <span>Perfil y Datos</span>
          </button>
          <button 
            onClick={() => setActiveTab('historial')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-2 rounded-lg font-bold text-sm transition-all cursor-pointer min-w-max ${activeTab === 'historial' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <History className="h-4 w-4" />
            <span>Historial</span>
          </button>
        </div>
      </div>

      <div className="flex-1 px-2 py-3 space-y-3">
        {activeTab === 'perfil' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ContactoProfileCard contacto={contacto} />
            
            {contacto.esPropietario && (
              <ContactoPropertiesOwned 
                contacto={contacto} 
              />
            )}

            {contacto.esContacto && (
              <ContactoInterestsManager 
                contacto={contacto}
                propiedadesOptions={propiedadesOptions}
                propiedadPendienteId={propiedadPendienteId}
                setPropiedadPendienteId={setPropiedadPendienteId}
                nivelInteresPendiente={nivelInteresPendiente}
                setNivelInteresPendiente={setNivelInteresPendiente}
                vincularStatus={vincularStatus}
                handleVincularPropiedad={handleVincularPropiedad}
                updatingInteresId={updatingInteresId}
                idInteresABorrar={idInteresABorrar}
                setIdInteresABorrar={setIdInteresABorrar}
                isDeletingInteres={isDeletingInteres}
                dropdownInteresOpenId={dropdownInteresOpenId}
                setDropdownInteresOpenId={setDropdownInteresOpenId}
                handleUpdateNivelInteres={handleUpdateNivelInteres}
                handleDesvincular={handleDesvincular}
              />
            )}

            {contacto.esContacto && (
              <ContactoTransactions contacto={contacto} />
            )}
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ContactoTimelineManager 
              nuevaNota={nuevaNota}
              setNuevaNota={setNuevaNota}
              tipoNota={tipoNota}
              setTipoNota={setTipoNota}
              notaEnEdicion={notaEnEdicion}
              setNotaEnEdicion={setNotaEnEdicion}
              isSavingNota={isSavingNota}
              handleSaveNota={handleSaveNota}
              searchHistorial={searchHistorial}
              setSearchHistorial={setSearchHistorial}
              filterTipoTimeline={filterTipoTimeline}
              setFilterTipoTimeline={setFilterTipoTimeline}
              historialFiltrado={historialFiltrado}
              idInteraccionABorrar={idInteraccionABorrar}
              setIdInteraccionABorrar={setIdInteraccionABorrar}
              handleEditarNota={handleEditarNota}
              handleEliminarNota={handleEliminarNota}
              isArchived={contacto.isArchivedForCurrentUser}
            />
          </div>
        )}
      </div>

      <ContactoModalsOrchestrator 
        contacto={contacto}
        newCycleConfirmation={newCycleConfirmation}
        setNewCycleConfirmation={setNewCycleConfirmation}
        executeStageChange={executeStageChange}
      />

      {isMergeModalOpen && (
        <MergeContactosModal 
          contactoOriginal={contacto}
          onClose={() => setIsMergeModalOpen(false)}
          onSuccess={(nuevoPrincipalId: string) => {
            setIsMergeModalOpen(false);
            if (nuevoPrincipalId !== contacto.id) {
              navigate(`/contactos/${nuevoPrincipalId}`);
            } else {
              mutate();
            }
          }}
        />
      )}
    </div>
  );
};
