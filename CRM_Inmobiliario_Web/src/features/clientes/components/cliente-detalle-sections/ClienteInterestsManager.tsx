import { Building2, Plus, Loader2, Check, X, ChevronDown, ExternalLink } from 'lucide-react';
import { DynamicSearchSelect } from '@/components/DynamicSearchSelect';
import { NIVELES_INTERES, formatCurrency } from '../../constants/clientes';
import type { Cliente, Interes } from '../../types';

interface ClienteInterestsManagerProps {
  cliente: Cliente;
  propiedadesOptions: { id: string, title: string, subtitle: string }[] | undefined;
  propiedadPendienteId: string | null;
  setPropiedadPendienteId: (id: string | null) => void;
  nivelInteresPendiente: string;
  setNivelInteresPendiente: (nivel: string) => void;
  vincularStatus: 'idle' | 'saving' | 'success';
  handleVincularPropiedad: () => void;
  updatingInteresId: string | null;
  idInteresABorrar: string | null;
  setIdInteresABorrar: (id: string | null) => void;
  isDeletingInteres: boolean;
  dropdownInteresOpenId: string | null;
  setDropdownInteresOpenId: (id: string | null) => void;
  handleUpdateNivelInteres: (propId: string, nivel: string) => void;
  handleDesvincular: (propId: string) => void;
  navigate: (path: string) => void;
}

export const ClienteInterestsManager = ({
  cliente,
  propiedadesOptions,
  propiedadPendienteId,
  setPropiedadPendienteId,
  nivelInteresPendiente,
  setNivelInteresPendiente,
  vincularStatus,
  handleVincularPropiedad,
  updatingInteresId,
  idInteresABorrar,
  setIdInteresABorrar,
  isDeletingInteres,
  dropdownInteresOpenId,
  setDropdownInteresOpenId,
  handleUpdateNivelInteres,
  handleDesvincular,
  navigate
}: ClienteInterestsManagerProps) => {
  return (
    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Intereses</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Propiedades vinculadas</p>
        </div>
        <Building2 className="h-5 w-5 text-slate-200" />
      </div>

      <div className="mb-6">
        {!propiedadPendienteId ? (
          <DynamicSearchSelect 
            label=""
            placeholder="Vincular propiedad..."
            icon={Plus}
            options={propiedadesOptions}
            onChange={(propId) => {
              if (propId) {
                 setPropiedadPendienteId(propId);
                 setNivelInteresPendiente('Medio');
              }
            }}
          />
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-200">
            <p className="text-xs font-bold text-slate-500 uppercase mb-3">Nivel de Interés para la propiedad</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {NIVELES_INTERES.map(n => (
                <button
                  key={n.value}
                  onClick={() => setNivelInteresPendiente(n.value)}
                  className={`cursor-pointer py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${nivelInteresPendiente === n.value ? n.color + ' border-current shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                >
                  {n.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleVincularPropiedad}
                disabled={vincularStatus === 'saving' || vincularStatus === 'success'}
                className={`cursor-pointer flex-1 font-black text-xs uppercase tracking-widest py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
                  ${vincularStatus === 'success' 
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                    : 'bg-slate-900 text-white shadow-slate-900/10 hover:bg-slate-800 disabled:bg-slate-200 disabled:shadow-none active:scale-95'}`}
              >
                {vincularStatus === 'saving' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : vincularStatus === 'success' ? (
                  <><Check className="h-4 w-4" /> ¡Vinculado!</>
                ) : (
                  <><Check className="h-4 w-4" /> Vincular Ahora</>
                )}
              </button>
              <button 
                onClick={() => { setPropiedadPendienteId(null); }}
                disabled={vincularStatus === 'saving'}
                className="h-[40px] w-[40px] flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-rose-500 rounded-xl transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {!cliente.intereses || cliente.intereses.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs font-bold text-slate-400 italic">No hay propiedades vinculadas</p>
          </div>
        ) : (
          cliente.intereses.map((interes: Interes) => {
            const nivelActual = NIVELES_INTERES.find(n => n.value === interes.nivelInteres) || NIVELES_INTERES[1];
            const isUpdating = updatingInteresId === interes.propiedadId;
            const isThisBeingDeleted = idInteresABorrar === interes.propiedadId;

            return (
              <div key={interes.propiedadId} className="group relative bg-white border border-slate-100 p-4 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all">
                {(isUpdating || (isDeletingInteres && isThisBeingDeleted)) && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl"><Loader2 className="h-5 w-5 text-blue-600 animate-spin" /></div>}
                
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-slate-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase truncate leading-tight group-hover:text-blue-600 transition-colors">{interes.titulo}</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{formatCurrency(interes.precio || 0)}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <div className="relative">
                        <button 
                          onClick={() => setDropdownInteresOpenId(dropdownInteresOpenId === interes.propiedadId ? null : interes.propiedadId)}
                          className={`cursor-pointer text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full flex items-center gap-1 border border-transparent hover:border-current transition-all ${nivelActual.color}`}
                        >
                          {nivelActual.label}
                          <ChevronDown className="h-2.5 w-2.5" />
                        </button>
                        
                        {dropdownInteresOpenId === interes.propiedadId && (
                          <>
                            <div className="fixed inset-0 z-40 cursor-default" onClick={() => setDropdownInteresOpenId(null)}></div>
                            <div className="absolute left-0 bottom-full mb-2 z-50 bg-white border border-slate-100 rounded-xl shadow-2xl p-1 w-32 animate-in fade-in zoom-in-95 duration-200">
                              {NIVELES_INTERES.map(n => (
                                <button 
                                  key={n.value}
                                  onClick={() => {
                                    handleUpdateNivelInteres(interes.propiedadId, n.value);
                                    setDropdownInteresOpenId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-[9px] font-black uppercase hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                                >
                                  {n.label}
                                  {interes.nivelInteres === n.value && <Check className="h-3 w-3 text-blue-600" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center">
                        {isThisBeingDeleted ? (
                          <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg animate-in zoom-in-95 duration-200 border border-rose-100">
                            <button 
                              onClick={() => handleDesvincular(interes.propiedadId)}
                              disabled={isDeletingInteres}
                              className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-md transition-all cursor-pointer"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                            <button 
                              onClick={() => setIdInteresABorrar(null)}
                              disabled={isDeletingInteres}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setIdInteresABorrar(interes.propiedadId)}
                            className="text-[9px] font-black text-slate-300 hover:text-rose-500 uppercase tracking-tighter transition-colors cursor-pointer"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/propiedades?id=${interes.propiedadId}`)}
                    className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
