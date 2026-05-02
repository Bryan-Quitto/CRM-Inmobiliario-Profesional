import { Pencil, Send, Loader2, Search, Filter as FilterIcon, Phone, MessageSquare, Clock, Check, X, Trash2 } from 'lucide-react';
import { TIPO_NOTA_OPCIONES, formatDate } from '../../constants/contactos';
import type { Interaccion } from '../../types';

interface ContactoTimelineManagerProps {
  nuevaNota: string;
  setNuevaNota: (nota: string) => void;
  tipoNota: string;
  setTipoNota: (tipo: string) => void;
  notaEnEdicion: string | null;
  setNotaEnEdicion: (id: string | null) => void;
  isSavingNota: boolean;
  handleSaveNota: () => void;
  searchHistorial: string;
  setSearchHistorial: (search: string) => void;
  filterTipoTimeline: string;
  setFilterTipoTimeline: (tipo: string) => void;
  historialFiltrado: Interaccion[];
  idInteraccionABorrar: string | null;
  setIdInteraccionABorrar: (id: string | null) => void;
  handleEditarNota: (interaccion: Interaccion) => void;
  handleEliminarNota: (id: string) => void;
}

export const ContactoTimelineManager = ({
  nuevaNota,
  setNuevaNota,
  tipoNota,
  setTipoNota,
  notaEnEdicion,
  setNotaEnEdicion,
  isSavingNota,
  handleSaveNota,
  searchHistorial,
  setSearchHistorial,
  filterTipoTimeline,
  setFilterTipoTimeline,
  historialFiltrado,
  idInteraccionABorrar,
  setIdInteraccionABorrar,
  handleEditarNota,
  handleEliminarNota
}: ContactoTimelineManagerProps) => {
  return (
    <div className="lg:col-span-8 space-y-8">
      {/* Editor de Notas */}
      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm overflow-hidden relative group">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {notaEnEdicion ? 'Editando Nota' : 'Nueva Interacción'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registra el progreso</p>
            </div>
          </div>
          {notaEnEdicion && (
            <button 
              onClick={() => { setNotaEnEdicion(null); setNuevaNota(''); setTipoNota('Nota'); }}
              className="text-[10px] font-black text-rose-500 uppercase hover:underline cursor-pointer"
            >
              Cancelar Edición
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl w-fit">
            {TIPO_NOTA_OPCIONES.map(opt => (
              <button 
                key={opt.value}
                onClick={() => setTipoNota(opt.value)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${tipoNota === opt.value ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea 
              value={nuevaNota}
              onChange={(e) => setNuevaNota(e.target.value)}
              placeholder="Escribe aquí los detalles de la interacción..."
              className="w-full bg-slate-50 border border-slate-100 rounded-[24px] p-6 text-slate-700 font-medium text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all outline-none min-h-[120px] resize-none"
            />
            <button 
              onClick={handleSaveNota}
              disabled={isSavingNota || !nuevaNota.trim()}
              className="absolute bottom-4 right-4 bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-2 disabled:bg-slate-200 disabled:shadow-none active:scale-95 cursor-pointer"
            >
              {isSavingNota ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {notaEnEdicion ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      {/* Timeline de Historial */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Línea de Tiempo</h3>
            <p className="text-xs font-bold text-slate-400 italic">Cronología de actividades</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={searchHistorial}
                onChange={(e) => setSearchHistorial(e.target.value)}
                placeholder="Buscar notas..."
                className="bg-white border border-slate-200 rounded-full pl-9 pr-4 py-2 text-[10px] font-bold text-slate-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none w-40 sm:w-56"
              />
            </div>
            <div className="relative group/filter">
              <button className="h-9 w-9 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm cursor-pointer">
                <FilterIcon className="h-4 w-4" />
              </button>
              <div className="absolute right-0 top-full mt-2 hidden group-hover/filter:block z-50 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 w-40 animate-in fade-in zoom-in-95 duration-200">
                <button 
                  onClick={() => setFilterTipoTimeline('Todos')} 
                  className={`w-full text-left px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-colors cursor-pointer ${filterTipoTimeline === 'Todos' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  Todos
                </button>
                {TIPO_NOTA_OPCIONES.map(opt => (
                  <button 
                    key={opt.value} 
                    onClick={() => setFilterTipoTimeline(opt.value)} 
                    className={`w-full text-left px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-colors cursor-pointer ${filterTipoTimeline === opt.value ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-600'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>          </div>
        </div>

        <div className="relative space-y-10 before:absolute before:left-6 before:top-4 before:bottom-0 before:w-0.5 before:bg-slate-200 before:content-['']">
          {historialFiltrado.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 ml-12">
              <p className="text-sm font-bold text-slate-400 italic">No hay registros que coincidan con el filtro</p>
            </div>
          ) : (
            historialFiltrado.map((interaccion) => (
              <div key={interaccion.id} className="relative pl-14 group">
                <div className="absolute left-3 top-0 h-7 w-7 bg-white border-2 border-slate-200 rounded-full z-10 flex items-center justify-center group-hover:border-blue-500 transition-colors shadow-sm">
                  {interaccion.tipoInteraccion === 'Llamada' ? <Phone className="h-3.5 w-3.5 text-blue-500" /> : interaccion.tipoInteraccion === 'WhatsApp' ? <MessageSquare className="h-3.5 w-3.5 text-emerald-500" /> : <Clock className="h-3.5 w-3.5 text-slate-400" />}
                </div>
                
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{interaccion.tipoInteraccion}</span>
                      <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{formatDate(interaccion.fechaInteraccion)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {idInteraccionABorrar === interaccion.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg animate-in zoom-in duration-200">
                          <button onClick={() => { handleEliminarNota(interaccion.id); setIdInteraccionABorrar(null); }} className="p-1 text-rose-600 hover:bg-rose-100 rounded-md transition-all cursor-pointer"><Check className="h-3 w-3" /></button>
                          <button onClick={() => setIdInteraccionABorrar(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-md transition-all cursor-pointer"><X className="h-3 w-3" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditarNota(interaccion)} className="p-1.5 hover:bg-blue-50 text-slate-300 hover:text-blue-600 rounded-lg transition-all cursor-pointer"><Pencil className="h-3 w-3" /></button>
                          <button onClick={() => setIdInteraccionABorrar(interaccion.id)} className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition-all cursor-pointer"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all duration-500 italic text-sm font-medium text-slate-600 contactoing-relaxed">"{interaccion.notas}"</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
