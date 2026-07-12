import React from 'react';
import { Mail, Loader2, Send, AlertCircle, ArrowLeft } from 'lucide-react';
import { useOlvideMiClaveLogic } from '../hooks/useOlvideMiClaveLogic';
import { Link } from 'react-router-dom';

interface OlvideMiClaveDesktopProps {
  logic: ReturnType<typeof useOlvideMiClaveLogic>;
}

export const OlvideMiClaveDesktop: React.FC<OlvideMiClaveDesktopProps> = ({ logic }) => {
  const { email, setEmail, isLoading, isSuccess, error, handleSubmit } = logic;

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

        {/* Card */}
        <div className="backdrop-blur-xl border border-slate-700 p-8 rounded-[2rem] shadow-2xl" style={{ backgroundImage: 'linear-gradient(to right, rgba(30, 41, 59, 0.5), rgba(30, 41, 59, 0.5))' }}>
          <h2 className="text-xl font-bold text-white mb-4 text-center">Recuperar Contraseña</h2>
          
          <p className="text-slate-400 text-sm text-center mb-8">
            Ingresa tu correo electrónico y te enviaremos un enlace mágico para restablecer tu contraseña.
          </p>

          {isSuccess ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-xl flex flex-col items-center gap-4 text-emerald-400 text-sm font-bold animate-in zoom-in duration-500 text-center">
              <Mail className="h-10 w-10 shrink-0" />
              <p>Hemos enviado un enlace a tu correo para que puedas actualizar tu contraseña. Por favor, revisa tu bandeja de entrada o carpeta de spam.</p>
              <Link to="/" className="text-white hover:text-blue-400 underline transition-colors mt-2">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3 text-rose-400 text-sm font-bold animate-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="email-forgot">
                  Correo Electrónico Corporativo
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    id="email-forgot"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-700 text-white rounded-xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600"
                    style={{ backgroundImage: 'linear-gradient(to right, rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.5))' }}
                    placeholder="nombre@empresa.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer w-full text-white rounded-xl py-4 font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
                style={{ backgroundImage: 'linear-gradient(to right, #2563eb, #2563eb)' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Enviar Enlace
                  </>
                )}
              </button>
              
              <div className="text-center mt-6">
                <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold">
                  <ArrowLeft className="h-4 w-4" />
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

