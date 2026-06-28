import { X, ArrowUpDown, Loader2, AlertCircle, Phone, MessageCircle, HelpCircle } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import type { UseMergeContactosLogicReturn } from '../hooks/useMergeContactosLogic';

interface MergeContactosModalMobileProps {
  logic: UseMergeContactosLogicReturn;
}

export const MergeContactosModalMobile = ({ logic }: MergeContactosModalMobileProps) => {
  const {
    localPrincipal,
    localSecundario,
    setLocalSecundario,
    searchTerm,
    setSearchTerm,
    isLoading,
    isMerging,
    handleSwap,
    handleMerge,
    searchResults,
    onClose
  } = logic;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-end justify-center sm:items-center sm:p-2">
      <div className="bg-white w-full rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-full sm:fade-in sm:zoom-in duration-300 flex flex-col max-h-[85vh]">
        {/* Header - Fixed */}
        <div className="relative w-full p-3 border-b border-slate-100 flex-shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="pr-12 w-full">
            <h2 className="text-base md:text-xl font-black text-slate-900 uppercase tracking-tight break-words">Fusionar Contactos</h2>
            <p className="text-xs font-bold text-slate-500 mt-1 break-words">
              Unifica el historial de dos contactos. El contacto principal conservará su ID.
            </p>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="w-full p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 flex-1">
          <div className="flex flex-col gap-2 w-full">
            
            {/* Principal */}
            <div className="bg-blue-50/50 border-2 border-blue-100 rounded-xl p-3 relative w-full">
              <div className="absolute -top-3 left-4 px-3 py-1 bg-blue-100 text-blue-700 font-black text-[10px] uppercase tracking-widest rounded-full">
                Principal (Se Conserva)
              </div>
              
              <div className="mt-2 w-full">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight break-words">
                  {[localPrincipal.nombre, localPrincipal.apellido].filter(Boolean).join(' ')}
                </h3>
                
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 w-full">
                  {localPrincipal.telefono && (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 w-full sm:w-auto">
                      <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="flex-1 min-w-0 break-words">{localPrincipal.telefono}</span>
                    </div>
                  )}
                  {localPrincipal.facebookSenderId && (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 w-full sm:w-auto">
                      <MessageCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="flex-1 min-w-0 break-words">Messenger ID: {localPrincipal.facebookSenderId.slice(0, 8)}...</span>
                    </div>
                  )}
                  <div className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 break-words">
                    Etapa: {localPrincipal.etapaEmbudo}
                  </div>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-2 relative z-10 w-full">
              <button
                title="Invertir Principal y Secundario"
                onClick={handleSwap}
                disabled={!localSecundario}
                className={`p-3 rounded-full transition-all border-4 border-white ${
                  localSecundario 
                    ? 'bg-slate-900 text-white hover:scale-110 shadow-lg cursor-pointer' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ArrowUpDown className="h-5 w-5" />
              </button>
            </div>

            {/* Secundario */}
            <div className="bg-rose-50/50 border-2 border-rose-100 rounded-xl p-3 relative min-h-[160px] w-full">
              <div className="absolute -top-3 left-4 px-3 py-1 bg-rose-100 text-rose-700 font-black text-[10px] uppercase tracking-widest rounded-full">
                Secundario (Se Elimina)
              </div>

              {localSecundario ? (
                <div className="mt-2 relative w-full">
                   <button 
                    onClick={() => setLocalSecundario(null)}
                    className="absolute -top-2 -right-2 p-1.5 bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all shadow-sm border border-slate-100 cursor-pointer z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight pr-6 break-words">
                    {[localSecundario.nombre, localSecundario.apellido].filter(Boolean).join(' ')}
                  </h3>
                  
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 w-full">
                    {localSecundario.telefono && (
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 w-full sm:w-auto">
                        <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="flex-1 min-w-0 break-words">{localSecundario.telefono}</span>
                      </div>
                    )}
                    {localSecundario.facebookSenderId && (
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 w-full sm:w-auto">
                        <MessageCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="flex-1 min-w-0 break-words">Messenger ID: {localSecundario.facebookSenderId.slice(0, 8)}...</span>
                      </div>
                    )}
                    <div className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 break-words">
                      Etapa: {localSecundario.etapaEmbudo}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 w-full">
                  <div className="relative w-full">
                    <SearchInput
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar contacto..."
                      className="py-3 border-2 focus:ring-blue-500/10 font-bold text-slate-700"
                    />
                    {isLoading && (
                      <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin pointer-events-none" />
                    )}
                  </div>

                  <div className="mt-3 flex items-start gap-2 w-full">
                    <HelpCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-medium text-slate-500 leading-tight flex-1 min-w-0 break-words">
                      No es posible fusionar dos contactos si ambos ya tienen un número de WhatsApp activo o si ambos tienen un canal de Facebook Messenger activo.
                    </p>
                  </div>

                  {searchTerm.length >= 2 && !isLoading && searchResults.length === 0 && (
                    <div className="mt-4 text-center p-3 w-full">
                      <AlertCircle className="h-5 w-5 text-slate-400 mx-auto mb-1 shrink-0" />
                      <p className="text-xs font-bold text-slate-500 break-words">
                        No se encontraron contactos compatibles.
                      </p>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="mt-3 space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-1 w-full">
                      {searchResults.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setLocalSecundario(c);
                            setSearchTerm('');
                          }}
                          className="w-full p-3 bg-white border border-slate-200 rounded-lg active:border-blue-500 active:bg-blue-50 text-left transition-all cursor-pointer"
                        >
                          <div className="text-sm font-black text-slate-700 uppercase tracking-tight break-words">
                            {[c.nombre, c.apellido].filter(Boolean).join(' ')}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3 mt-1.5 w-full">
                            {c.telefono && (
                              <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 w-full sm:w-auto">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span className="flex-1 min-w-0 break-words">{c.telefono}</span>
                              </div>
                            )}
                            {c.facebookSenderId && (
                              <div className="text-[10px] font-bold text-blue-600 flex items-center gap-1 w-full sm:w-auto">
                                <MessageCircle className="h-3 w-3 shrink-0" />
                                <span className="flex-1 min-w-0 break-words">FB</span>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="w-full p-2 sm:p-3 border-t border-slate-100 flex-shrink-0 bg-white rounded-b-3xl">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              onClick={handleMerge}
              disabled={!localSecundario || isMerging}
              className={`w-full py-3.5 sm:py-3 text-sm font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${
                localSecundario && !isMerging
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isMerging ? (
                <Loader2 className="h-5 w-5 animate-spin shrink-0" />
              ) : (
                'Confirmar Fusión'
              )}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 sm:py-3 text-sm font-black text-slate-500 uppercase tracking-widest active:bg-slate-100 rounded-lg transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
