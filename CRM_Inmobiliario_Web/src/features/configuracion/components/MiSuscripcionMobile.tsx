import { Loader2, Rocket, CheckCircle, Banknote } from 'lucide-react';
import type { MySubscription } from '../hooks/useMySubscription';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';

const getEstadoUI = (status: string) => {
  if (status === 'Active') return 'Activo';
  if (status === 'PastDue') return 'Vencido';
  if (status === 'Expired') return 'Expirado';
  return status;
};

export const MiSuscripcionMobile = ({ suscripcion, isLoading, isError }: { 
  suscripcion?: MySubscription; 
  isLoading: boolean;
  isError: boolean;
}) => {
  const { subscriptionStatus } = useSubscriptionGuard();

  const getStatusColor = (status: string) => {
    if (status === 'Active') return 'text-emerald-600';
    if (status === 'PastDue') return 'text-amber-600';
    if (status === 'Expired') return 'text-red-600';
    return 'text-slate-600';
  };
  if (isLoading) {
    return <div className="p-6 flex justify-center"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div>;
  }

  if (isError) {
    return <div className="p-6 text-center text-red-500 font-medium">Error al cargar la suscripción. Intenta recargar.</div>;
  }

  if (!suscripcion) return null;

  return (
    <div className="bg-white p-4">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Mi Suscripción</h2>
      
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Plan Actual</h3>
          <span className="text-2xl font-black text-slate-900">{suscripcion.planTier}</span>
        </div>
        {suscripcion.planTier === 'Pro' && (
          <Rocket className="h-10 w-10 text-indigo-600" />
        )}
      </div>

      <div className="space-y-3 mb-8">
        <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
          <span className="text-sm text-slate-700">Estado: <strong className={getStatusColor(subscriptionStatus)}>{getEstadoUI(subscriptionStatus)}</strong></span>
        </div>
        {suscripcion.currentPeriodEnd && (
          <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
            <span className="text-sm text-slate-700">Expira: <strong>{new Date(suscripcion.currentPeriodEnd).toLocaleDateString()}</strong></span>
          </div>
        )}
        <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
          <span className="text-sm text-slate-700">Almacenamiento Global: <strong>{suscripcion.planTier === 'Pro' ? '15 GB' : '5 GB'}</strong></span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
          <span className="text-sm text-slate-700">Subida Mensual: <strong>{suscripcion.planTier === 'Pro' ? '3 GB' : '1 GB'}</strong></span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
          <span className="text-sm text-slate-700">Operaciones: <strong>{suscripcion.planTier === 'Pro' ? '6,000/mes' : '2,500/mes'}</strong></span>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-center mb-3">
            <Banknote className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-center font-bold text-slate-800 mb-4">
            {suscripcion.planTier === 'Normal' ? 'Mejorar o Renovar' : 'Instrucciones de Renovación'}
          </h3>
          <div className="bg-white p-3 rounded-lg border border-slate-200 text-sm">
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li><strong>Plan Normal: $5.75</strong> (IVA incl.)</li>
              <li><strong>Plan Pro: $8.63</strong> (IVA incl.)</li>
              <li>Transferencia a <strong>Produbanco</strong></li>
              <li>Cta Ahorros: <strong>20009020096</strong></li>
              <li>A nombre de: <strong>Bryan Quitto</strong></li>
            </ul>
          </div>
          <p className="mt-3 text-[11px] text-center text-slate-500 leading-tight">
            Envía el comprobante en formato PDF al administrador al correo: <strong>soporte@zielluxoracrm.com</strong> (El administrador lo verificará en un plazo de 24 horas).
          </p>
        </div>
      </div>
    </div>
  );
};
