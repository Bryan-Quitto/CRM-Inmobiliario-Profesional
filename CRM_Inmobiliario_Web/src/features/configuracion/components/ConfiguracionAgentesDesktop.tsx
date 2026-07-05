import React from 'react';
import { Users, Loader2, ShieldAlert, UserCheck } from 'lucide-react';
import type { ConfiguracionAgentesLogic } from '../hooks/useConfiguracionAgentesLogic';
import { ReasignacionAgenteModal } from './ReasignacionAgenteModal';
import { ReactivacionAgenteModal } from './ReactivacionAgenteModal';
import { ActivarAgenteInvitadoModal } from './ActivarAgenteInvitadoModal';
import { EliminarAgenteModal } from './EliminarAgenteModal';

interface Props {
  logic: ConfiguracionAgentesLogic;
}

export const ConfiguracionAgentesDesktop: React.FC<Props> = ({ logic }) => {
  const {
    user,
    isAdmin,
    agentes,
    isLoading,
    mutate,
    modalOpen,
    setModalOpen,
    selectedAgent,
    eliminarModalOpen,
    setEliminarModalOpen,
    selectedEliminarAgent,
    reactivarModalOpen,
    setReactivarModalOpen,
    selectedReactivarAgent,
    activarInvitadoModalOpen,
    setActivarInvitadoModalOpen,
    selectedInvitadoAgent,
    handleDesactivarClick,
    handleEliminarClick,
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
    <div className="space-y-6">
      <section className="space-y-6 bg-slate-100/50 p-8 rounded-[40px] border border-slate-200/60 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <Users size={20} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Agentes Actuales</h2>
        </div>
        
        <div className="mt-8 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {agentes?.map(agente => (
              <div key={agente.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div>
                  <p className="font-bold text-slate-800">{agente.nombre} {agente.apellido}</p>
                  <p className="text-sm text-slate-500 font-medium">{agente.email}</p>
                  {!agente.activo && (
                    <span className="inline-block mt-1 px-2 py-1 bg-rose-100 text-rose-600 text-xs font-bold rounded-lg">
                      Inactivo
                    </span>
                  )}
                </div>
                
                {isAdmin && agente.id !== user?.id && (
                  <>
                    {agente.activo ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDesactivarClick(agente.id, agente.nombre, agente.apellido)}
                          className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <ShieldAlert size={16} />
                          Desactivar
                        </button>
                        <button
                          onClick={() => handleEliminarClick(agente.id, agente.nombre, agente.apellido)}
                          className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          Eliminar Cuenta
                        </button>
                      </div>
                    ) : agente.email?.includes('invitado_') ? (
                      <button
                        onClick={() => handleActivarInvitadoClick(agente.id, agente.nombre, agente.apellido)}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <UserCheck size={16} />
                        Activar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivarClick(agente.id, agente.nombre, agente.apellido)}
                        className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <UserCheck size={16} />
                        Reactivar Agente
                      </button>
                    )}
                  </>
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

          {selectedEliminarAgent && (
            <EliminarAgenteModal
              isOpen={eliminarModalOpen}
              agenteEliminarId={selectedEliminarAgent.id}
              agenteEliminarNombre={selectedEliminarAgent.nombre}
              onClose={() => setEliminarModalOpen(false)}
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

export default ConfiguracionAgentesDesktop;
