import React, { useState, useMemo } from 'react';
import { UserX, ShieldAlert, Loader2 } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import Fuse from 'fuse.js';
import { toast } from 'sonner';
import { useAgentes } from '../hooks/useAgentes';
import { useDesactivarAgente } from '../hooks/useDesactivarAgente';

interface ReasignacionAgenteModalProps {
  agenteDesactivarId: string;
  agenteDesactivarNombre: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReasignacionAgenteModal: React.FC<ReasignacionAgenteModalProps> = ({
  agenteDesactivarId,
  agenteDesactivarNombre,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { agentes, isLoading: isAgentesLoading } = useAgentes();
  const { mutateAsync: desactivar, isLoading: isDesactivando } = useDesactivarAgente();
  
  const [query, setQuery] = useState('');
  const [selectedAgenteId, setSelectedAgenteId] = useState<string | null>(null);

  // Filtrar al agente actual y mantener solo a los activos
  const agentesValidos = useMemo(() => {
    return agentes?.filter(a => a.id !== agenteDesactivarId && a.activo) || [];
  }, [agentes, agenteDesactivarId]);

  const fuse = useMemo(() => new Fuse(agentesValidos, {
    keys: ['nombre', 'apellido', 'email'],
    threshold: 0.3,
  }), [agentesValidos]);

  const resultados = useMemo(() => {
    if (!query) return agentesValidos;
    return fuse.search(query).map(r => r.item);
  }, [query, agentesValidos, fuse]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedAgenteId) return;

    try {
      await desactivar(agenteDesactivarId, { nuevoAgenteId: selectedAgenteId });
      toast.success('Agente desactivado y cartera reasignada', {
        description: `Se han transferido las propiedades y contactos exitosamente.`,
      });
      onSuccess();
      onClose();
    } catch {
      // El hook ya maneja el error internamente mostrando un toast si quieres
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] md:max-h-[90vh]">
        <div className="p-4 sm:p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-4 mb-4 w-full">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <ShieldAlert size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight break-words">Desactivar Agente</h3>
              <p className="text-slate-500 font-medium break-words">Reasignación de Cartera de {agenteDesactivarNombre}</p>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600 break-words">
            ¿A qué agente deseas reasignar TODAS las Propiedades y Contactos de este usuario antes de bloquear su acceso de forma permanente?
          </p>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="mb-6">
            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar agente activo por nombre o email..."
              className="pl-12 py-4 bg-slate-50 border-slate-200 rounded-2xl focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800 placeholder:text-slate-400"
              iconClassName="left-4 h-5 w-5 text-slate-400"
            />
          </div>

          <div className="space-y-3">
            {isAgentesLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : resultados.length === 0 ? (
              <div className="text-center p-8 text-slate-500 font-medium break-words">
                No se encontraron agentes válidos para la reasignación.
              </div>
            ) : (
              resultados.map(agente => (
                <div
                  key={agente.id}
                  onClick={() => setSelectedAgenteId(agente.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                    selectedAgenteId === agente.id
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selectedAgenteId === agente.id ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                  }`}>
                    {selectedAgenteId === agente.id && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 break-words">{agente.nombre} {agente.apellido}</p>
                    <p className="text-sm font-medium text-slate-500 break-all">{agente.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 shrink-0 w-full">
          <button
            onClick={onClose}
            disabled={isDesactivando}
            className="flex-1 w-full sm:w-auto px-4 py-4 font-bold text-slate-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedAgenteId || isDesactivando}
            className="flex-1 w-full sm:w-auto px-4 py-4 font-bold text-white bg-rose-600 rounded-2xl hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDesactivando ? (
              <>
                <Loader2 size={20} className="animate-spin shrink-0" />
                Desactivando...
              </>
            ) : (
              <>
                <UserX size={20} className="shrink-0" />
                Desactivar y Reasignar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
