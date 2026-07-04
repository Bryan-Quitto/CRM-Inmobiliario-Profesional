import React from 'react';
import { Mail, Lock, Loader2, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useLoginFormLogic } from '../hooks/useLoginFormLogic';

interface LoginFormMobileProps {
  logic: ReturnType<typeof useLoginFormLogic>;
}

export const LoginFormMobile: React.FC<LoginFormMobileProps> = ({ logic }) => {
  const { email, setEmail, password, setPassword, isLoading, error, handleLogin } = logic;
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ colorScheme: 'dark', backgroundImage: 'linear-gradient(to right, #0f172a, #0f172a)' }}>
      {/* SVG Gradients para forzar colores de iconos en navegadores móviles (hack MIUI) */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="miui-icon-white">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="miui-icon-slate-500">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>
      </svg>

      <div className="w-full max-w-sm flex-1 flex flex-col justify-center animate-in fade-in duration-500">
        


        <div className="flex flex-col items-center mb-4 mt-4">
          <img src="/logo.png" alt="Lúmina Logo" className="h-16 w-16 object-contain drop-shadow-[0_0_10px_rgba(37,99,235,0.4)] mb-3" />
          <h1 className="text-lg md:text-xl md:text-2xl font-black text-miui-white tracking-tight text-center">
            Lúmina
          </h1>
          <p className="text-miui-slate-400 mt-1 font-bold uppercase tracking-[0.15em] text-xs">
            CRM Inmobiliario
          </p>
        </div>

        <div className="backdrop-blur-md border border-slate-700/50 p-4 rounded-3xl shadow-xl w-full" style={{ backgroundImage: 'linear-gradient(to right, rgba(30, 41, 59, 0.6), rgba(30, 41, 59, 0.6))' }}>
          <h2 className="text-lg font-bold text-miui-white mb-4 text-center">Acceso al Sistema</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-start gap-2 text-rose-400 text-xs font-bold">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-black text-miui-slate-400 uppercase tracking-widest ml-1" htmlFor="email-mobile">
                Correo Electrónico
              </label>
              <div className="relative group">
                <Mail color="url(#miui-icon-slate-500)" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="email-mobile"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-700/80 text-miui-white rounded-xl py-3.5 pl-10 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder-miui-slate-600"
                  style={{ backgroundImage: 'linear-gradient(to right, rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.6))' }}
                  placeholder="nombre@empresa.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-miui-slate-400 uppercase tracking-widest ml-1" htmlFor="password-mobile">
                Contraseña
              </label>
              <div className="relative group">
                <Lock color="url(#miui-icon-slate-500)" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="password-mobile"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-700/80 text-miui-white rounded-xl py-3.5 pl-10 pr-10 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder-miui-slate-600"
                  style={{ backgroundImage: 'linear-gradient(to right, rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.6))' }}
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff color="url(#miui-icon-slate-500)" className="h-4 w-4" /> : <Eye color="url(#miui-icon-slate-500)" className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-miui-white rounded-xl py-3.5 font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              style={{ backgroundImage: 'linear-gradient(to right, #2563eb, #2563eb)' }}
            >
              {isLoading ? (
                <>
                  <Loader2 color="url(#miui-icon-white)" className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn color="url(#miui-icon-white)" className="h-4 w-4" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-4 mb-2 flex flex-col items-center gap-3">
          <div className="flex items-center gap-4 text-[10px] font-bold text-miui-slate-400 uppercase tracking-widest">
            <a href="/terminos" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Términos</a>
            <span>•</span>
            <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">Privacidad</a>
          </div>
          <p className="text-center text-miui-slate-500 text-[10px] font-bold uppercase tracking-widest">
            © 2026 Lúmina CRM
          </p>
        </div>
      </div>
    </div>
  );
};
