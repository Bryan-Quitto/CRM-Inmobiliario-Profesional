import { useState } from 'react';
import { Plus, Loader2, MessageSquareText } from 'lucide-react';
import { useFaqLogic } from '../../hooks/useFaqLogic';
import { FaqCard } from './FaqCard';
import { FaqFormModal } from './FaqFormModal';
import type { PropertyFaq } from '../../types/faq.types';

interface DetalleFaqManagerProps {
  propiedadId: string;
  canManage: boolean;
  currentAgenteId: string;
}

type ActiveModal =
  | { type: 'crear' }
  | { type: 'editar'; faq: PropertyFaq }
  | { type: 'rechazar'; faqId: string }
  | null;

export const DetalleFaqManager = ({ propiedadId, canManage, currentAgenteId }: DetalleFaqManagerProps) => {
  const { faqs, isLoading, crear, editar, enviarARevision, aprobar, rechazar, desactivar, reactivar, eliminarBorrador } =
    useFaqLogic(propiedadId, canManage);

  const [modal, setModal] = useState<ActiveModal>(null);

  const handleGuardar = async (data: { pregunta?: string; respuesta?: string; notaRechazo?: string }) => {
    if (modal?.type === 'crear') {
      await crear({ pregunta: data.pregunta!, respuesta: data.respuesta! });
    } else if (modal?.type === 'editar') {
      await editar(modal.faq.id, { pregunta: data.pregunta!, respuesta: data.respuesta! });
    } else if (modal?.type === 'rechazar') {
      await rechazar(modal.faqId, { notaRechazo: data.notaRechazo! });
    }
  };

  return (
    <section className="space-y-5">
      {/* Header de sección */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">Preguntas Frecuentes</h3>
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">
            Base de conocimiento · IA
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'crear' })}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva pregunta
        </button>
      </div>

      {/* Estado de carga */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
        </div>
      )}

      {/* Estado vacío */}
      {!isLoading && faqs.length === 0 && (
        <div className="text-center py-14 space-y-3">
          <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
            <MessageSquareText className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-500">No hay preguntas frecuentes aún.</p>
          <p className="text-xs text-slate-400">Sé el primero en contribuir al conocimiento de esta propiedad.</p>
        </div>
      )}

      {/* Lista de FAQs */}
      {!isLoading && faqs.length > 0 && (
        <div className="space-y-3">
          {faqs.map(faq => (
            <FaqCard
              key={faq.id}
              faq={faq}
              currentAgenteId={currentAgenteId}
              canManage={canManage}
              onEditar={f => setModal({ type: 'editar', faq: f })}
              onEnviarRevision={id => enviarARevision(id)}
              onAprobar={id => aprobar(id)}
              onRechazar={id => setModal({ type: 'rechazar', faqId: id })}
              onDesactivar={id => desactivar(id)}
              onReactivar={id => reactivar(id)}
              onEliminar={id => eliminarBorrador(id)}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      <FaqFormModal
        isOpen={modal?.type === 'crear'}
        mode="crear"
        onClose={() => setModal(null)}
        onGuardar={handleGuardar}
      />
      <FaqFormModal
        isOpen={modal?.type === 'editar'}
        mode="editar"
        faqInicial={modal?.type === 'editar' ? modal.faq : undefined}
        onClose={() => setModal(null)}
        onGuardar={handleGuardar}
      />
      <FaqFormModal
        isOpen={modal?.type === 'rechazar'}
        mode="rechazar"
        onClose={() => setModal(null)}
        onGuardar={handleGuardar}
      />
    </section>
  );
};
