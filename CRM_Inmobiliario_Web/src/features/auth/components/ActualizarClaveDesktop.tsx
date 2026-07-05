import React from 'react';
import { Lock, Loader2, Save, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useActualizarClaveLogic } from '../hooks/useActualizarClaveLogic';
import { PasswordRequirements } from './shared/PasswordRequirements';


interface ActualizarClaveDesktopProps {
  logic: ReturnType<typeof useActualizarClaveLogic>;
}

export const ActualizarClaveDesktop: React.FC<ActualizarClaveDesktopProps> = ({ logic }) => {
  const { password, setPassword, confirmPassword, setConfirmPassword, isLoading, error, handleSubmit } = logic;
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ colorScheme: 'dark', backgroundImage: 'linear-gradient(to right, #0f172a, #0f172a)' }}>
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-700">
        {/* Logo y Encabezado */}
        <div className="flex flex-col items-center mb-10">
          <img src="/logo.png" alt="Lúmina Logo" className="h-20 w-20 object-contain drop-shadow-[0_0_15px_rgba(37,99,235,0.5)] mb-4" />
          <h1 className="text-3xl font-black text-white tracking-tight text-center">
            Lúmina
          </h1>
          <p className="text-slate-400 mt-2 font-bold uppercase tracking-[0.2em] text-[10px]">
            CRM Inmobiliario
          </p>
        </div>

        {/* Card */}
        <div className="backdrop-blur-xl border border-slate-700 p-8 rounded-[2rem] shadow-2xl" style={{ backgroundImage: 'linear-gradient(to right, rgba(30, 41, 59, 0.5), rgba(30, 41, 59, 0.5))' }}>
          <h2 className="text-xl font-bold text-white mb-4 text-center">Actualizar Contraseña</h2>
          
          <p className="text-slate-400 text-sm text-center mb-8">
            Por favor ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3 text-rose-400 text-sm font-bold animate-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="new-password">
                Nueva Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-700 text-white rounded-xl py-4 pl-12 pr-12 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600"
                  style={{ backgroundImage: 'linear-gradient(to right, rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.5))' }}
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              

            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1" htmlFor="confirm-password">
                Confirmar Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-slate-700 text-white rounded-xl py-4 pl-12 pr-12 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-600"
                  style={{ backgroundImage: 'linear-gradient(to right, rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.5))' }}
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <PasswordRequirements validations={logic.validations} />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white rounded-xl py-4 font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
              style={{ backgroundImage: 'linear-gradient(to right, #2563eb, #2563eb)' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
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
