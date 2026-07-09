import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { PropertyFaq } from '../../types/faq.types';

type ModalMode = 'crear' | 'editar' | 'rechazar';

interface FaqFormModalProps {
  isOpen: boolean;
  mode: ModalMode;
  faqInicial?: PropertyFaq;
  onClose: () => void;
  onGuardar: (data: { pregunta?: string; respuesta?: string; notaRechazo?: string }) => Promise<void>;
}

export const FaqFormModal = ({ isOpen, mode, faqInicial, onClose, onGuardar }: FaqFormModalProps) => {
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [notaRechazo, setNotaRechazo] = useState('');
  const [errors, setErrors] = useState<{ pregunta?: string; respuesta?: string; notaRechazo?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPregunta(faqInicial?.pregunta ?? '');
      setRespuesta(faqInicial?.respuesta ?? '');
      setNotaRechazo('');
      setErrors({});
    }
  }, [isOpen, faqInicial]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (mode === 'rechazar') {
      if (!notaRechazo.trim()) next.notaRechazo = 'El motivo de rechazo es obligatorio.';
    } else {
      if (!pregunta.trim()) next.pregunta = 'La pregunta es obligatoria.';
      if (!respuesta.trim()) next.respuesta = 'La respuesta es obligatoria.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      if (mode === 'rechazar') {
        await onGuardar({ notaRechazo });
      } else {
        await onGuardar({ pregunta, respuesta });
      }
      onClose();
    } catch {
      // error handled by hook
    } finally {
      setIsSaving(false);
    }
  };

  const TITLES: Record<ModalMode, string> = {
    crear: 'Nueva pregunta frecuente',
    editar: 'Editar pregunta frecuente',
    rechazar: 'Rechazar FAQ',
  };

  const SUBMIT_LABELS: Record<ModalMode, string> = {
    crear: 'Guardar',
    editar: 'Guardar cambios',
    rechazar: 'Rechazar',
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[400] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 max-h-[95vh] md:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-4 border-b border-slate-100">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">{TITLES[mode]}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {mode === 'rechazar' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                Motivo de rechazo
              </label>
              <textarea
                value={notaRechazo}
                onChange={e => setNotaRechazo(e.target.value)}
                rows={4}
                placeholder="Explica al agente por qué se rechaza esta FAQ..."
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-700 outline-none transition-all resize-none focus:ring-2 focus:ring-rose-100 focus:border-rose-400 ${
                  errors.notaRechazo ? 'border-rose-300' : 'border-slate-200'
                }`}
              />
              {errors.notaRechazo && (
                <p className="text-xs text-rose-500 font-medium">{errors.notaRechazo}</p>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                  Pregunta
                </label>
                <textarea
                  value={pregunta}
                  onChange={e => setPregunta(e.target.value)}
                  rows={2}
                  placeholder="¿Cuál es la pregunta frecuente?"
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-700 outline-none transition-all resize-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 ${
                    errors.pregunta ? 'border-rose-300' : 'border-slate-200'
                  }`}
                />
                {errors.pregunta && (
                  <p className="text-xs text-rose-500 font-medium">{errors.pregunta}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest">
                  Respuesta
                </label>
                <textarea
                  value={respuesta}
                  onChange={e => setRespuesta(e.target.value)}
                  rows={5}
                  placeholder="Escribe la respuesta detallada..."
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-700 outline-none transition-all resize-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 ${
                    errors.respuesta ? 'border-rose-300' : 'border-slate-200'
                  }`}
                />
                {errors.respuesta && (
                  <p className="text-xs text-rose-500 font-medium">{errors.respuesta}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-7 pb-7">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all active:scale-95 cursor-pointer text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className={`flex-1 px-5 py-3 font-bold rounded-xl transition-all active:scale-95 cursor-pointer text-sm text-white disabled:opacity-60 disabled:cursor-not-allowed ${
              mode === 'rechazar'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/20'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
            }`}
          >
            {isSaving ? 'Guardando...' : SUBMIT_LABELS[mode]}
          </button>
        </div>
      </div>
    </div>
  );
};
