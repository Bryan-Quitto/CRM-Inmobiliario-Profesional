import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Mail, Lock, Loader2, LogIn, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        let message = 'Error al iniciar sesión';
        if (authError.message === 'Invalid login credentials') {
          message = 'Email o contraseña incorrectos';
        } else {
          message = authError.message;
        }
        setError(message);
        toast.error(message);
      } else {
        toast.success('¡Bienvenido de nuevo!');
      }
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-700">
        {/* Logo y Encabezado */}
        <div className="flex flex-col items-center mb-10">
          <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-blue-600/40 mb-6">
            C
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight text-center">
            CRM<span className="text-blue-500">Pro</span>
          </h1>
          <p className="text-slate-400 mt-2 font-bold uppercase tracking-[0.2em] text-[10px]">
            Inmobiliaria Profesional
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-8 rounded-[2rem] shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-8 text-center">Acceso al Sistema</h2>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3 text-rose-400 text-sm font-bold animate-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="email">
                Email Corporativo
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600"
                  placeholder="nombre@empresa.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="password">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-4 font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest">
          © 2026 CRM Inmobiliario Profesional • v1.1.0-Elite
        </p>
      </div>
    </div>
  );
};
