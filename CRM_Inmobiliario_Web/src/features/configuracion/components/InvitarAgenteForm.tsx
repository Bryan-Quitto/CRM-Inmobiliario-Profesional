import React, { useState, useEffect } from 'react';
import { invitarAgente, listarAgencias } from '../api/agencias';
import type { Agency } from '../api/agencias';
import { toast } from 'sonner';
import { Check, Mail, Loader2, Send, Building2, Zap } from 'lucide-react';
import { AxiosError } from 'axios';
import { InvitarSubscriptionModal } from './InvitarSubscriptionModal';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';

export const InvitarAgenteForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [agenciaId, setAgenciaId] = useState<string>('');
  const [planTier, setPlanTier] = useState('Normal');
  const [agencias, setAgencias] = useState<Agency[]>([]);
  const [loadingAgencias, setLoadingAgencias] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { canWrite } = useSubscriptionGuard();

  useEffect(() => {
    cargarAgencias();
  }, []);

  const cargarAgencias = async () => {
    setLoadingAgencias(true);
    try {
      const data = await listarAgencias();
      setAgencias(data);
    } catch { /* ignore */ } finally {
      setLoadingAgencias(false);
    }
  };

  const handleOpenModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) {
      toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
      return;
    }
    if (!email) return;
    setIsModalOpen(true);
  };

  const handleConfirmInvite = async (months: number, notes: string) => {
    setLoading(true);

    try {
      await invitarAgente({ 
        email, 
        agenciaId: agenciaId === '' ? null : agenciaId,
        planTier,
        months,
        notes
      });
      setSuccess(true);
      toast.success('Invitación enviada', {
        description: `Se ha enviado un correo a ${email}.`
      });
      
      setTimeout(() => {
        setSuccess(false);
        setEmail('');
        setAgenciaId('');
        setPlanTier('Normal');
      }, 2500);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Error al enviar la invitación';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-500" />
          Invitar por Correo
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Solo necesitas el correo. Puedes vincularlo a una agencia ahora o dejarlo como independiente.
        </p>
      </div>

      <form onSubmit={handleOpenModal} className="p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
            Correo Electrónico del Invitado
          </label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agente@ejemplo.com"
              disabled={!canWrite}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
            Vincular a Agencia
          </label>
          <div className="relative group">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <select
              value={agenciaId}
              onChange={(e) => setAgenciaId(e.target.value)}
              disabled={!canWrite}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Independiente (Sin Agencia)</option>
              {agencias.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
              {loadingAgencias && <option disabled>Cargando agencias...</option>}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
            Plan de Suscripción
          </label>
          <div className="relative group">
            <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <select
              value={planTier}
              onChange={(e) => setPlanTier(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium appearance-none"
            >
              <option value="Normal">Plan Normal</option>
              <option value="Pro">Plan Pro</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-sm
            ${success 
              ? 'bg-emerald-500 text-white shadow-emerald-200' 
              : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'
            } ${loading ? 'opacity-70 cursor-not-allowed' : ''} ${!canWrite ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enviando...
            </>
          ) : success ? (
            <>
              <Check className="w-5 h-5 animate-bounce" />
              ¡Enviado con éxito!
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar Invitación
            </>
          )}
        </button>
      </form>

      <InvitarSubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmInvite}
        email={email}
        planTier={planTier}
      />
    </div>
  );
};
