import { RotateCcw, AlertTriangle, Search, UserCheck, Smartphone } from 'lucide-react';
import { TruncatedText } from '@/components/ui/TruncatedText';

interface ContactosListModalsProps {
  newCycleConfirmation: { id: string; etapa: string; nombre: string } | null;
  setNewCycleConfirmation: (conf: { id: string; etapa: string; nombre: string } | null) => void;
  executeStageChange: (id: string, etapa: string) => void;
  isMigrarModalOpen: boolean;
  setIsMigrarModalOpen: (open: boolean) => void;
  migrarRoles: { esCliente: boolean; esPropietario: boolean };
  setMigrarRoles: (roles: { esCliente: boolean; esPropietario: boolean } | ((prev: { esCliente: boolean; esPropietario: boolean }) => { esCliente: boolean; esPropietario: boolean })) => void;
  executeMigrar: (esCliente: boolean, esPropietario: boolean) => void;
}

export const ContactosListModals = ({
  newCycleConfirmation,
  setNewCycleConfirmation,
  executeStageChange,
  isMigrarModalOpen,
  setIsMigrarModalOpen,
  migrarRoles,
  setMigrarRoles,
  executeMigrar
}: ContactosListModalsProps) => {

  return (
    <>
      {newCycleConfirmation && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <RotateCcw className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight text-center">Nuevo Ciclo Comercial</h3>
              <p className="text-slate-500 font-medium mb-6 leading-relaxed text-center">
                Estás moviendo a <span className="text-slate-900 font-bold">{newCycleConfirmation.nombre}</span> a la etapa <span className="text-blue-600 font-bold uppercase tracking-wider">{newCycleConfirmation.etapa}</span>.
              </p>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 mb-8">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-800 font-bold mb-1">
                    Esto NO es un fin de contrato
                  </p>
                  <p className="text-amber-700/80">
                    Esto colocará al cliente en estado {newCycleConfirmation.etapa} para iniciar una nueva búsqueda, pero <strong>mantendrá intacto</strong> el contrato histórico. 
                    <br/><br/>
                    La propiedad anterior <strong>NO</strong> volverá a estar Disponible. Si lo que deseas es finalizar un arrendamiento o anular una venta para liberar la propiedad, debes hacerlo exclusivamente desde el Catálogo de Propiedades.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setNewCycleConfirmation(null)}
                  className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => executeStageChange(newCycleConfirmation.id, newCycleConfirmation.etapa)}
                  className="flex-1 px-6 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all active:scale-95 cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isMigrarModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Smartphone className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight text-center">Migrar desde Teléfono</h3>
              <p className="text-slate-500 font-medium mb-6 leading-relaxed text-center">
                Selecciona el rol predeterminado que tendrán los contactos que importes de tu libreta de direcciones.
              </p>

              <div className="space-y-3 w-full mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1 rounded-3xl transition-all w-full">
                  <button
                    type="button"
                    onClick={() => setMigrarRoles(prev => ({ ...prev, esCliente: !prev.esCliente }))}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer w-full ${
                      migrarRoles.esCliente 
                        ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10' 
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
                      migrarRoles.esCliente ? 'bg-blue-500' : 'bg-slate-200'
                    }`}>
                      <Search className={`h-4 w-4 shrink-0 ${migrarRoles.esCliente ? 'text-white' : 'text-slate-500'}`} />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <TruncatedText as="p" className={`text-xs font-black uppercase truncate ${migrarRoles.esCliente ? 'text-blue-900' : 'text-slate-500'}`}>Cliente</TruncatedText>
                      <TruncatedText as="p" className={`text-[9px] font-bold uppercase leading-none mt-0.5 truncate ${migrarRoles.esCliente ? 'text-blue-600' : 'text-slate-400'}`}>
                        {migrarRoles.esCliente ? 'Habilitado' : 'Inactivo'}
                      </TruncatedText>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMigrarRoles(prev => ({ ...prev, esPropietario: !prev.esPropietario }))}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer w-full ${
                      migrarRoles.esPropietario 
                        ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10' 
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
                      migrarRoles.esPropietario ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}>
                      <UserCheck className={`h-4 w-4 shrink-0 ${migrarRoles.esPropietario ? 'text-white' : 'text-slate-500'}`} />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <TruncatedText as="p" className={`text-xs font-black uppercase truncate ${migrarRoles.esPropietario ? 'text-emerald-900' : 'text-slate-500'}`}>Propietario</TruncatedText>
                      <TruncatedText as="p" className={`text-[9px] font-bold uppercase leading-none mt-0.5 truncate ${migrarRoles.esPropietario ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {migrarRoles.esPropietario ? 'Habilitado' : 'Inactivo'}
                      </TruncatedText>
                    </div>
                  </button>
                </div>
                {(!migrarRoles.esCliente && !migrarRoles.esPropietario) && (
                  <p className="text-center text-rose-500 font-black text-[10px] uppercase tracking-wider animate-bounce break-words px-2">
                    ⚠️ Debes seleccionar al menos un rol
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsMigrarModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (migrarRoles.esCliente || migrarRoles.esPropietario) {
                      executeMigrar(migrarRoles.esCliente, migrarRoles.esPropietario);
                    }
                  }}
                  disabled={!migrarRoles.esCliente && !migrarRoles.esPropietario}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

