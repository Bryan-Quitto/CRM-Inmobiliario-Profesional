import { ChevronLeft, Loader2, ChevronDown, Check, PhoneCall, UserCheck, Search } from 'lucide-react';
import { ETAPAS, ETAPAS_PROPIETARIO } from '../../constants/contactos';
import { useLocation } from 'react-router-dom';
import type { Contacto } from '../../types';

interface ContactoHeaderProps {
  contacto: Contacto;
  isUpdatingEtapa: boolean;
  activeDropdown: 'cliente' | 'propietario' | null;
  setActiveDropdown: (show: 'cliente' | 'propietario' | null) => void;
  handleStageChange: (etapa: string, data?: { propiedadId: string, precioCierre: number, nuevoEstadoPropiedad: string }, tipo?: 'cliente' | 'propietario') => void;
  navigate: (path: string) => void;
}

export const ContactoHeader = ({
  contacto,
  isUpdatingEtapa,
  activeDropdown,
  setActiveDropdown,
  handleStageChange,
  navigate
}: ContactoHeaderProps) => {
  const { pathname } = useLocation();
  const isFromOwners = pathname.includes('/propietarios');
  const backPath = isFromOwners ? '/propietarios' : '/contactos';
  
  const etapaCliente = ETAPAS.find(e => e.value === contacto.etapaEmbudo) || ETAPAS[0];
  const etapaPropietario = ETAPAS_PROPIETARIO.find(e => e.value === contacto.estadoPropietario) || ETAPAS_PROPIETARIO[0];

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
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{[contacto.nombre, contacto.apellido].filter(Boolean).join(' ')}</h1>
            
            <div className="flex items-center gap-3">
              {/* Badge & Dropdown de Cliente */}
              {contacto.esContacto && (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Cliente
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => !isUpdatingEtapa && setActiveDropdown(activeDropdown === 'cliente' ? null : 'cliente')}
                      disabled={isUpdatingEtapa}
                      className={`cursor-pointer px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-2 transition-all ${etapaCliente.color} ${isUpdatingEtapa ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
                    >
                      {isUpdatingEtapa && activeDropdown === 'cliente' ? <Loader2 className="h-3 w-3 animate-spin" /> : contacto.etapaEmbudo}
                      <ChevronDown className={`h-3 w-3 transition-transform ${activeDropdown === 'cliente' ? 'rotate-180' : ''}`} />
                    </button>

                    {activeDropdown === 'cliente' && (
                      <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in-95 duration-200">
                        {ETAPAS.map((etapa) => (
                          <button
                            key={etapa.value}
                            onClick={() => handleStageChange(etapa.value, undefined, 'cliente')}
                            className={`cursor-pointer w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 ${
                              contacto.etapaEmbudo === etapa.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                            }`}
                          >
                            {etapa.label}
                            {contacto.etapaEmbudo === etapa.value && <Check className="h-3.5 w-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Badge & Dropdown de Propietario */}
              {contacto.esPropietario && (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    Propietario
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => !isUpdatingEtapa && setActiveDropdown(activeDropdown === 'propietario' ? null : 'propietario')}
                      disabled={isUpdatingEtapa}
                      className={`cursor-pointer px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-2 transition-all ${etapaPropietario.color} ${isUpdatingEtapa ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
                    >
                      {isUpdatingEtapa && activeDropdown === 'propietario' ? <Loader2 className="h-3 w-3 animate-spin" /> : contacto.estadoPropietario}
                      <ChevronDown className={`h-3 w-3 transition-transform ${activeDropdown === 'propietario' ? 'rotate-180' : ''}`} />
                    </button>

                    {activeDropdown === 'propietario' && (
                      <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in-95 duration-200">
                        {ETAPAS_PROPIETARIO.map((etapa) => (
                          <button
                            key={etapa.value}
                            onClick={() => handleStageChange(etapa.value, undefined, 'propietario')}
                            className={`cursor-pointer w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 ${
                              contacto.estadoPropietario === etapa.value ? 'text-emerald-600 bg-emerald-50/30' : 'text-slate-600'
                            }`}
                          >
                            {etapa.label}
                            {contacto.estadoPropietario === etapa.value && <Check className="h-3.5 w-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Expediente del Contacto</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a 
          href={`tel:${contacto.telefono}`}
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
