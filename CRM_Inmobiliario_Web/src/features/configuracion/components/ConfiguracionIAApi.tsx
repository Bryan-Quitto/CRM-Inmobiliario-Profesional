import React, { useState } from 'react';
import { Lock, Loader2, KeyRound } from 'lucide-react';
import { usePerfil } from '../../auth/api/perfil';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { AdminApiKeysPanel } from './AdminApiKeysPanel';

export const ConfiguracionIAApi: React.FC = () => {
  const { perfil } = usePerfil();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    if (!perfil?.email) {
      toast.error('No se pudo obtener el email del perfil.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: perfil.email,
        password: password,
      });

      if (error) throw error;

      setIsAuthenticated(true);
      toast.success('Autenticación exitosa.');
    } catch (err) {
      const error = err as Error;
      toast.error('Contraseña incorrecta.', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <section className="bg-slate-100/50 p-8 rounded-[40px] border border-slate-200/60 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-xl mx-auto mt-12">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Área Restringida</h2>
            <p className="text-slate-600 font-medium mt-2">
              Por seguridad, re-ingresa tu contraseña para acceder a la gestión de credenciales (Agente-IA).
            </p>
          </div>

          <form onSubmit={handleAuthenticate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block">Contraseña de Administrador</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full cursor-pointer flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              Verificar Identidad
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <AdminApiKeysPanel />
    </div>
  );
};

export default ConfiguracionIAApi;
