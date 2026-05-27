import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/axios';
import { toast } from 'sonner';
import { KeyRound, Smartphone, Loader2, Save } from 'lucide-react';
import { usePerfil } from '../../auth/api/perfil';

interface AgentKey {
  id: string;
  nombre: string;
  apellido: string;
  aiApiKey: string | null;
  whatsAppPhoneNumberId: string | null;
}

export const AdminApiKeysPanel: React.FC = () => {
  const { perfil } = usePerfil();
  const ADMIN_ID = 'd4a6efdd-b801-40fb-901e-64e36f6b1400';
  const isAdmin = perfil?.id === ADMIN_ID;

  const [agents, setAgents] = useState<AgentKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      loadAgents();
    }
  }, [isAdmin]);

  const loadAgents = async () => {
    try {
      const response = await api.get('/admin/api-keys');
      setAgents(response.data);
    } catch {
      toast.error('Error al cargar agentes y claves.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, aiApiKey: string, whatsAppPhoneNumberId: string) => {
    setUpdating(id);
    try {
      await api.put(`/admin/api-keys/${id}`, {
        aiApiKey: aiApiKey || null,
        whatsAppPhoneNumberId: whatsAppPhoneNumberId || null
      });
      toast.success('Credenciales actualizadas correctamente.');
      loadAgents();
    } catch {
      toast.error('Error al actualizar las credenciales.');
    } finally {
      setUpdating(null);
    }
  };

  if (!isAdmin) return null;

  return (
    <section className="space-y-6 bg-slate-100/50 p-8 rounded-[40px] border border-slate-200/60 mt-8 animate-in fade-in duration-1000">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <KeyRound size={20} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Credenciales de Agentes</h2>
      </div>

      <p className="text-slate-600 font-medium mb-6">
        Configura la llave de OpenAI (AiApiKey) y el ID de número de teléfono de WhatsApp (WhatsAppPhoneNumberId) de cada agente.
      </p>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => (
            <AgentKeyRow key={agent.id} agent={agent} onSave={handleUpdate} isUpdating={updating === agent.id} />
          ))}
          {agents.length === 0 && (
            <div className="text-center p-8 text-slate-500 font-medium bg-white rounded-2xl">
              No hay agentes registrados.
            </div>
          )}
        </div>
      )}
    </section>
  );
};

const AgentKeyRow: React.FC<{
  agent: AgentKey;
  onSave: (id: string, aiKey: string, waId: string) => void;
  isUpdating: boolean;
}> = ({ agent, onSave, isUpdating }) => {
  const [aiKey, setAiKey] = useState(agent.aiApiKey || '');
  const [waId, setWaId] = useState(agent.whatsAppPhoneNumberId || '');

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center gap-6">
      <div className="md:w-1/3">
        <h3 className="font-bold text-slate-800">{agent.nombre} {agent.apellido}</h3>
        <p className="text-xs text-slate-500 mt-1 font-mono">{agent.id}</p>
      </div>
      
      <div className="flex-1 space-y-4 md:space-y-0 md:flex md:gap-4">
        <div className="flex-1 relative">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Ai API Key</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="password" 
              value={aiKey}
              onChange={(e) => setAiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex-1 relative">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">WhatsApp Phone ID</label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              value={waId}
              onChange={(e) => setWaId(e.target.value)}
              placeholder="1234567890"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
            />
          </div>
        </div>
      </div>

      <div className="md:w-auto self-end md:self-center mt-2 md:mt-0 pt-5 md:pt-0">
        <button
          onClick={() => onSave(agent.id, aiKey, waId)}
          disabled={isUpdating || (aiKey === (agent.aiApiKey || '') && waId === (agent.whatsAppPhoneNumberId || ''))}
          className="cursor-pointer flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap h-full"
        >
          {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar
        </button>
      </div>
    </div>
  );
};
