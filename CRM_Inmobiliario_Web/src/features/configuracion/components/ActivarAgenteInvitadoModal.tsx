import React, { useState, useEffect } from 'react';
import { X, Mail, Building2, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { listarAgencias, type Agency } from '../api/agencias';
import { AxiosError } from 'axios';

interface ActivarAgenteInvitadoModalProps {
  isOpen: boolean;
  agenteId: string;
  agenteNombre: string;
  onClose: () => void;
  onSubmit: (email: string, agenciaId: string | null) => Promise<void>;
}

export const ActivarAgenteInvitadoModal: React.FC<ActivarAgenteInvitadoModalProps> = ({
  isOpen,
  agenteNombre,
  onClose,
  onSubmit
}) => {
  const [email, setEmail] = useState('');
  const [agenciaId, setAgenciaId] = useState<string>('');
  const [agencias, setAgencias] = useState<Agency[]>([]);
  const [loadingAgencias, setLoadingAgencias] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      cargarAgencias();
    } else {
      setEmail('');
      setAgenciaId('');
    }
  }, [isOpen]);

  const cargarAgencias = async () => {
    setLoadingAgencias(true);
    try {
      const data = await listarAgencias();
      setAgencias(data);
    } catch { /* ignore */ } finally {
      setLoadingAgencias(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('El correo electrónico es requerido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(email, agenciaId === '' ? null : agenciaId);
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Error al enviar la invitación';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-xl font-bold text-slate-800 break-words">Activar Agente Invitado</h3>
            <p className="text-sm text-slate-500 mt-1 break-words">Configura el perfil de {agenteNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto flex flex-col">
          <div className="space-y-1.5 flex flex-col min-w-0">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 break-words">
              Correo Electrónico Real
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agente@ejemplo.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5 flex flex-col min-w-0">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 break-words">
              Vincular a Agencia
            </label>
            <div className="relative group">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <select
                value={agenciaId}
                onChange={(e) => setAgenciaId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium appearance-none cursor-pointer"
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

          <div className="pt-4 flex flex-col sm:flex-row gap-3 mt-auto shrink-0 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 w-full sm:w-auto px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="flex-1 w-full sm:w-auto px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin shrink-0" />
                  Activando...
                </>
              ) : (
                <>
                  <Send size={18} className="shrink-0" />
                  Activar y Enviar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
