import { Loader2, Rocket, CheckCircle, Banknote } from 'lucide-react';
import type { MySubscription } from '../hooks/useMySubscription';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';

const getEstadoUI = (status: string) => {
  if (status === 'Active') return 'Activo';
  if (status === 'PastDue') return 'Vencido';
  if (status === 'Expired') return 'Expirado';
  return status;
};

export const MiSuscripcionDesktop = ({ suscripcion, isLoading, isError }: { 
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
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-red-500 font-medium">Error al cargar la suscripción. Intenta recargar.</div>;
  }

  if (!suscripcion) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Mi Suscripción</h2>
      
      <div className="grid grid-cols-2 gap-8">
        <div>
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Plan Actual</h3>
            <div className="flex items-center gap-3">
              {suscripcion.planTier === 'Pro' && (
                <Rocket className="h-8 w-8 text-indigo-600" />
              )}
              <span className="text-3xl font-black text-slate-900">{suscripcion.planTier}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-slate-700">Estado: <strong className={getStatusColor(subscriptionStatus)}>{getEstadoUI(subscriptionStatus)}</strong></span>
            </div>
            {suscripcion.currentPeriodEnd && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span className="text-slate-700">Expira: <strong>{new Date(suscripcion.currentPeriodEnd).toLocaleDateString()}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-slate-700">Almacenamiento Global: <strong>{suscripcion.planTier === 'Pro' ? '15 GB' : '5 GB'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-slate-700">Subida Mensual: <strong>{suscripcion.planTier === 'Pro' ? '3 GB/mes' : '1 GB/mes'}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-slate-700">Ops de Subida: <strong>{suscripcion.planTier === 'Pro' ? '6,000/mes' : '2,500/mes'}</strong></span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col justify-center items-center text-center">
          {suscripcion.planTier === 'Normal' ? (
            <>
              <Banknote className="h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Renovar o Mejorar a PRO</h3>
              <div className="text-slate-600 mb-4 text-sm text-left bg-white p-4 rounded-lg border border-slate-200">
                <p className="font-bold mb-2 text-slate-800 text-center">Instrucciones de Pago</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Normal ($5.75) / Pro ($8.63)</strong> (IVA incl.)</li>
                  <li>Transferencia a <strong>Produbanco</strong></li>
                  <li>Cuenta Ahorros: <strong>20009020096</strong></li>
                  <li>A nombre de: <strong>Bryan Quitto</strong></li>
                </ul>
                <p className="mt-3 text-[11px] text-center text-slate-500">Envía el comprobante en formato PDF al administrador al correo: <strong>soporte@zielluxoracrm.com</strong> (El administrador lo verificará en un plazo de 24 horas).</p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Eres un usuario PRO</h3>
              <p className="text-slate-600 mb-6 text-sm">Disfrutas de todas las ventajas exclusivas.</p>
              
              <div className="text-slate-600 mb-4 text-sm text-left bg-white p-4 rounded-lg border border-slate-200 w-full mt-4">
                <p className="font-bold mb-2 text-slate-800 text-center">Instrucciones de Renovación</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Plan Pro ($8.63)</strong> (IVA incl.)</li>
                  <li>Transferencia a <strong>Produbanco</strong></li>
                  <li>Cuenta Ahorros: <strong>20009020096</strong></li>
                </ul>
                <p className="mt-3 text-[11px] text-center text-slate-500">Envía el comprobante en formato PDF al administrador al correo: <strong>soporte@zielluxoracrm.com</strong> (El administrador lo verificará en un plazo de 24 horas).</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
