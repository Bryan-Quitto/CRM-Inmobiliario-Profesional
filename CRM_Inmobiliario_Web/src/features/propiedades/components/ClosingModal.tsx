import React, { useState, useMemo } from 'react';
import { X, DollarSign, User, Check, Loader2, Info } from 'lucide-react';
import { DynamicSearchSelect } from '@/components/DynamicSearchSelect';
import { buscarClientes } from '../../clientes/api/buscarClientes';
import { useTareas } from '../../tareas/context/useTareas';
import { toast } from 'sonner';

interface ClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (precioCierre: number, cerradoConId: string) => Promise<void>;
  tituloPropiedad: string;
  precioSugerido: number;
  tipoOperacion: string; // 'Venta' | 'Alquiler'
}

export const ClosingModal: React.FC<ClosingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tituloPropiedad,
  precioSugerido,
  tipoOperacion
}) => {
  const { clientes } = useTareas();
  const [precioCierre, setPrecioCierre] = useState<string>(precioSugerido.toString());
  const [clienteId, setClienteId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const clienteOptions = useMemo(() => 
    clientes.map(c => ({ id: c.id, title: `${c.nombre} ${c.apellido}`, subtitle: c.telefono })),
    [clientes]
  );

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!precioCierre || isNaN(Number(precioCierre))) {
      toast.error('Por favor, ingresa un precio válido.');
      return;
    }
    if (!clienteId) {
      toast.error(`Por favor, selecciona al ${tipoOperacion === 'Alquiler' ? 'inquilino' : 'comprador'}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(Number(precioCierre), clienteId);
      setIsSuccess(true);
      // Wait a bit to show success state (Satisfy Transitions)
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error) {
      console.error('Error al cerrar propiedad:', error);
      toast.error('Hubo un error al procesar el cierre.');
      setIsSubmitting(false);
    }
  };

  const onSearchClients = async (query: string) => {
    const results = await buscarClientes(query);
    return results.map(c => ({
      id: c.id,
      title: c.nombreCompleto,
      subtitle: c.telefono
    }));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Overlay con blur */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer"
        onClick={!isSubmitting && !isSuccess ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header Decorativo */}
        <div className={`h-2 bg-gradient-to-r ${tipoOperacion === 'Alquiler' ? 'from-blue-500 to-indigo-600' : 'from-emerald-500 to-teal-600'}`} />
        
        <button 
          onClick={onClose}
          disabled={isSubmitting || isSuccess}
          className="absolute right-6 top-8 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all z-10 cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="p-8 sm:p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg ${tipoOperacion === 'Alquiler' ? 'bg-blue-50 text-blue-600 shadow-blue-100' : 'bg-emerald-50 text-emerald-600 shadow-emerald-100'}`}>
              <Check className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">
                Cierre de {tipoOperacion === 'Alquiler' ? 'Alquiler' : 'Venta'}
              </h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest truncate max-w-[280px]">
                {tituloPropiedad}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Input Precio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                Precio Real de Cierre
              </label>
              <div className="relative group">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="number"
                  value={precioCierre}
                  onChange={(e) => setPrecioCierre(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl text-lg font-black text-slate-700 transition-all outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium italic pl-1 flex items-center gap-1">
                <Info size={10} /> Precio de lista sugerido: {new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(precioSugerido)}
              </p>
            </div>

            {/* Selector de Cliente */}
            <DynamicSearchSelect
              label={tipoOperacion === 'Alquiler' ? 'Inquilino Final' : 'Comprador Final'}
              icon={User}
              placeholder={`Buscar ${tipoOperacion === 'Alquiler' ? 'inquilino' : 'comprador'}...`}
              options={clienteOptions}
              onSearch={onSearchClients}
              onChange={(id) => setClienteId(id)}
              value={clienteId}
            />

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 mt-4">
              <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
                Al confirmar, el inmueble pasará a estado <span className="underline italic">{tipoOperacion === 'Alquiler' ? 'Alquilada' : 'Vendida'}</span>, el cliente seleccionado se moverá a la etapa <span className="underline italic">Cerrado</span> y todas las imágenes de la galería serán eliminadas permanentemente para optimizar el almacenamiento, excepto la foto de portada.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <button
              disabled={isSubmitting || isSuccess}
              onClick={handleConfirm}
              className={`cursor-pointer ${`w-full py-5 rounded-[24px] text-white font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50
                ${isSuccess 
                                                                  ? 'bg-emerald-500 shadow-emerald-200' 
                                                                  : tipoOperacion === 'Alquiler'
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
                  ¡Cierre Exitoso!
                </>
              ) : (
                `Confirmar ${tipoOperacion === 'Alquiler' ? 'Alquiler' : 'Venta'}`
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
