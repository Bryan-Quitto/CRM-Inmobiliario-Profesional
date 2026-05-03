import { Loader2, X } from 'lucide-react';
import { useContactoDetalle } from '../hooks/useContactoDetalle';

// Sections
import { ContactoHeader } from './contacto-detalle-sections/ContactoHeader';
import { ContactoProfileCard } from './contacto-detalle-sections/ContactoProfileCard';
import { ContactoInterestsManager } from './contacto-detalle-sections/ContactoInterestsManager';
import { ContactoPropertiesOwned } from './contacto-detalle-sections/ContactoPropertiesOwned';
import { ContactoTimelineManager } from './contacto-detalle-sections/ContactoTimelineManager';
import { ContactoModalsOrchestrator } from './contacto-detalle-sections/ContactoModalsOrchestrator';

export const ContactoDetalle = () => {
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
    isClosingModalOpen,
    setIsClosingModalOpen,
    isUpdatingEtapa,
    activeDropdown,
    setActiveDropdown,
    revertConfirmation,
    setRevertConfirmation,
    idInteresABorrar,
    setIdInteresABorrar,
    isDeletingInteres,
    handleRevertStatus,
    handleStageChange,
    handleClosingConfirm,
    handleSaveNota,
    handleEditarNota,
    handleEliminarNota,
    handleVincularPropiedad,
    handleUpdateNivelInteres,
    handleDesvincular,
    historialFiltrado,
    navigate
  } = useContactoDetalle();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Cargando expediente...</p>
      </div>
    );
  }

  if (error || !contacto) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
          <X className="h-10 w-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Expediente no encontrado</h2>
        <p className="text-slate-500 max-w-xs mb-8">El contacto que buscas no existe o ha sido eliminado.</p>
        <button 
          onClick={() => navigate('/contactos')}
          className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
        >
          Volver a Cartera
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans antialiased">
      <ContactoHeader 
        contacto={contacto}
        isUpdatingEtapa={isUpdatingEtapa}
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
        handleStageChange={handleStageChange}
        navigate={navigate}
      />

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <ContactoProfileCard contacto={contacto} />
          
          {contacto.esPropietario && (
            <ContactoPropertiesOwned 
              contacto={contacto} 
              onNavigate={navigate} 
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
              navigate={navigate}
            />
          )}
        </div>

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
        />
      </div>

      <ContactoModalsOrchestrator 
        contacto={contacto}
        isClosingModalOpen={isClosingModalOpen}
        setIsClosingModalOpen={setIsClosingModalOpen}
        handleClosingConfirm={handleClosingConfirm}
        revertConfirmation={revertConfirmation}
        setRevertConfirmation={setRevertConfirmation}
        handleRevertStatus={handleRevertStatus}
      />
    </div>
  );
};
