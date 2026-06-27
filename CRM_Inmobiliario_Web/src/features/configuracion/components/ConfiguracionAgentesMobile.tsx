import React from 'react';
import { Users, Loader2, ShieldAlert, UserCheck } from 'lucide-react';
import type { ConfiguracionAgentesLogic } from '../hooks/useConfiguracionAgentesLogic';
import { ReasignacionAgenteModal } from './ReasignacionAgenteModal';
import { ReactivacionAgenteModal } from './ReactivacionAgenteModal';
import { ActivarAgenteInvitadoModal } from './ActivarAgenteInvitadoModal';

interface Props {
  logic: ConfiguracionAgentesLogic;
}

export const ConfiguracionAgentesMobile: React.FC<Props> = ({ logic }) => {
  const {
    user,
    isAdmin,
    agentes,
    isLoading,
    mutate,
    modalOpen,
    setModalOpen,
    selectedAgent,
    reactivarModalOpen,
    setReactivarModalOpen,
    selectedReactivarAgent,
    activarInvitadoModalOpen,
    setActivarInvitadoModalOpen,
    selectedInvitadoAgent,
    handleDesactivarClick,
    handleReactivarClick,
    handleActivarInvitadoClick,
    handleActivarInvitadoSubmit,
  } = logic;

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center gap-3 w-full">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
              <Users size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex-1 min-w-0 break-words">Agentes Actuales</h2>
          </div>
        </div>
        
        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-4">
            {agentes?.map(agente => (
              <div key={agente.id} className="flex flex-col p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-sm gap-4">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-lg break-words">{agente.nombre} {agente.apellido}</p>
                  <p className="text-sm text-slate-500 font-medium break-all">{agente.email}</p>
                  {!agente.activo && (
                    <span className="inline-flex w-fit mt-2 px-2.5 py-1 bg-rose-100 text-rose-600 text-xs font-bold rounded-lg shrink-0">
                      Inactivo
                    </span>
                  )}
                </div>
                
                {isAdmin && agente.id !== user?.id && (
                  <div className="pt-2 border-t border-slate-200 w-full">
                    {agente.activo ? (
                      <button
                        onClick={() => handleDesactivarClick(agente.id, agente.nombre, agente.apellido)}
                        className="w-full py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <ShieldAlert size={18} className="shrink-0" />
                        Desactivar Agente
                      </button>
                    ) : agente.email?.includes('invitado_') ? (
                      <button
                        onClick={() => handleActivarInvitadoClick(agente.id, agente.nombre, agente.apellido)}
                        className="w-full py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <UserCheck size={18} className="shrink-0" />
                        Activar Agente
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivarClick(agente.id, agente.nombre, agente.apellido)}
                        className="w-full py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <UserCheck size={18} className="shrink-0" />
                        Reactivar Agente
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedAgent && (
            <ReasignacionAgenteModal
              isOpen={modalOpen}
              agenteDesactivarId={selectedAgent.id}
              agenteDesactivarNombre={selectedAgent.nombre}
              onClose={() => setModalOpen(false)}
              onSuccess={() => mutate()}
            />
          )}

          {selectedReactivarAgent && (
            <ReactivacionAgenteModal
              isOpen={reactivarModalOpen}
              agenteId={selectedReactivarAgent.id}
              agenteNombre={selectedReactivarAgent.nombre}
              onClose={() => setReactivarModalOpen(false)}
              onSuccess={() => mutate()}
            />
          )}

          {selectedInvitadoAgent && (
            <ActivarAgenteInvitadoModal
              isOpen={activarInvitadoModalOpen}
              agenteId={selectedInvitadoAgent.id}
              agenteNombre={selectedInvitadoAgent.nombre}
              onClose={() => setActivarInvitadoModalOpen(false)}
              onSubmit={handleActivarInvitadoSubmit}
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default ConfiguracionAgentesMobile;
