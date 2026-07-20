import React, { useEffect } from 'react';
import { Database, Search, Box, CheckSquare, Square, File, Calendar, XCircle, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { GlobalStorageFilters, StorageFileLog } from '../../api/almacenamiento';
import ConfirmModal from '@/components/ConfirmModal';
import { TruncatedText } from '@/components/ui/TruncatedText';
import { CustomSelect } from '@/features/configuracion/components/TimeDurationInput';

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

const GlobalStorageHistoryPageDesktop: React.FC<Props> = ({
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
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [dontShowAgain, setDontShowAgain] = React.useState(false);

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
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
        if (!isLoadingMore && !isReachingEnd) {
          onLoadMore();
        }
      }
    };
    
    const container = document.getElementById('scroll-container-desktop');
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [isLoadingMore, isReachingEnd, onLoadMore]);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] -mt-4">
      {/* Header */}
      <div className="bg-white p-6 rounded-t-3xl border-b border-slate-100 flex flex-col gap-4 shadow-sm z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Database size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Historial Global</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {totalCount} registros encontrados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {selectedIds.size > 0 && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-rose-200 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 size={16} /> Eliminar ({selectedIds.size})
              </button>
            )}
            
            <button
              onClick={onSelectAll}
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              {isAllSelected ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} />}
              <span>Seleccionar Todo</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar por nombre..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          
          <div className="w-48">
            <CustomSelect
              value={filters.targetType}
              onChange={(val) => onFilterChange('targetType', val)}
              options={[
                { value: 'Todas', label: 'Todos los tipos' },
                { value: 'Propiedad', label: 'Propiedades' },
                { value: 'WhatsApp', label: 'WhatsApp' },
                { value: 'Perfil', label: 'Perfil' },
                { value: 'Agencia', label: 'Agencia' }
              ]}
              buttonClassName="w-full px-4 py-2 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-left text-sm font-bold transition-all outline-none flex items-center justify-between shadow-sm cursor-pointer text-slate-600"
            />
          </div>

          <div className="w-40">
            <CustomSelect
              value={filters.status || 'Todos'}
              onChange={(val) => onFilterChange('status', val)}
              options={[
                { value: 'Todos', label: 'Todos los estados' },
                { value: 'Activos', label: 'Activos' },
                { value: 'Eliminados', label: 'Eliminados' }
              ]}
              buttonClassName="w-full px-4 py-2 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-left text-sm font-bold transition-all outline-none flex items-center justify-between shadow-sm cursor-pointer text-slate-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-48">
              <CustomSelect
                value={filters.sortBy || 'uploadedAt'}
                onChange={(val) => onFilterChange('sortBy', val)}
                options={[
                  { value: 'uploadedAt', label: 'Por Fecha (Subida)' },
                  { value: 'deletedAt', label: 'Por Fecha (Eliminado)' },
                  { value: 'fileSizeBytes', label: 'Por Tamaño' }
                ]}
                buttonClassName="w-full px-4 py-2 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-left text-sm font-bold transition-all outline-none flex items-center justify-between shadow-sm cursor-pointer text-slate-600"
              />
            </div>
            
            <button
              onClick={() => onFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer"
              title={filters.sortOrder === 'asc' ? 'Orden Ascendente' : 'Orden Descendente'}
            >
              {filters.sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            </button>
          </div>

          <input 
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onFilterChange('startDate', e.target.value || null)}
            className="py-2 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
          />
          <input 
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onFilterChange('endDate', e.target.value || null)}
            className="py-2 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
          />
        </div>
      </div>

      {/* Content */}
      <div id="scroll-container-desktop" className="flex-1 overflow-y-auto bg-slate-50/50 p-6 rounded-b-3xl">
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((log) => (
              <div 
                key={log.id} 
                onClick={() => !log.isDeleted && onSelect(log.id)}
                className={`p-4 bg-white rounded-2xl border shadow-sm transition-all group flex flex-col sm:flex-row gap-4 justify-between
                  ${log.isDeleted ? 'border-slate-100 opacity-75' : 'border-slate-100 hover:border-indigo-200 cursor-pointer'}
                  ${selectedIds.has(log.id) ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/10' : ''}
                `}
              >
                <div className="flex items-start gap-4">
                  {!log.isDeleted && (
                    <div className="mt-1">
                      {selectedIds.has(log.id) ? (
                        <CheckSquare size={20} className="text-indigo-600" />
                      ) : (
                        <Square size={20} className="text-slate-300 group-hover:text-indigo-300 transition-colors" />
                      )}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${log.isDeleted ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                        {log.isDeleted ? 'Eliminado' : 'Activo'}
                      </span>
                      <TruncatedText className="text-sm font-black text-slate-900 flex-1" as="h4" lines={2}>
                        {log.friendlyName}
                      </TruncatedText>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                        <File size={14} className="text-slate-300" />
                        <span className="text-slate-600">{formatBytes(log.fileSizeBytes)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                        <Box size={14} className="text-indigo-300" />
                        <span className="text-indigo-600 uppercase">{log.targetType}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                        <Calendar size={14} className="text-slate-300" />
                        <span>Subido: {new Date(log.uploadedAt).toLocaleString()}</span>
                      </div>
                      
                      {log.isDeleted && log.deletedAt && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400">
                          <XCircle size={14} />
                          <span>Eliminado: {new Date(log.deletedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoadingMore && (
              <div className="flex items-center justify-center py-4 text-slate-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-2"></div>
                <span className="text-sm font-bold">Cargando más...</span>
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
            <span className="font-bold text-sm">Cargando historial...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <Box size={32} />
            </div>
            <p className="text-slate-500 font-bold mb-1">No hay historial para mostrar</p>
            <p className="text-sm text-slate-400">Intenta cambiar los filtros de búsqueda.</p>
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

export default GlobalStorageHistoryPageDesktop;
