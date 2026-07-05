import { Loader2, Home, ChevronUp, ChevronDown } from 'lucide-react';
import { usePropiedadesListLogic } from '../hooks/usePropiedadesListLogic';

import { PropiedadesStatsHeader } from './propiedades-list-sections/PropiedadesStatsHeader';
import { PropiedadesFilters } from './propiedades-list-sections/PropiedadesFilters';
import { PropiedadesSkeletonList } from './propiedades-list-sections/PropiedadesSkeletonList';
import { PropiedadCard } from './propiedades-list-sections/PropiedadCard';


interface Props {
  logic: ReturnType<typeof usePropiedadesListLogic>;
}

export const PropiedadesListDesktop = ({ logic }: Props) => {
  const {
    propiedades,
    filteredPropiedades,
    paginatedPropiedades,
    stats,
    loading,
    syncing,
    searchQuery,
    setSearchQuery,
    filterEstado,
    setFilterEstado,
    filterTipo,
    setFilterTipo,
    isArchived,
    setIsArchived,
    advancedFilters,
    setAdvancedFilters,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    currentPage,
    setCurrentPage,
    totalPages,
    setIsModalOpen,
    updatingId,
    openDropdownId,
    setOpenDropdownId,
    setSelectedPropiedadIdForEdit,
    handleOpenDetail,
    handleStatusChange,
    dropdownRef
  } = logic;

  return (
    <div className="bg-slate-50 min-h-screen font-sans antialiased relative pb-20 hidden lg:block">
      {/* Indicador de Sincronización UPSP */}
      {syncing && propiedades.length > 0 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Catálogo...</span>
          </div>
        </div>
      )}

      <PropiedadesFilters 
        propiedades={propiedades}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterEstado={filterEstado}
        setFilterEstado={setFilterEstado}
        filterTipo={filterTipo}
        setFilterTipo={setFilterTipo}
        isArchived={isArchived}
        setIsArchived={setIsArchived}
        advancedFilters={advancedFilters}
        setAdvancedFilters={setAdvancedFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
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

      {loading ? (
        <PropiedadesSkeletonList />
      ) : filteredPropiedades.length === 0 ? (
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
          {paginatedPropiedades.map((p) => (
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

      {/* Pagination Controls */}
      {totalPages > 1 && (() => {
        const getVisiblePages = (current: number, total: number) => {
          if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
          if (current <= 3) return [1, 2, 3, 4, 5];
          if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
          return [current - 2, current - 1, current, current + 1, current + 2];
        };
        const visiblePages = getVisiblePages(currentPage, totalPages);

        return (
          <div className="mt-12 flex justify-center items-center gap-2 sm:gap-4 flex-wrap">
            <button 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed hidden sm:block' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm hidden sm:block'}`}
            >
              Primera
            </button>

            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'}`}
            >
              Anterior
            </button>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {visiblePages[0] > 1 && <span className="text-slate-400">...</span>}
              {visiblePages.map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center ${currentPage === page ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
                >
                  {page}
                </button>
              ))}
              {visiblePages[visiblePages.length - 1] < totalPages && <span className="text-slate-400">...</span>}
            </div>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'}`}
            >
              Siguiente
            </button>

            <button 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed hidden sm:block' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm hidden sm:block'}`}
            >
              Última
            </button>
          </div>
        );
      })()}

      {/* Floating Scroll Buttons */}
      <div className="fixed bottom-24 right-6 sm:right-8 hidden md:flex flex-col gap-2 z-[90]">
        {logic.showScrollTop && (
          <button 
            title="Ir al inicio"
            onClick={logic.scrollToTop}
            className="w-10 h-10 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}
        {logic.showScrollBottom && (
          <button 
            title="Ir al final"
            onClick={logic.scrollToBottom}
            className="w-10 h-10 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>


    </div>
  );
};
