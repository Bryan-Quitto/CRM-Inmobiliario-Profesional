import React from 'react';
import { Mail, Lock, Loader2, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useLoginFormLogic } from '../hooks/useLoginFormLogic';

interface LoginFormDesktopProps {
  logic: ReturnType<typeof useLoginFormLogic>;
}

export const LoginFormDesktop: React.FC<LoginFormDesktopProps> = ({ logic }) => {
  const { email, setEmail, password, setPassword, isLoading, error, handleLogin, lockout } = logic;
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ colorScheme: 'dark', backgroundImage: 'linear-gradient(to right, #0f172a, #0f172a)' }}>
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-700">
        {/* Logo y Encabezado */}
        <div className="flex flex-col items-center mb-10">
          <img src="/logo.png" alt="Ziel Luxora CRM Logo" className="h-20 w-20 object-contain drop-shadow-[0_0_15px_rgba(37,99,235,0.5)] mb-4" />
          <h1 className="text-3xl font-black text-white tracking-tight text-center">
            Ziel Luxora CRM
          </h1>
          <p className="text-slate-400 mt-2 font-bold uppercase tracking-[0.2em] text-[10px]">
            CRM Inmobiliario
          </p>
        </div>

        {/* Card de Login */}
        <div className="backdrop-blur-xl border border-slate-700 p-8 rounded-[2rem] shadow-2xl" style={{ backgroundImage: 'linear-gradient(to right, rgba(30, 41, 59, 0.5), rgba(30, 41, 59, 0.5))' }}>
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
                Correo Electrónico Corporativo
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={lockout?.isLocked}
                  className="w-full border border-slate-700 text-white rounded-xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundImage: 'linear-gradient(to right, rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.5))' }}
                  placeholder="nombre@empresa.com"
                  required
                />
              </div>
              {lockout?.isLocked && (
                <p className="text-rose-400 text-xs font-bold mt-1.5 ml-1 animate-in fade-in">
                  Por motivos de seguridad, debe esperar {lockout.formattedLockoutTime} para volver a intentar.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="password">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={lockout?.isLocked}
                  className="w-full border border-slate-700 text-white rounded-xl py-4 pl-12 pr-12 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundImage: 'linear-gradient(to right, rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.5))' }}
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <a href="/olvide-mi-clave" className="cursor-pointer text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || lockout?.isLocked}
              className="cursor-pointer w-full text-white rounded-xl py-4 font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
              style={{ backgroundImage: 'linear-gradient(to right, #2563eb, #2563eb)' }}
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
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <a href="/terminos" target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:text-blue-400 transition-colors">Términos</a>
            <span>•</span>
            <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:text-blue-400 transition-colors">Privacidad</a>
          </div>
          <p className="text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            © 2026 Ziel Luxora CRM • v1.1.0-Elite
          </p>
        </div>
      </div>
    </div>
  );
};

