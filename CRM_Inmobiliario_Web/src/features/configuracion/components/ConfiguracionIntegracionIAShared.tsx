import React from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { Bot, AlertTriangle, Lock, KeyRound, Loader2, Eye, EyeOff } from 'lucide-react';
import type { ConfiguracionIntegracionIALogic } from '../hooks/useConfiguracionIntegracionIALogic';

export const CostEstimateTooltip: React.FC<{ limit: number, aiApiKey: string }> = ({ limit, aiApiKey }) => {
  const isGemini = aiApiKey.startsWith('AIza') || aiApiKey.startsWith('AQ.');
  const providerName = isGemini ? 'Gemini 2.5 Flash' : 'OpenAI GPT-4o-mini';
  const avgPrice = isGemini ? 0.075 : 0.15;
  const estimatedCost = (limit * avgPrice / 1000000).toFixed(4);
  
  const tooltipContent = (
    <div className="w-[calc(100vw-2rem)] sm:w-64 max-w-[256px]">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-indigo-100/50">
        <div className="p-1.5 bg-indigo-100/80 rounded-lg text-indigo-600 shrink-0">
          <Bot className="w-4 h-4" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-widest text-indigo-900 flex-1 min-w-0 break-words">Estimación de Costo</p>
      </div>
      <p className="text-xs text-slate-600 font-medium leading-relaxed break-words">
        Cálculo aproximado basado en un costo de <strong className="text-indigo-600 font-bold">${avgPrice} por 1M de tokens</strong> ({providerName}).
      </p>
      <div className="mt-3 bg-indigo-50/50 rounded-lg p-2 border border-indigo-100/50 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase flex-1 min-w-0 break-words">Costo Max. Diario</span>
        <span className="text-xs font-black text-indigo-600 shrink-0">${estimatedCost} USD</span>
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent} variant="premium" className="mt-1" position="top">
      <span className="text-xs font-bold text-slate-500 cursor-help border-b border-dashed border-slate-400 block">
        ≈ ${estimatedCost} USD
      </span>
    </Tooltip>
  );
};

export const LimitWarning: React.FC<{ limit: number }> = ({ limit }) => {
  if (limit < 20000) {
    return (
      <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in mt-3">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <p className="text-sm flex-1 min-w-0 break-words">El límite mínimo es 20,000. Límites menores detendrán el bot casi de inmediato.</p>
      </div>
    );
  }
  if (limit > 1000000) {
    return (
      <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in mt-3">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <p className="text-sm flex-1 min-w-0 break-words">El límite máximo es 1,000,000. Superar este límite expone la cuenta a costos excesivos.</p>
      </div>
    );
  }
  return null;
};

export const ConfiguracionIntegracionIAAuth: React.FC<{ logic: ConfiguracionIntegracionIALogic }> = ({ logic }) => {
  const { password, setPassword, isLoading, handleAuthenticate } = logic;
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="space-y-6">
      <section className="bg-slate-100/50 p-4 sm:p-6 rounded-[40px] border border-slate-200/60 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-xl mx-auto mt-12">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 shrink-0">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight break-words">Área Segura</h2>
          <p className="text-slate-600 font-medium mt-2 break-words">
            Por seguridad, re-ingresa tu contraseña para acceder a tus llaves de integración y límites de uso.
          </p>
        </div>

        <form onSubmit={handleAuthenticate} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block break-words">Contraseña</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña..."
                className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full cursor-pointer flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin shrink-0" /> : <Lock size={18} className="shrink-0" />}
              <span className="break-words">Verificar Identidad</span>
            </button>
        </form>
      </section>
    </div>
  );
};
