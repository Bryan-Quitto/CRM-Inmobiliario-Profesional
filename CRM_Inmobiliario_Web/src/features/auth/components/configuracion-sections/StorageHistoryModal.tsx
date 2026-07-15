import React from 'react';
import { X, Database, Calendar, File, Box,  XCircle } from 'lucide-react';
import { useStorageHistory } from '../../api/almacenamiento';

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
  const { history, isLoading } = useStorageHistory();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div className="cursor-pointer fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Historial de Almacenamiento</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditoría de Archivos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600 shadow-sm border border-transparent hover:border-slate-100 cursor-pointer">
            <X size={20} />
          </button>
        </div>

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
                <div key={log.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group flex flex-col sm:flex-row gap-4 justify-between">
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
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
              <Database size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold text-lg">No hay registros</p>
              <p className="text-slate-400 font-medium text-sm mt-1">Aún no se ha registrado actividad de almacenamiento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageHistoryModal;
