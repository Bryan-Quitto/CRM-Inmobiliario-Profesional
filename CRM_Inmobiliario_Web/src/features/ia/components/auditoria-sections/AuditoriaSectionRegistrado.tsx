import { Bot, User, Loader2, Check, X, Pencil, Trash2, Calendar } from 'lucide-react';

interface SectionRegistradoProps {
  registradoPorIA: boolean;
  clienteId: string | null;
  idABorrar: string | null;
  setIdABorrar: (id: string | null) => void;
  isDeleting: boolean;
  handleEditClick: (id: string) => void;
  handleConfirmDelete: (id: string) => void;
}

export const AuditoriaSectionRegistrado = ({
  registradoPorIA,
  clienteId,
  idABorrar,
  setIdABorrar,
  isDeleting,
  handleEditClick,
  handleConfirmDelete
}: SectionRegistradoProps) => {
  return (
    <div className="px-6 py-8 bg-blue-50/30 rounded-[2rem] border border-blue-100/50 animate-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {registradoPorIA ? (
            <>
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl shadow-blue-500/10 border border-blue-50">
                <Bot size={32} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-600/20">
                    IA-Nativo
                  </span>
                  <h4 className="text-lg font-black text-slate-900">Registrado por IA</h4>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Historial de registro IA confirmado
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-xl shadow-slate-500/10 border border-slate-100">
                <User size={32} />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">Registrado por el agente</h4>
                <p className="text-[11px] font-bold text-slate-400 mt-1 italic">Ingreso manual o vía importación</p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {idABorrar === clienteId && clienteId ? (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-xl border border-rose-100 animate-in zoom-in duration-200">
              <p className="text-[10px] font-black text-rose-500 uppercase px-3">¿Borrar?</p>
              <button 
                onClick={() => handleConfirmDelete(clienteId)}
                disabled={isDeleting}
                className="h-10 w-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5" />}
              </button>
              <button 
                onClick={() => setIdABorrar(null)}
                disabled={isDeleting}
                className="h-10 w-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => clienteId && handleEditClick(clienteId)}
                className="h-14 w-14 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl flex items-center justify-center transition-all shadow-sm border border-slate-100 hover:border-blue-200 cursor-pointer group/btn"
              >
                <Pencil className="h-6 w-6 group-hover/btn:scale-110 transition-transform" />
              </button>
              <button 
                onClick={() => setIdABorrar(clienteId)}
                className="h-14 w-14 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl flex items-center justify-center transition-all shadow-sm border border-slate-100 hover:border-rose-200 cursor-pointer group/btn"
              >
                <Trash2 className="h-6 w-6 group-hover/btn:scale-110 transition-transform" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
