import React from 'react';
import { Mail, Loader2, Send, AlertCircle, ArrowLeft } from 'lucide-react';
import { useOlvideMiClaveLogic } from '../hooks/useOlvideMiClaveLogic';
import { Link } from 'react-router-dom';

interface OlvideMiClaveMobileProps {
  logic: ReturnType<typeof useOlvideMiClaveLogic>;
}

export const OlvideMiClaveMobile: React.FC<OlvideMiClaveMobileProps> = ({ logic }) => {
  const { email, setEmail, isLoading, isSuccess, error, handleSubmit } = logic;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ colorScheme: 'dark', backgroundImage: 'linear-gradient(to right, #0f172a, #0f172a)' }}>
      {/* SVG Gradients para forzar colores de iconos en navegadores móviles */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="miui-icon-white-forgot">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="miui-icon-slate-500-forgot">
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
          <h2 className="text-lg font-bold text-miui-white mb-2 text-center">Recuperar Contraseña</h2>
          
          <p className="text-miui-slate-400 text-xs text-center mb-6">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          {isSuccess ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col items-center gap-3 text-emerald-400 text-xs font-bold animate-in zoom-in duration-500 text-center">
              <Mail color="url(#miui-icon-white-forgot)" className="h-8 w-8 shrink-0" />
              <p>Hemos enviado un enlace a tu correo. Por favor, revisa tu bandeja de entrada o spam.</p>
              <Link to="/" className="text-miui-white hover:text-blue-400 underline transition-colors mt-2">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-start gap-2 text-rose-400 text-xs font-bold">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-black text-miui-slate-400 uppercase tracking-widest ml-1" htmlFor="email-mobile-forgot">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <Mail color="url(#miui-icon-slate-500-forgot)" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    id="email-mobile-forgot"
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

              <button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer w-full text-miui-white rounded-xl py-3.5 font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                style={{ backgroundImage: 'linear-gradient(to right, #2563eb, #2563eb)' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 color="url(#miui-icon-white-forgot)" className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send color="url(#miui-icon-white-forgot)" className="h-4 w-4" />
                    Enviar Enlace
                  </>
                )}
              </button>
              
              <div className="text-center mt-5">
                <Link to="/" className="inline-flex items-center gap-2 text-miui-slate-400 hover:text-miui-white transition-colors text-xs font-bold">
                  <ArrowLeft color="url(#miui-icon-slate-500-forgot)" className="h-3 w-3" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
