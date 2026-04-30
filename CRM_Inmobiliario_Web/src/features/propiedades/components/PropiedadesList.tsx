import { SWRConfig, useSWRConfig } from 'swr';
import { Loader2, CheckCircle2, AlertCircle, X, Home } from 'lucide-react';
import { localStorageProvider } from '@/lib/swr';
import { usePropiedadesList } from '../hooks/usePropiedadesList';

// Sections
import { PropiedadesStatsHeader } from './propiedades-list-sections/PropiedadesStatsHeader';
import { PropiedadesFilters } from './propiedades-list-sections/PropiedadesFilters';
import { PropiedadesSkeletonList } from './propiedades-list-sections/PropiedadesSkeletonList';
import { PropiedadCard } from './propiedades-list-sections/PropiedadCard';
import { PropiedadesModalsOrchestrator } from './propiedades-list-sections/PropiedadesModalsOrchestrator';

const PropiedadesContent = () => {
  const { mutate: globalMutate } = useSWRConfig();
  const {
    propiedades,
    filteredPropiedades,
    stats,
    loading,
    syncing,
    searchQuery,
    setSearchQuery,
    filterEstado,
    setFilterEstado,
    isModalOpen,
    setIsModalOpen,
    notification,
    setNotification,
    updatingId,
    openDropdownId,
    setOpenDropdownId,
    statusConfirmation,
    setStatusConfirmation,
    closingPropiedad,
    setClosingPropiedad,
    showReversionModal,
    setShowReversionModal,
    selectedPropiedadId,
    selectedPropiedadIdForEdit,
    setSelectedPropiedadIdForEdit,
    handleOpenDetail,
    handleCloseDetail,
    handleStatusChange,
    handleClosingConfirm,
    handleCoverUpdate,
    mutate,
    dropdownRef
  } = usePropiedadesList();

  if (loading) {
    return <PropiedadesSkeletonList />;
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans antialiased relative pb-20">
      {/* Indicador de Sincronización UPSP */}
      {syncing && propiedades.length > 0 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Catálogo...</span>
          </div>
        </div>
      )}

      {notification && (
        <div className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-10 duration-300 ${
          notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="font-bold text-sm tracking-tight">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:bg-black/10 rounded-lg p-1 transition-all cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <PropiedadesFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterEstado={filterEstado}
        setFilterEstado={setFilterEstado}
        openDropdownId={openDropdownId}
        setOpenDropdownId={setOpenDropdownId}
        setIsModalOpen={setIsModalOpen}
        dropdownRef={dropdownRef}
      />

      <PropiedadesStatsHeader 
        total={stats.total} 
        venta={stats.venta} 
        alquiler={stats.alquiler} 
      />

      {filteredPropiedades.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-32 text-center shadow-sm flex flex-col items-center">
          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Home className="h-10 w-10 text-slate-200" />
          </div>
          <p className="text-xl font-bold text-slate-900">Sin resultados</p>
          <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
            No encontramos lo que buscas. Intenta con otros filtros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in duration-500">
          {filteredPropiedades.map((p) => (
            <PropiedadCard 
              key={p.id}
              propiedad={p}
              syncing={syncing}
              updatingId={updatingId}
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              handleOpenDetail={handleOpenDetail}
              handleStatusChange={handleStatusChange}
              setSelectedPropiedadIdForEdit={setSelectedPropiedadIdForEdit}
              dropdownRef={dropdownRef}
            />
          ))}
        </div>
      )}

      <PropiedadesModalsOrchestrator 
        propiedades={propiedades}
        selectedPropiedadId={selectedPropiedadId}
        handleCloseDetail={handleCloseDetail}
        handleCoverUpdate={handleCoverUpdate}
        selectedPropiedadIdForEdit={selectedPropiedadIdForEdit}
        setSelectedPropiedadIdForEdit={setSelectedPropiedadIdForEdit}
        mutate={mutate}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        setNotification={setNotification}
        statusConfirmation={statusConfirmation}
        setStatusConfirmation={setStatusConfirmation}
        handleStatusChange={handleStatusChange}
        closingPropiedad={closingPropiedad}
        setClosingPropiedad={setClosingPropiedad}
        handleClosingConfirm={handleClosingConfirm}
        showReversionModal={showReversionModal}
        setShowReversionModal={setShowReversionModal}
        globalMutate={globalMutate}
      />
    </div>
  );
};

export const PropiedadesList = () => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <PropiedadesContent />
    </SWRConfig>
  );
};
