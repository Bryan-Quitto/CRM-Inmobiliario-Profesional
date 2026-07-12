import React from 'react';
import { Lock, Loader2, Save, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useActualizarClaveLogic } from '../hooks/useActualizarClaveLogic';
import { PasswordRequirements } from './shared/PasswordRequirements';


interface ActualizarClaveMobileProps {
  logic: ReturnType<typeof useActualizarClaveLogic>;
}

export const ActualizarClaveMobile: React.FC<ActualizarClaveMobileProps> = ({ logic }) => {
  const { password, setPassword, confirmPassword, setConfirmPassword, isLoading, error, handleSubmit } = logic;
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ colorScheme: 'dark', backgroundImage: 'linear-gradient(to right, #0f172a, #0f172a)' }}>
      {/* SVG Gradients para forzar colores de iconos en navegadores móviles */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="miui-icon-white-update">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="miui-icon-slate-500-update">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>
      </svg>

      <div className="w-full max-w-sm flex-1 flex flex-col justify-center animate-in fade-in duration-500">
        <div className="flex flex-col items-center mb-4 mt-4">
          <img src="/logo.png" alt="Ziel Luxora CRM Logo" className="h-16 w-16 object-contain drop-shadow-[0_0_10px_rgba(37,99,235,0.4)] mb-3" />
          <h1 className="text-lg md:text-xl md:text-2xl font-black text-miui-white tracking-tight text-center">
            Ziel Luxora CRM
          </h1>
          <p className="text-miui-slate-400 mt-1 font-bold uppercase tracking-[0.15em] text-xs">
            CRM Inmobiliario
          </p>
        </div>

        <div className="backdrop-blur-md border border-slate-700/50 p-4 rounded-3xl shadow-xl w-full" style={{ backgroundImage: 'linear-gradient(to right, rgba(30, 41, 59, 0.6), rgba(30, 41, 59, 0.6))' }}>
          <h2 className="text-lg font-bold text-miui-white mb-2 text-center">Actualizar Contraseña</h2>
          
          <p className="text-miui-slate-400 text-xs text-center mb-6">
            Ingresa tu nueva contraseña. Mínimo 6 caracteres.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-start gap-2 text-rose-400 text-xs font-bold">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-black text-miui-slate-400 uppercase tracking-widest ml-1" htmlFor="new-password-mobile">
                Nueva Contraseña
              </label>
              <div className="relative group">
                <Lock color="url(#miui-icon-slate-500-update)" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="new-password-mobile"
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
                  className="cursor-pointer absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff color="url(#miui-icon-slate-500-update)" className="h-4 w-4" /> : <Eye color="url(#miui-icon-slate-500-update)" className="h-4 w-4" />}
                </button>
              </div>
              

            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-miui-slate-400 uppercase tracking-widest ml-1" htmlFor="confirm-password-mobile">
                Confirmar Contraseña
              </label>
              <div className="relative group">
                <Lock color="url(#miui-icon-slate-500-update)" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="confirm-password-mobile"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-slate-700/80 text-miui-white rounded-xl py-3.5 pl-10 pr-10 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder-miui-slate-600"
                  style={{ backgroundImage: 'linear-gradient(to right, rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.6))' }}
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="cursor-pointer absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff color="url(#miui-icon-slate-500-update)" className="h-4 w-4" /> : <Eye color="url(#miui-icon-slate-500-update)" className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <PasswordRequirements validations={logic.validations} />

            <button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer w-full text-miui-white rounded-xl py-3.5 font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              style={{ backgroundImage: 'linear-gradient(to right, #2563eb, #2563eb)' }}
            >
              {isLoading ? (
                <>
                  <Loader2 color="url(#miui-icon-white-update)" className="h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Save color="url(#miui-icon-white-update)" className="h-4 w-4" />
                  Guardar Contraseña
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

