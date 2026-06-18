import { useState } from 'react';
import { X, Search, ArrowRightLeft, Loader2, AlertCircle, Phone, MessageCircle, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import useSWR, { mutate as globalMutate } from 'swr';
import { api } from '@/lib/axios';
import { useDebounce } from '@/hooks/useDebounce';
import type { Contacto } from '../types';
import type { GetContactosResponse } from '../api/getContactos';

interface MergeContactosModalProps {
  contactoOriginal: Contacto;
  onClose: () => void;
  onSuccess: (nuevoPrincipalId: string) => void;
}

export const MergeContactosModal = ({ contactoOriginal, onClose, onSuccess }: MergeContactosModalProps) => {
  const [localPrincipal, setLocalPrincipal] = useState<Contacto>(contactoOriginal);
  const [localSecundario, setLocalSecundario] = useState<Contacto | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const { data, isLoading } = useSWR<GetContactosResponse>(
    debouncedSearch.length >= 2 ? ['/contactos', debouncedSearch] : null,
    async () => {
      const { data: res } = await api.get<GetContactosResponse>('/contactos', {
        params: { search: debouncedSearch, pageSize: 10 }
      });
      return res;
    }
  );

  const [isMerging, setIsMerging] = useState(false);

  const handleSwap = () => {
    if (!localSecundario) return;
    setLocalPrincipal(localSecundario);
    setLocalSecundario(localPrincipal);
  };

  const handleMerge = async () => {
    if (!localSecundario) return;
    setIsMerging(true);
    try {
      await api.post('/contactos/fusionar', {
        primaryContactoId: localPrincipal.id,
        secondaryContactoId: localSecundario.id
      });
      
      // Invalidate contacts list and tasks (agenda) to respect Zero-Wait policy
      globalMutate(key => Array.isArray(key) && key[0] === '/contactos', undefined, { revalidate: true });
      globalMutate('/tareas');
      globalMutate('/dashboard/kpis');
      
      toast.success('Contactos fusionados exitosamente');
      onSuccess(localPrincipal.id);
    } catch (error) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Error al fusionar contactos');
    } finally {
      setIsMerging(false);
    }
  };

  const hasTelefono = Boolean(localPrincipal.telefono);
  const hasFb = Boolean(localPrincipal.facebookSenderId);

  const searchResults = (data?.items || []).filter(c => {
    if (c.id === localPrincipal.id) return false;
    if (hasTelefono && c.telefono) return false;
    if (hasFb && c.facebookSenderId) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-4xl shadow-2xl animate-in fade-in zoom-in duration-300 relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Fusionar Contactos</h2>
          <p className="text-sm font-bold text-slate-500 mt-1">
            Unifica el historial de dos contactos. El contacto principal conservará su ID.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-start">
          
          {/* Principal */}
          <div className="bg-blue-50/50 border-2 border-blue-100 rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-6 px-3 py-1 bg-blue-100 text-blue-700 font-black text-[10px] uppercase tracking-widest rounded-full">
              Principal (Se Conserva)
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {[localPrincipal.nombre, localPrincipal.apellido].filter(Boolean).join(' ')}
              </h3>
              
              <div className="mt-4 space-y-2">
                {localPrincipal.telefono && (
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <Phone className="h-4 w-4 text-emerald-500" />
                    {localPrincipal.telefono}
                  </div>
                )}
                {localPrincipal.facebookSenderId && (
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    Messenger ID: {localPrincipal.facebookSenderId.slice(0, 8)}...
                  </div>
                )}
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  Etapa: {localPrincipal.etapaEmbudo}
                </div>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center md:pt-16">
            <button
              onClick={handleSwap}
              disabled={!localSecundario}
              title="Invertir Principal y Secundario"
              className={`p-4 rounded-full transition-all ${
                localSecundario 
                  ? 'bg-slate-900 text-white hover:scale-110 hover:shadow-lg hover:shadow-slate-900/20 cursor-pointer' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ArrowRightLeft className="h-6 w-6 md:rotate-0 rotate-90" />
            </button>
          </div>

          {/* Secundario */}
          <div className="bg-rose-50/50 border-2 border-rose-100 rounded-2xl p-6 relative min-h-[200px]">
            <div className="absolute -top-3 left-6 px-3 py-1 bg-rose-100 text-rose-700 font-black text-[10px] uppercase tracking-widest rounded-full">
              Secundario (Se Elimina)
            </div>

            {localSecundario ? (
              <div className="mt-4 relative">
                 <button 
                  onClick={() => setLocalSecundario(null)}
                  className="absolute -top-2 -right-2 p-1.5 bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all shadow-sm border border-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>

                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight pr-6">
                  {[localSecundario.nombre, localSecundario.apellido].filter(Boolean).join(' ')}
                </h3>
                
                <div className="mt-4 space-y-2">
                  {localSecundario.telefono && (
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <Phone className="h-4 w-4 text-emerald-500" />
                      {localSecundario.telefono}
                    </div>
                  )}
                  {localSecundario.facebookSenderId && (
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      Messenger ID: {localSecundario.facebookSenderId.slice(0, 8)}...
                    </div>
                  )}
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                    Etapa: {localSecundario.etapaEmbudo}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar contacto..."
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700"
                  />
                  {isLoading && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 animate-spin" />
                  )}
                </div>

                <div className="mt-3 flex items-center gap-1.5 group relative w-max">
                  <HelpCircle className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-[11px] font-bold text-slate-500 group-hover:text-blue-600 transition-colors cursor-help uppercase tracking-wide">
                    ¿No encuentras al contacto que buscas?
                  </span>
                  
                  <div className="absolute top-full left-0 mt-2 w-72 p-4 bg-slate-900 text-slate-200 text-xs rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 leading-relaxed font-medium border border-slate-800">
                    Por motivos de integridad de datos, no es posible fusionar dos contactos si ambos ya tienen un número de WhatsApp activo o si ambos tienen un canal de Facebook Messenger activo.
                    <div className="absolute -top-1.5 left-6 w-3 h-3 bg-slate-900 rotate-45 border-l border-t border-slate-800"></div>
                  </div>
                </div>

                {searchTerm.length >= 2 && !isLoading && searchResults.length === 0 && (
                  <div className="mt-4 text-center p-4">
                    <AlertCircle className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-500">
                      No se encontraron contactos compatibles (sin colisión de canales).
                    </p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-2">
                    {searchResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setLocalSecundario(c);
                          setSearchTerm('');
                        }}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-left transition-all group cursor-pointer"
                      >
                        <div className="font-black text-slate-700 uppercase tracking-tight group-hover:text-blue-700">
                          {[c.nombre, c.apellido].filter(Boolean).join(' ')}
                        </div>
                        <div className="flex gap-3 mt-1">
                          {c.telefono && (
                            <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {c.telefono}
                            </div>
                          )}
                          {c.facebookSenderId && (
                            <div className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              FB
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

        <div className="mt-8 flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-6 py-3 text-sm font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleMerge}
            disabled={!localSecundario || isMerging}
            className={`px-8 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${
              localSecundario && !isMerging
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isMerging ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Confirmar Fusión'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
