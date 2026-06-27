import { Bot, AlertCircle } from 'lucide-react';
import { AuditoriaHeader } from './auditoria-sections/AuditoriaHeader';
import { AuditoriaClientItem } from './auditoria-sections/AuditoriaClientItem';
import type { AuditoriaLogsViewLogic } from '../hooks/useAuditoriaLogsViewLogic';

export const AuditoriaLogsViewDesktop = ({ logic, canal = 'WhatsApp' }: { logic: AuditoriaLogsViewLogic; canal?: string }) => {
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
    <div className="bg-rose-50 border border-rose-100 p-12 rounded-[2rem] text-center max-w-2xl mx-auto mt-10 shadow-xl shadow-rose-500/5 animate-in zoom-in-95 duration-500">
      <div className="bg-white h-20 w-20 rounded-3xl shadow-lg flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="h-10 w-10 text-rose-500" />
      </div>
      <h3 className="text-2xl font-black text-rose-900 uppercase tracking-tight mb-2">Error de Conexión</h3>
      <p className="text-rose-600/80 font-bold text-sm mb-8 leading-relaxed px-10">
        No se pudo contactar con el servicio de auditoría de IA.
      </p>
      <button 
        onClick={handleRetry}
        className="cursor-pointer bg-rose-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-rose-700 transition-all shadow-lg active:scale-95"
      >
        Reintentar Conexión
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <AuditoriaHeader search={search} setSearch={setSearch} />

      {/* Lista de Contactos */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white border-2 border-slate-50 rounded-[2rem] animate-pulse"></div>
          ))
        ) : clientGroups.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] py-24 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bot className="h-10 w-10 text-slate-200" />
            </div>
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No hay actividad reciente</p>
          </div>
        ) : (
          clientGroups.map((group) => (
            <AuditoriaClientItem 
              key={group.telefono}
              group={group}
              isExpanded={expandedClientId === group.telefono}
              onToggle={() => toggleClientExpansion(group.telefono)}
              handleEditClick={handleEditClick}
              isEditingId={isEditingId}
              mutate={mutate}
              canal={canal}
            />
          ))
        )}
      </div>
    </div>
  );
};
