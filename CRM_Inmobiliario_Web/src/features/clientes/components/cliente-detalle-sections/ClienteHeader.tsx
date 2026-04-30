import { ChevronLeft, Loader2, ChevronDown, Check, PhoneCall, UserCheck } from 'lucide-react';
import { ETAPAS } from '../../constants/clientes';
import { useLocation } from 'react-router-dom';
import type { Cliente } from '../../types';

interface ClienteHeaderProps {
  cliente: Cliente;
  isUpdatingEtapa: boolean;
  showEtapaDropdown: boolean;
  setShowEtapaDropdown: (show: boolean) => void;
  handleStageChange: (etapa: string) => void;
  navigate: (path: string) => void;
}

export const ClienteHeader = ({
  cliente,
  isUpdatingEtapa,
  showEtapaDropdown,
  setShowEtapaDropdown,
  handleStageChange,
  navigate
}: ClienteHeaderProps) => {
  const { pathname } = useLocation();
  const isFromOwners = pathname.includes('/propietarios');
  const backPath = isFromOwners ? '/propietarios' : '/prospectos';
  const etapaActual = ETAPAS.find(e => e.value === cliente.etapaEmbudo) || ETAPAS[0];

  return (
    <div className="bg-white border-b border-slate-100 sticky top-0 z-[100] px-6 py-4 flex items-center justify-between backdrop-blur-md bg-white/80">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(backPath)}
          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{[cliente.nombre, cliente.apellido].filter(Boolean).join(' ')}</h1>
            
            <div className="flex items-center gap-2">
              {cliente.esPropietario && (
                <div className="px-3 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  Propietario
                </div>
              )}
              
              <div className="relative">
                <button 
                  onClick={() => !isUpdatingEtapa && setShowEtapaDropdown(!showEtapaDropdown)}
                  disabled={isUpdatingEtapa}
                  className={`cursor-pointer px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-2 transition-all ${etapaActual.color} ${isUpdatingEtapa ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
                >
                  {isUpdatingEtapa ? <Loader2 className="h-3 w-3 animate-spin" /> : cliente.etapaEmbudo}
                  <ChevronDown className={`h-3 w-3 transition-transform ${showEtapaDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showEtapaDropdown && (
                  <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in-95 duration-200">
                    {ETAPAS.map((etapa) => (
                      <button
                        key={etapa.value}
                        onClick={() => handleStageChange(etapa.value)}
                        className={`cursor-pointer w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 ${
                          cliente.etapaEmbudo === etapa.value ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'
                        }`}
                      >
                        {etapa.label}
                        {cliente.etapaEmbudo === etapa.value && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Expediente del Contacto</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a 
          href={`tel:${cliente.telefono}`}
          className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 cursor-pointer"
        >
          <PhoneCall className="h-5 w-5" />
        </a>
        <button className="h-10 px-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 cursor-pointer">
          Acciones
        </button>
      </div>
    </div>
  );
};
