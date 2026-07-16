import { useState, useEffect } from 'react';
import { ShieldAlert, Search, RefreshCw, Lock, Unlock, AlertCircle } from 'lucide-react';
import { getDropdownPropiedades, type DropdownPropiedadResponse } from '@/features/propiedades/api/getDropdownPropiedades';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

export const ConfiguracionLimpieza = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [propiedades, setPropiedades] = useState<DropdownPropiedadResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isBlocking, setIsBlocking] = useState(true); // true = Block, false = Unblock
  const [selectedPropiedad, setSelectedPropiedad] = useState<DropdownPropiedadResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPropiedades = async () => {
      setIsSearching(true);
      try {
        const results = await getDropdownPropiedades(searchTerm);
        setPropiedades(results);
      } catch (error) {
        console.error('Error fetching propiedades:', error);
      } finally {
        setIsSearching(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchPropiedades();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSelectPropiedad = (prop: DropdownPropiedadResponse) => {
    setSelectedPropiedad(prop);
  };

  const handleConfirm = async () => {
    if (!selectedPropiedad) return;
    setIsSaving(true);
    try {
      await api.put(`/propiedades/${selectedPropiedad.id}/toggle-bloqueo-limpieza`, {
        bloquear: isBlocking
      });
      toast.success(`La propiedad ha sido ${isBlocking ? 'bloqueada' : 'desbloqueada'} exitosamente.`);
      setSelectedPropiedad(null);
      setSearchTerm('');
    } catch (error) {
      toast.error('Error al actualizar el estado de limpieza de la propiedad.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-indigo-600" />
          Limpieza y Restricciones
        </h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          Control manual para bloquear o desbloquear la generación de fichas PDF y subida de multimedia en propiedades.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl">
          <div className="flex-1">
            <h3 className="font-bold text-slate-800">Modo de Operación</h3>
            <p className="text-xs text-slate-500">¿Qué acción deseas realizar sobre la propiedad que selecciones?</p>
          </div>
          <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
            <button
              onClick={() => setIsBlocking(true)}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                isBlocking ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Bloquear
            </button>
            <button
              onClick={() => setIsBlocking(false)}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                !isBlocking ? 'bg-green-50 text-green-600' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Desbloquear
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-bold text-slate-700">Buscar Propiedad</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código o título..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-0 text-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isSearching && (
              <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 animate-spin" />
            )}
          </div>

          {searchTerm && (
            <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-sm max-h-60 overflow-y-auto divide-y divide-slate-100">
              {propiedades.length > 0 ? (
                propiedades.map(prop => (
                  <button
                    key={prop.id}
                    onClick={() => handleSelectPropiedad(prop)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-sm flex items-center flex-wrap gap-1">
                        {prop.nombre}
                        {prop.bloqueoOverride !== undefined && (
                          <span className="ml-1">
                            {(() => {
                              const isLocked = prop.bloqueoOverride === true || (prop.bloqueoOverride !== false && prop.bloqueoAutomatico === true);
                              if (!isLocked && prop.bloqueoOverride === false) {
                                return <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 ring-1 ring-inset ring-indigo-600/20"><Unlock size={10} /> Desbloqueado Manual</span>;
                              }
                              if (!isLocked) {
                                return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Activo</span>;
                              }
                              if (prop.bloqueoOverride === true) {
                                return <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-inset ring-red-600/10"><Lock size={10} /> Bloqueo Manual</span>;
                              }
                              return <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-700 ring-1 ring-inset ring-orange-600/20"><Lock size={10} /> Limpieza Automática</span>;
                            })()}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">Ref: {prop.referencia}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">No se encontraron propiedades.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedPropiedad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 text-center ${isBlocking ? 'bg-red-50' : 'bg-green-50'}`}>
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isBlocking ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {isBlocking ? <Lock className="h-6 w-6" /> : <Unlock className="h-6 w-6" />}
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">
                Confirmar {isBlocking ? 'Bloqueo' : 'Desbloqueo'}
              </h3>
              <p className="text-slate-600 text-sm">
                Estás a punto de <strong>{isBlocking ? 'bloquear' : 'desbloquear'}</strong> la generación de PDFs y subida de imágenes para la propiedad:
              </p>
              <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200 shadow-sm text-left">
                <div className="font-bold text-slate-800 text-sm truncate">{selectedPropiedad.nombre}</div>
                <div className="text-xs text-slate-500">Ref: {selectedPropiedad.referencia}</div>
              </div>
              
              {isBlocking && (
                <div className="mt-4 flex gap-2 items-start text-red-700 bg-red-100/50 p-3 rounded-lg text-xs font-medium text-left">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Esta acción sobrescribirá las reglas automáticas y evitará modificaciones multimedia y generación de fichas.</span>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white flex gap-3">
              <button
                onClick={() => setSelectedPropiedad(null)}
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSaving}
                className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                  isBlocking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                } ${isSaving ? 'opacity-80 cursor-wait' : ''}`}
              >
                {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                {isSaving ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
