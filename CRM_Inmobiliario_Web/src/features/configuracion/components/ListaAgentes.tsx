import React, { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAgentes } from '../hooks/useAgentes';
import { Loader2, ShieldAlert, UserCheck } from 'lucide-react';
import { ReasignacionAgenteModal } from './ReasignacionAgenteModal';
import { ReactivacionAgenteModal } from './ReactivacionAgenteModal';



export const ListaAgentes: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { agentes, isLoading, mutate } = useAgentes();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<{ id: string, nombre: string } | null>(null);

  const [reactivarModalOpen, setReactivarModalOpen] = useState(false);
  const [selectedReactivarAgent, setSelectedReactivarAgent] = useState<{ id: string, nombre: string } | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-xl font-bold text-slate-800">Agentes Actuales</h3>
      
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
                  <button
                    onClick={() => {
                      setSelectedAgent({ id: agente.id, nombre: `${agente.nombre} ${agente.apellido}` });
                      setModalOpen(true);
                    }}
                    className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ShieldAlert size={16} />
                    Desactivar Agente
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedReactivarAgent({ id: agente.id, nombre: `${agente.nombre} ${agente.apellido}` });
                      setReactivarModalOpen(true);
                    }}
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
          onSuccess={() => {
            mutate(); // Recargar la lista
          }}
        />
      )}

      {selectedReactivarAgent && (
        <ReactivacionAgenteModal
          isOpen={reactivarModalOpen}
          agenteId={selectedReactivarAgent.id}
          agenteNombre={selectedReactivarAgent.nombre}
          onClose={() => setReactivarModalOpen(false)}
          onSuccess={() => {
            mutate(); // Recargar la lista
          }}
        />
      )}
    </div>
  );
};
