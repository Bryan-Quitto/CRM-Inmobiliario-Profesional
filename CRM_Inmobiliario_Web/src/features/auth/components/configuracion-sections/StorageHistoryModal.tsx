import React, { useState } from 'react';
import { X, Database, Calendar, File, Box, XCircle, Trash2, CheckSquare, Square } from 'lucide-react';
import { useStorageHistory, deleteStorageFiles } from '../../api/almacenamiento';
import ConfirmModal from '../../../../components/ConfirmModal';
import { useGlobalMutationLock } from '@/contexts/GlobalMutationLockContext';

interface StorageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const StorageHistoryModal: React.FC<StorageHistoryModalProps> = ({ isOpen, onClose }) => {
  const { withOptimisticLock } = useGlobalMutationLock();
  const { history, isLoading, mutate } = useStorageHistory();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Reset state on close action instead of effect
  const handleClose = () => {
    setSelectedIds(new Set());
    setIsConfirmOpen(false);
    setDontShowAgain(false);
    onClose();
  };

  if (!isOpen) return null;

  const activeLogs = history?.filter(h => !h.isDeleted) || [];
  const hasActiveLogs = activeLogs.length > 0;
  const isAllSelected = hasActiveLogs && selectedIds.size === activeLogs.length;

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeLogs.map(h => h.id)));
    }
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) return;
    
    const skipWarning = localStorage.getItem('skipStorageDeleteWarning') === 'true';
    if (skipWarning) {
      executeDelete();
    } else {
      setIsConfirmOpen(true);
    }
  };

  const executeDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const idsToDelete = Array.from(selectedIds);
    
    // 1. Acciones Inmediatas (Cerrar modal, guardar preferencia, limpiar selección)
    if (dontShowAgain) {
      localStorage.setItem('skipStorageDeleteWarning', 'true');
    }
    setSelectedIds(new Set());
    setIsConfirmOpen(false);

    // 2. Optimistic UI (Zero Wait)
    try {
      await withOptimisticLock(mutate(
        // Petición real asíncrona
        deleteStorageFiles(idsToDelete).then(() => {
          // Devolvemos la data esperada para actualizar la caché tras el éxito
          return history?.map(log => 
            idsToDelete.includes(log.id) ? { ...log, isDeleted: true, deletedAt: new Date().toISOString() } : log
          );
        }),
        {
          // Lo que se muestra instantáneamente (Optimistic Data)
          optimisticData: history?.map(log => 
            idsToDelete.includes(log.id) ? { ...log, isDeleted: true, deletedAt: new Date().toISOString() } : log
          ),
          rollbackOnError: true,
          revalidate: true // Hace un refetch automático al finalizar para garantizar consistencia
        }
      ));
    } catch (error) {
      console.error('Error eliminando archivos:', error);
      // El rollback (deshacer el cambio visual) se hace automáticamente gracias a rollbackOnError: true
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
        <div className="cursor-pointer fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={handleClose} />
        
        <div className="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
          
          {/* Header */}
          <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50/50 gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                <Database size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Historial de Almacenamiento</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditoría de Archivos</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedIds.size > 0 && (
                <button 
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-bold text-sm rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>Liberar Espacio ({selectedIds.size})</span>
                </button>
              )}
              <button onClick={handleClose} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600 shadow-sm border border-transparent hover:border-slate-100 cursor-pointer">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Subheader / Actions */}
          {hasActiveLogs && (
            <div className="px-8 py-3 border-b border-slate-100 bg-white flex items-center gap-2">
              <button 
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                {isAllSelected ? (
                  <CheckSquare size={18} className="text-indigo-600" />
                ) : (
                  <Square size={18} />
                )}
                <span>Seleccionar Todo</span>
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-8 overflow-y-auto bg-slate-50/30 flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
                <span className="font-bold text-sm">Cargando historial...</span>
              </div>
            ) : history && history.length > 0 ? (
              <div className="space-y-4">
                {history.map((log) => (
                  <div 
                    key={log.id} 
                    onClick={() => !log.isDeleted && toggleSelection(log.id)}
                    className={`p-4 bg-white rounded-2xl border shadow-sm transition-all group flex flex-col sm:flex-row gap-4 justify-between
                      ${log.isDeleted ? 'border-slate-100 opacity-75' : 'border-slate-100 hover:border-indigo-200 cursor-pointer'}
                      ${selectedIds.has(log.id) ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/10' : ''}
                    `}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
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
                          <h4 className="text-sm font-black text-slate-900 flex-1 truncate" title={log.objectKey}>
                            {log.objectKey.split('/').pop()}
                          </h4>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                            <File size={14} className="text-slate-300" />
                            <span className="text-slate-600">{formatBytes(log.fileSizeBytes)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                            <Box size={14} className="text-indigo-300" />
                            <span className="text-indigo-600 uppercase">{log.targetType}</span>
                            {log.targetName && (
                              <span className="text-slate-500 font-bold ml-1">{log.targetName}</span>
                            )}
                            {log.context && (
                              <span className="text-slate-400 ml-1">- {log.context}</span>
                            )}
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
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <Box size={32} />
                </div>
                <p className="text-slate-500 font-bold mb-1">No hay historial de almacenamiento</p>
                <p className="text-sm text-slate-400">Los archivos generados o subidos aparecerán aquí.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeDelete}
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
    </>
  );
};

export default StorageHistoryModal;
