import React, { useState } from 'react';
import { invitarAgente } from '../api/invitarAgente';
import { toast } from 'sonner';
import { Check, Mail, Loader2, Send } from 'lucide-react';
import { AxiosError } from 'axios';

export const InvitarAgenteForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await invitarAgente({ email, nombre: '', apellido: '' }); // El backend ya solo espera email
      setSuccess(true);
      toast.success('Invitación enviada', {
        description: `Se ha enviado un correo a ${email}. El usuario configurará su perfil al entrar.`
      });
      
      setTimeout(() => {
        setSuccess(false);
        setEmail('');
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
          Solo necesitas el correo. El nuevo agente completará su nombre y contraseña al activar su cuenta.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-sm
            ${success 
              ? 'bg-emerald-500 text-white shadow-emerald-200' 
              : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'
            } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
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
    </div>
  );
};
