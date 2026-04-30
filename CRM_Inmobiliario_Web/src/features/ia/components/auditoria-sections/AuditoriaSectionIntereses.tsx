import { TrendingUp, Loader2, MapPin, ChevronDown, Check, Eye, ExternalLink, Trash2, MessageSquare, Clock, X } from 'lucide-react';
import { useInteresesIA } from '../../hooks/useInteresesIA';
import { NIVELES_INTERES, currencyFormatter, dateFormatter } from '../../constants/auditoriaConstants';
import type { InteresResumen, LogResponse, ClientGroup } from '../../types/auditoria';

interface SectionInteresesProps {
  clienteId: string | null;
  intereses: InteresResumen[];
  logs: LogResponse[];
  mutate: () => Promise<ClientGroup[] | undefined>;
}

export const AuditoriaSectionIntereses = ({ clienteId, intereses, logs, mutate }: SectionInteresesProps) => {
  const {
    updatingInteresId,
    interesABorrarId,
    setInteresABorrarId,
    isDeletingInteres,
    dropdownInteresOpenId,
    setDropdownInteresOpenId,
    dropdownPosition,
    setDropdownPosition,
    expandedInteresId,
    setExpandedInteresId,
    handleUpdateNivelInteres,
    handleConfirmDeleteInteres
  } = useInteresesIA(mutate);

  const getNivelInteresColor = (nivel: string | null | undefined) => {
    if (!nivel) return 'bg-slate-100 text-slate-500';
    switch (nivel.toLowerCase()) {
      case 'alto': return 'bg-rose-500 text-white shadow-rose-500/20';
      case 'medio': return 'bg-orange-500 text-white shadow-orange-500/20';
      case 'bajo': return 'bg-slate-400 text-white shadow-slate-400/20';
      case 'descartada': return 'bg-slate-900 text-white shadow-slate-900/20';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="space-y-4 animate-in zoom-in-95 duration-300">
      {intereses.length === 0 ? (
        <div className="p-12 text-center bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
          <TrendingUp className="h-10 w-10 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Aún no se han detectado intereses</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {intereses.map((interes) => {
            const nivelActual = NIVELES_INTERES.find(n => n.value === interes.nivelInteres) || NIVELES_INTERES[1];
            const isUpdating = updatingInteresId === interes.propiedadId;
            const isDeletingInt = interesABorrarId === interes.propiedadId;

            return (
              <div 
                key={interes.propiedadId}
                className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-4 flex flex-col gap-4 hover:border-blue-100 transition-all group/card shadow-sm hover:shadow-xl hover:shadow-blue-600/5 relative"
              >
                {isUpdating && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-[2.5rem]"><Loader2 className="h-8 w-8 text-blue-600 animate-spin" /></div>}
                
                <div className="flex items-center gap-6">
                  {/* Foto Mini-Premium */}
                  <div className="relative h-24 w-24 shrink-0 rounded-3xl overflow-hidden bg-slate-100 shadow-inner group-hover/card:scale-105 transition-transform duration-500">
                    {interes.imagenUrl ? (
                      <img src={interes.imagenUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-300"><MapPin size={24} /></div>
                    )}
                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter shadow-xl ${getNivelInteresColor(interes.nivelInteres)}`}>
                      {interes.nivelInteres}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-md font-black text-slate-900 truncate tracking-tight">{interes.titulo}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-blue-600 font-black text-sm">{currencyFormatter.format(interes.precio)}</p>
                      <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
                      <p className="text-slate-400 font-bold text-[11px] truncate">{interes.sector || 'Sector no especificado'}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-3">
                      {/* Dropdown Nivel de Interés */}
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            if (dropdownInteresOpenId === interes.propiedadId) {
                              setDropdownInteresOpenId(null);
                              setDropdownPosition(null);
                            } else {
                              const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                              const menuHeight = 180;
                              const openUp = rect.bottom + menuHeight > window.innerHeight - 16;
                              setDropdownPosition({
                                top: openUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
                                left: rect.left,
                                openUp,
                              });
                              setDropdownInteresOpenId(interes.propiedadId);
                            }
                          }}
                          className={`cursor-pointer text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl flex items-center gap-2 border border-transparent hover:border-current transition-all shadow-sm ${nivelActual.color}`}
                        >
                          {nivelActual.label}
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        
                        {dropdownInteresOpenId === interes.propiedadId && dropdownPosition && (
                          <>
                            <div
                              className="fixed inset-0 z-40 cursor-default"
                              onClick={() => { setDropdownInteresOpenId(null); setDropdownPosition(null); }}
                            />
                            <div
                              className="fixed z-50 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 w-40 animate-in fade-in zoom-in-95 duration-200"
                              style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                            >
                              {NIVELES_INTERES.map(n => (
                                <button 
                                  key={n.value}
                                  onClick={() => { if (clienteId) handleUpdateNivelInteres(clienteId, interes.propiedadId, n.value); }}
                                  className="w-full text-left px-4 py-2 text-[10px] font-black uppercase hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                                >
                                  {n.label}
                                  {interes.nivelInteres === n.value && <Check className="h-3.5 w-3.5 text-blue-600" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      <button 
                        onClick={() => setExpandedInteresId(expandedInteresId === interes.propiedadId ? null : interes.propiedadId)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                          expandedInteresId === interes.propiedadId ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <Eye size={12} />
                        Ver Disparador
                      </button>
                      <button 
                        onClick={() => window.location.href = `/propiedades?id=${interes.propiedadId}`}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                      >
                        <ExternalLink size={12} />
                        Ver Ficha
                      </button>

                      <div className="flex items-center ml-auto">
                        {isDeletingInt ? (
                          <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl animate-in zoom-in-95 duration-200 border border-rose-100">
                            <p className="text-[8px] font-black text-rose-500 uppercase px-2">¿Quitar?</p>
                            <button 
                              onClick={() => clienteId && handleConfirmDeleteInteres(clienteId, interes.propiedadId)}
                              disabled={isDeletingInteres}
                              className="h-8 w-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-all cursor-pointer shadow-sm"
                            >
                              {isDeletingInteres ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-4 w-4" />}
                            </button>
                            <button 
                              onClick={() => setInteresABorrarId(null)}
                              disabled={isDeletingInteres}
                              className="h-8 w-8 bg-white text-slate-400 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer border border-slate-100"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setInteresABorrarId(interes.propiedadId)}
                            className="h-9 w-9 bg-white text-slate-300 hover:text-rose-500 rounded-xl flex items-center justify-center transition-all border border-slate-50 hover:border-rose-100 hover:shadow-sm cursor-pointer group/trash"
                          >
                            <Trash2 size={14} className="group-hover/trash:scale-110 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {expandedInteresId === interes.propiedadId && (
                  <div className="mt-2 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare size={14} className="text-blue-500" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contexto de la IA:</span>
                    </div>
                    {(() => {
                      const logInteres = logs.find(l => 
                        l.accion === 'RegistroInteres' && 
                        l.detalleJson?.includes(interes.propiedadId)
                      );
                      return (
                        <p className="text-xs font-bold text-slate-600 leading-relaxed italic border-l-4 border-blue-200 pl-4">
                          "{logInteres?.triggerMessage || 'La IA detectó interés en base a los requerimientos del cliente.'}"
                        </p>
                      );
                    })()}
                    <div className="mt-4 flex items-center justify-end text-[8px] font-black text-slate-300 uppercase tracking-widest gap-2">
                      <Clock size={10} />
                      Detectado el {dateFormatter.format(new Date(interes.fecha))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
