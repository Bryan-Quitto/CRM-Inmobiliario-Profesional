import type { PropertyFaq, FaqEstado } from '../../types/faq.types';

interface FaqCardProps {
  faq: PropertyFaq;
  currentAgenteId: string;
  canManage: boolean;
  onEditar: (faq: PropertyFaq) => void;
  onEnviarRevision: (faqId: string) => void;
  onAprobar: (faqId: string) => void;
  onRechazar: (faqId: string) => void;
  onDesactivar: (faqId: string) => void;
  onReactivar: (faqId: string) => void;
  onEliminar: (faqId: string) => void;
}

const BADGE_STYLES: Record<FaqEstado, string> = {
  Borrador: 'bg-slate-100 text-slate-600',
  EnRevision: 'bg-amber-100 text-amber-700',
  Aprobada: 'bg-emerald-100 text-emerald-700',
  Rechazada: 'bg-rose-100 text-rose-700',
  Desactivada: 'bg-slate-200 text-slate-500',
};

const BADGE_LABELS: Record<FaqEstado, string> = {
  Borrador: 'Borrador',
  EnRevision: 'En Revisión',
  Aprobada: 'Aprobada',
  Rechazada: 'Rechazada',
  Desactivada: 'Desactivada',
};

const formatFecha = (iso: string) =>
  new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(iso)
  );

export const FaqCard = ({
  faq,
  currentAgenteId,
  canManage,
  onEditar,
  onEnviarRevision,
  onAprobar,
  onRechazar,
  onDesactivar,
  onReactivar,
  onEliminar,
}: FaqCardProps) => {
  const esCreador = faq.creadoPorAgenteId === currentAgenteId;
  const { estado } = faq;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-3">
      {/* Header: estado + fecha */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${BADGE_STYLES[estado]}`}
        >
          {BADGE_LABELS[estado]}
        </span>
        <span className="text-[11px] text-slate-400 font-medium">{formatFecha(faq.fechaActualizacion)}</span>
      </div>

      {/* Pregunta */}
      <p className="text-sm font-bold text-slate-900 leading-snug">{faq.pregunta}</p>

      {/* Respuesta */}
      <p className="text-sm text-slate-600 leading-relaxed">{faq.respuesta}</p>

      {/* Nota de rechazo */}
      {estado === 'Rechazada' && faq.notaRechazo && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">
          <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest mb-1">Motivo del rechazo</p>
          <p className="text-xs text-rose-700 font-medium">{faq.notaRechazo}</p>
        </div>
      )}

      {/* Acciones contextuales */}
      <div className="flex flex-wrap gap-2 pt-1">
        {/* Creador + Borrador */}
        {esCreador && estado === 'Borrador' && (
          <>
            <button
              onClick={() => onEditar(faq)}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
            >
              Editar
            </button>
            <button
              onClick={() => onEnviarRevision(faq.id)}
              className="px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
            >
              Enviar a revisión
            </button>
            <button
              onClick={() => onEliminar(faq.id)}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
            >
              Eliminar
            </button>
          </>
        )}

        {/* Creador + Rechazada */}
        {esCreador && estado === 'Rechazada' && (
          <>
            <button
              onClick={() => onEditar(faq)}
              className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
            >
              Editar
            </button>
            <button
              onClick={() => onEnviarRevision(faq.id)}
              className="px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
            >
              Reenviar
            </button>
          </>
        )}

        {/* Autorizado + En Revisión */}
        {canManage && estado === 'EnRevision' && (
          <>
            <button
              onClick={() => onAprobar(faq.id)}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
            >
              Aprobar
            </button>
            <button
              onClick={() => onRechazar(faq.id)}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
            >
              Rechazar
            </button>
          </>
        )}

        {/* Autorizado + Aprobada */}
        {canManage && estado === 'Aprobada' && (
          <button
            onClick={() => onDesactivar(faq.id)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Desactivar
          </button>
        )}

        {/* Autorizado + Desactivada */}
        {canManage && estado === 'Desactivada' && (
          <button
            onClick={() => onReactivar(faq.id)}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
          >
            Reactivar
          </button>
        )}
      </div>
    </div>
  );
};
