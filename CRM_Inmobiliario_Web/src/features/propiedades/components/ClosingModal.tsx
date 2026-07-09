import React from 'react';
import { X, DollarSign, User, Check, Loader2, Info, Home, ChevronDown } from 'lucide-react';
import { DynamicSearchSelect } from '@/components/DynamicSearchSelect';
import { useClosingModal } from '../hooks/useClosingModal';
import { TruncatedText } from '@/components/ui/TruncatedText';

interface ClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onConfirm ahora recibe el precio, el ID del socio (contacto o propiedad) y el estado final deseado para la propiedad
  onConfirm: (precioCierre: number | null, montoReserva: number | null, partnerId: string, agenteCerradorId: string | undefined, finalStatus: string) => Promise<void>;
  mode: 'property' | 'contacto';
  initialData?: {
    id: string;
    titulo: string;
    precio: number;
    operacion: string;
    propietarioId?: string;
    cerradoConId?: string;
    cerradoConNombre?: string;
    estadoComercial?: string;
  };
  intendedState?: string;
}

export const ClosingModal: React.FC<ClosingModalProps> = (props) => {
  const { isOpen, onClose, mode, initialData } = props;
  const { state, actions } = useClosingModal(props);
  const { 
    precioCierre, 
    montoReserva,
    partnerId, 
    selectedPartnerData, 
    tipoCierre, 
    showTipoCierreDropdown, 
    isSubmitting, 
    isSuccess,
    contactoOptions,
    propiedadOptions,
    isSharedTransaction,
    agenteCerradorId,
    agenteOptions
  } = state;

  const {
    setPrecioCierre,
    setMontoReserva,
    setPartnerId,
    setTipoCierre,
    setShowTipoCierreDropdown,
    handleConfirm,
    onSearchClients,
    onSearchProperties,
    onSearchAgentes,
    handlePropertySelect,
    setIsSharedTransaction,
    setAgenteCerradorId
  } = actions;

  if (!isOpen) return null;

  const isReserva = tipoCierre === 'Reservada' || tipoCierre === 'En Negociación';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer"
        onClick={!isSubmitting && !isSuccess ? onClose : undefined}
      />

      <div className="relative bg-white w-full max-w-lg max-h-[95vh] md:max-h-[90vh] flex flex-col rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`h-2 bg-gradient-to-r ${tipoCierre === 'Alquilada' ? 'from-blue-500 to-indigo-600' : 'from-emerald-500 to-teal-600'}`} />
        
        <button 
          onClick={onClose}
          disabled={isSubmitting || isSuccess}
          className="absolute right-6 top-8 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all z-10 cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="p-8 sm:p-10 overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex items-center gap-4 mb-8 shrink-0">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg ${tipoCierre === 'Alquilada' ? 'bg-blue-50 text-blue-600 shadow-blue-100' : 'bg-emerald-50 text-emerald-600 shadow-emerald-100'}`}>
              <Check className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight contactoing-none mb-2">
                {isReserva ? 'Iniciar Reserva / Negociación' : 'Cierre de Operación'}
              </h3>
              <TruncatedText as="p" className="text-slate-400 text-xs font-bold uppercase tracking-widest truncate max-w-[280px]">
                {mode === 'property' ? selectedPartnerData?.titulo : 'Desde Perfil de Contacto'}
              </TruncatedText>
            </div>
          </div>

          <div className="space-y-6">
            {/* Selector de Socio (Si es modo Contacto, busca Propiedad. Si es modo Property, busca Contacto) */}
            {mode === 'contacto' ? (
              <DynamicSearchSelect
                label="Seleccionar Propiedad del Cierre"
                icon={Home}
                placeholder="Buscar propiedad por título..."
                options={propiedadOptions}
                onSearch={onSearchProperties}
                onChange={handlePropertySelect}
                value={partnerId}
              />
            ) : (
              <DynamicSearchSelect
                label={tipoCierre === 'Alquilada' ? 'Inquilino Final' : 'Cliente Final'}
                icon={User}
                placeholder={`Buscar ${tipoCierre === 'Alquilada' ? 'inquilino' : 'comprador'}...`}
                options={contactoOptions}
                onSearch={onSearchClients}
                onChange={(id) => setPartnerId(id)}
                value={partnerId}
                initialLabel={initialData?.estadoComercial === 'Reservada' ? initialData.cerradoConNombre : undefined}
                disabled={initialData?.estadoComercial === 'Reservada'}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
               {/* Input Precio Cierre */}
               <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                   Precio de Cierre {isReserva && 'Acordado'}
                 </label>
                 <div className="relative group">
                   <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${!isReserva && (tipoCierre === 'Vendida' || tipoCierre === 'Alquilada') ? 'text-slate-300' : 'text-slate-400 group-focus-within:text-emerald-500'}`} />
                   <input
                     type="number"
                     value={precioCierre}
                     onChange={(e) => setPrecioCierre(e.target.value)}
                     disabled={!isReserva && (tipoCierre === 'Vendida' || tipoCierre === 'Alquilada')}
                     placeholder="0.00"
                     className={`w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl text-base font-black text-slate-700 transition-all outline-none ${(!isReserva && (tipoCierre === 'Vendida' || tipoCierre === 'Alquilada')) ? 'cursor-not-allowed opacity-70 bg-slate-100' : ''}`}
                   />
                 </div>
               </div>

               {/* Input Monto Reserva */}
               {isReserva && (
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                     Monto de Reserva
                   </label>
                   <div className="relative group">
                     <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                     <input
                       type="number"
                       value={montoReserva}
                       onChange={(e) => setMontoReserva(e.target.value)}
                       placeholder="0.00"
                       className="w-full pl-10 pr-4 py-3 bg-indigo-50/50 border border-indigo-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl text-base font-black text-indigo-900 transition-all outline-none"
                     />
                   </div>
                 </div>
               )}

              {/* Selector Tipo de Cierre */}
              <div className="space-y-2 relative">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                  Tipo de Cierre
                </label>
                <button
                  onClick={() => setShowTipoCierreDropdown(!showTipoCierreDropdown)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 flex items-center justify-between group hover:border-blue-500 transition-all cursor-pointer"
                >
                  <span className={tipoCierre === 'Alquilada' ? 'text-blue-600' : 'text-emerald-600'}>
                    {tipoCierre}
                  </span>
                  {!isReserva && <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showTipoCierreDropdown ? 'rotate-180' : ''}`} />}
                </button>

                {showTipoCierreDropdown && !isReserva && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                    {['Vendida', 'Alquilada'].map((op) => (
                      <button
                        key={op}
                        onClick={() => {
                          setTipoCierre(op);
                          setShowTipoCierreDropdown(false);
                        }}
                        className={`cursor-pointer w-full px-4 py-2 text-left text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors ${tipoCierre === op ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSharedTransaction}
                  onChange={(e) => setIsSharedTransaction(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 transition-colors"
                />
                <span className="text-sm font-black text-slate-700">
                  ¿Transacción compartida con otro agente?
                </span>
              </label>

              {isSharedTransaction && (
                <div className="pt-2 animate-in slide-in-from-top-2 duration-200">
                  <DynamicSearchSelect
                    label="Agente Cerrador"
                    icon={User}
                    placeholder="Buscar agente..."
                    options={agenteOptions}
                    onSearch={onSearchAgentes}
                    onChange={(id) => setAgenteCerradorId(id)}
                    value={agenteCerradorId}
                  />
                </div>
              )}
            </div>

            <div className={`bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 ${isReserva ? 'bg-indigo-50 border-indigo-100' : ''}`}>
              <Info className={`h-5 w-5 shrink-0 mt-0.5 ${isReserva ? 'text-indigo-500' : 'text-amber-500'}`} />
              <p className={`text-[11px] font-bold contactoing-relaxed ${isReserva ? 'text-indigo-700' : 'text-amber-700'}`}>
                {isReserva 
                  ? <>Al confirmar, la propiedad se marcará como <span className="underline italic">Reservada</span> y el contacto pasará a la etapa <span className="underline italic">En Negociación</span>. Si en el futuro la reserva se cae, el sistema volverá la propiedad a Disponible automáticamente.</>
                  : <>Al confirmar, el inmueble pasará a estado <span className="underline italic">{tipoCierre}</span>, el contacto se moverá a la etapa <span className="underline italic">Cerrado</span> y la galería se depurará (excepto portada).</>
                }
              </p>
            </div>
          </div>

          <div className="mt-10">
            <button
              disabled={isSubmitting || isSuccess || !partnerId}
              onClick={handleConfirm}
              className={`cursor-pointer ${`w-full py-5 rounded-[24px] text-white font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50
                ${isSuccess 
                                                                  ? 'bg-emerald-500 shadow-emerald-200' 
                                                                  : tipoCierre === 'Alquilada'
                                                                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:scale-[1.02] active:scale-[0.98]'
                                                                    : 'bg-slate-900 hover:bg-black shadow-slate-200 hover:scale-[1.02] active:scale-[0.98]'
                                                                }`}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Procesando Cierre...
                </>
              ) : isSuccess ? (
                <>
                  <Check className="h-6 w-6 animate-bounce" />
                  {isReserva ? '¡Reserva Exitosa!' : '¡Cierre Exitoso!'}
                </>
              ) : (
                isReserva ? 'Confirmar Reserva' : `Confirmar ${tipoCierre === 'Alquilada' ? 'Alquiler' : 'Venta'}`
              )}
            </button>
            
            {!isSubmitting && !isSuccess && (
              <button
                onClick={onClose}
                className="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors mt-2 cursor-pointer"
              >
                Cancelar y volver
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

