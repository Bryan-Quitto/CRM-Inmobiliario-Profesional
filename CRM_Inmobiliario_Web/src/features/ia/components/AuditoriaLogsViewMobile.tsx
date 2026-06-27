import { Bot, AlertCircle } from 'lucide-react';
import { AuditoriaHeader } from './auditoria-sections/AuditoriaHeader';
import { AuditoriaClientItem } from './auditoria-sections/AuditoriaClientItem';
import type { AuditoriaLogsViewLogic } from '../hooks/useAuditoriaLogsViewLogic';

export const AuditoriaLogsViewMobile = ({ logic, canal = 'WhatsApp' }: { logic: AuditoriaLogsViewLogic; canal?: string }) => {
  const {
    clientGroups,
    isLoading,
    error,
    search,
    setSearch,
    expandedClientId,
    toggleClientExpansion,
    handleRetry,
    handleEditClick,
    isEditingId,
    mutate
  } = logic;

  if (error) return (
    <div className="bg-rose-50 border border-rose-100 p-6 rounded-xl text-center w-full mx-auto mt-4 shadow-xl shadow-rose-500/5 animate-in zoom-in-95 duration-500">
      <div className="bg-white h-16 w-16 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4 shrink-0">
        <AlertCircle className="h-8 w-8 text-rose-500" />
      </div>
      <h3 className="text-xl font-black text-rose-900 uppercase tracking-tight mb-2 break-words min-w-0">Error de Conexión</h3>
      <p className="text-rose-600/80 font-bold text-xs mb-6 leading-relaxed px-4 break-words min-w-0">
        No se pudo contactar con el servicio de auditoría de IA.
      </p>
      <button 
        onClick={handleRetry}
        className="w-full cursor-pointer bg-rose-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-[0.2em] hover:bg-rose-700 transition-all shadow-lg active:scale-95"
      >
        Reintentar Conexión
      </button>
    </div>
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-6 px-2 flex flex-col overflow-x-hidden">
      <div className="w-full overflow-x-auto pb-2">
        <AuditoriaHeader search={search} setSearch={setSearch} />
      </div>

      {/* Lista de Contactos */}
      <div className="flex flex-col space-y-4 w-full">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 w-full bg-white border-2 border-slate-50 rounded-2xl animate-pulse"></div>
          ))
        ) : clientGroups.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-[2rem] p-6 text-center w-full">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 shrink-0">
              <Bot className="h-8 w-8 text-slate-200" />
            </div>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest break-words min-w-0 px-4">No hay actividad reciente</p>
          </div>
        ) : (
          clientGroups.map((group) => (
            <div key={group.telefono} className="w-full flex flex-col overflow-x-auto break-words">
              <AuditoriaClientItem 
                group={group}
                isExpanded={expandedClientId === group.telefono}
                onToggle={() => toggleClientExpansion(group.telefono)}
                handleEditClick={handleEditClick}
                isEditingId={isEditingId}
                mutate={mutate}
                canal={canal}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
