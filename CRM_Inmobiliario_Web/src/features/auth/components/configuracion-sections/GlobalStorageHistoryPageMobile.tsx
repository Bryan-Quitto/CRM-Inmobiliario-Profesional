import React, { useEffect } from 'react';
import { Search, Filter, Box, CheckSquare, Square, File, Calendar, Trash2, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react';
import type { GlobalStorageFilters, StorageFileLog } from '../../api/almacenamiento';
import ConfirmModal from '@/components/ConfirmModal';
import { TruncatedText } from '@/components/ui/TruncatedText';
import { CustomSelect } from '@/features/configuracion/components/TimeDurationInput';
import { useNavigate } from 'react-router-dom';

interface Props {
  history: StorageFileLog[];
  totalCount: number;
  filters: GlobalStorageFilters;
  onFilterChange: (key: keyof GlobalStorageFilters, value: string | null) => void;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  isDeleting: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isReachingEnd: boolean;
  onLoadMore: () => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const GlobalStorageHistoryPageMobile: React.FC<Props> = ({
  history,
  totalCount,
  filters,
  onFilterChange,
  selectedIds,
  onSelect,
  onSelectAll,
  onDeleteSelected,
  isDeleting,
  isLoading,
  isLoadingMore,
  isReachingEnd,
  onLoadMore
}) => {
  const navigate = useNavigate();
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [dontShowAgain, setDontShowAgain] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  
  const activeCount = history.filter(h => !h.isDeleted).length;
  const isAllSelected = selectedIds.size > 0 && selectedIds.size === activeCount;

  const handleDelete = () => {
    if (selectedIds.size === 0) return;
    const skipWarning = localStorage.getItem('skipStorageDeleteWarning') === 'true';
    if (skipWarning) {
      onDeleteSelected();
    } else {
      setIsConfirmOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (dontShowAgain) {
      localStorage.setItem('skipStorageDeleteWarning', 'true');
    }
    setIsConfirmOpen(false);
    onDeleteSelected();
  };

  // Infinite scroll intersection observer
  useEffect(() => {
    const handleScroll = () => {
      const isBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
      if (isBottom && !isLoadingMore && !isReachingEnd) {
        onLoadMore();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, isReachingEnd, onLoadMore]);

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-slate-50">
      {/* Header Fijo */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Historial Global</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {totalCount} registros
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl transition-colors ${showFilters ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}
          >
            <Filter size={18} />
          </button>
        </div>

        {/* Filters Panel Expandible */}
        {showFilters && (
          <div className="flex flex-col gap-3 pb-3 animate-in slide-in-from-top-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Buscar por nombre..."
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              />
            </div>
            
            <CustomSelect
              value={filters.status || 'Todos'}
              onChange={(val) => onFilterChange('status', val)}
              options={[
                { value: 'Todos', label: 'Todos los estados' },
                { value: 'Activos', label: 'Activos' },
                { value: 'Eliminados', label: 'Eliminados' }
              ]}
              buttonClassName="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none flex items-center justify-between cursor-pointer"
            />
            
            <div className="grid grid-cols-2 gap-2">
              <CustomSelect
                value={filters.targetType}
                onChange={(val) => onFilterChange('targetType', val)}
                options={[
                  { value: 'Todas', label: 'Todos' },
                  { value: 'Propiedad', label: 'Propiedades' },
                  { value: 'WhatsApp', label: 'WhatsApp' },
                  { value: 'Perfil', label: 'Perfil' },
                  { value: 'Agencia', label: 'Agencia' }
                ]}
                buttonClassName="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none flex items-center justify-between cursor-pointer"
              />
              
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <CustomSelect
                    value={filters.sortBy || 'uploadedAt'}
                    onChange={(val) => onFilterChange('sortBy', val)}
                    options={[
                      { value: 'uploadedAt', label: 'Por Fecha (Subida)' },
                      { value: 'deletedAt', label: 'Por Fecha (Eliminado)' },
                      { value: 'fileSizeBytes', label: 'Por Tamaño' }
                    ]}
                    buttonClassName="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none flex items-center justify-between cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => onFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 cursor-pointer"
                  title={filters.sortOrder === 'asc' ? 'Orden Ascendente' : 'Orden Descendente'}
                >
                  {filters.sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input 
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => onFilterChange('startDate', e.target.value || null)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
              <input 
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => onFilterChange('endDate', e.target.value || null)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Acciones Rápidas */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer"
          >
            {isAllSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
            <span>Todos</span>
          </button>
          
          {selectedIds.size > 0 && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer"
            >
              <Trash2 size={12} /> Eliminar ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="flex-1 p-4">
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((log) => (
              <div 
                key={log.id} 
                onClick={() => !log.isDeleted && onSelect(log.id)}
                className={`p-3 bg-white rounded-xl border shadow-sm flex gap-3
                  ${log.isDeleted ? 'opacity-75 bg-slate-50/50' : ''}
                  ${selectedIds.has(log.id) ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/10' : 'border-slate-200'}
                `}
              >
                {!log.isDeleted && (
                  <div className="mt-0.5">
                    {selectedIds.has(log.id) ? (
                      <CheckSquare size={18} className="text-indigo-600" />
                    ) : (
                      <Square size={18} className="text-slate-300" />
                    )}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${log.isDeleted ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                      {log.isDeleted ? 'Eliminado' : 'Activo'}
                    </span>
                    <TruncatedText className="text-sm font-black text-slate-900" as="h4" lines={2}>
                      {log.friendlyName}
                    </TruncatedText>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                      <File size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{formatBytes(log.fileSizeBytes)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600">
                      <Box size={14} className="text-indigo-300 shrink-0" />
                      <span className="text-indigo-600 uppercase truncate">{log.targetType}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 col-span-2">
                      <Calendar size={12} className="shrink-0" />
                      <span className="truncate">{new Date(log.uploadedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoadingMore && (
              <div className="flex items-center justify-center py-4 text-slate-400">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mr-2"></div>
                <span className="text-xs font-bold">Cargando más...</span>
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            <span className="font-bold text-sm">Cargando...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mb-3">
              <Box size={24} />
            </div>
            <p className="text-slate-600 font-bold text-sm mb-1">Sin resultados</p>
            <p className="text-xs text-slate-400">Prueba cambiando los filtros</p>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Liberar Espacio"
        description="Advertencia: Eliminar estos archivos también los removerá permanentemente de las propiedades, perfiles o chats correspondientes (con excepción de los PDFs, que los puede volver a generar). ¿Deseas continuar?"
        confirmText="Sí, liberar espacio"
        type="danger"
      >
        <label className="flex items-center justify-center gap-2 cursor-pointer mt-2 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
          <input 
            type="checkbox" 
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
          />
          <span className="text-xs font-bold">Ya no volver a mostrar esta advertencia</span>
        </label>
      </ConfirmModal>
    </div>
  );
};

export default GlobalStorageHistoryPageMobile;
