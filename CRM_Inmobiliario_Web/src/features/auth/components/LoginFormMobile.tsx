import React from 'react';
import { Mail, Lock, Loader2, LogIn, AlertCircle } from 'lucide-react';
import { useLoginFormLogic } from '../hooks/useLoginFormLogic';

interface LoginFormMobileProps {
  logic: ReturnType<typeof useLoginFormLogic>;
}

export const LoginFormMobile: React.FC<LoginFormMobileProps> = ({ logic }) => {
  const { email, setEmail, password, setPassword, isLoading, error, handleLogin } = logic;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">

      <div className="w-full max-w-sm flex-1 flex flex-col justify-center animate-in fade-in duration-500">
        <div className="flex flex-col items-center mb-8 mt-4">
          <img src="/logo.png" alt="Lúmina Logo" className="h-16 w-16 object-contain drop-shadow-[0_0_10px_rgba(37,99,235,0.4)] mb-3" />
          <h1 className="text-2xl font-black text-white tracking-tight text-center">
            Lúmina
          </h1>
          <p className="text-slate-400 mt-1 font-bold uppercase tracking-[0.15em] text-xs">
            CRM Inmobiliario
          </p>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl shadow-xl w-full">
          <h2 className="text-lg font-bold text-white mb-6 text-center">Acceso al Sistema</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-start gap-2 text-rose-400 text-xs font-bold">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="email-mobile">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="email-mobile"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700/80 text-white rounded-xl py-3.5 pl-10 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-600"
                  placeholder="nombre@empresa.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="password-mobile">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="password-mobile"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700/80 text-white rounded-xl py-3.5 pl-10 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-600"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3.5 font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 mb-2 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
          © 2026 Lúmina CRM
        </p>
      </div>
    </div>
  );
};
