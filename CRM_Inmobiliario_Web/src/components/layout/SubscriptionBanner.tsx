import { Link } from 'react-router-dom';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { AlertTriangle, Clock, Lock } from 'lucide-react';

export const SubscriptionBanner = () => {
  const { showBanner, bannerType, daysRemaining, planTier, isLoading } = useSubscriptionGuard();

  if (isLoading || !showBanner) return null;

  if (bannerType === 'warning') {
    return (
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 flex items-center justify-between shadow-sm z-50">
        <div className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4" />
          <span>
            Tu suscripción {planTier.toUpperCase()} caduca en <strong>{daysRemaining} días</strong>. Por favor, realiza el pago para evitar interrupciones.
          </span>
        </div>
        <Link to="/configuracion/mi-suscripcion" className="cursor-pointer bg-white text-orange-600 hover:bg-orange-50 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap">Renovar</Link>
      </div>
    );
  }

  if (bannerType === 'grace') {
    return (
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 flex items-center justify-between shadow-sm z-50">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4" />
          <span>
            Tu suscripción {planTier.toUpperCase()} está vencida (periodo de gracia). Realiza el pago para regularizar tu cuenta.
          </span>
        </div>
        <Link to="/configuracion/mi-suscripcion" className="cursor-pointer bg-white text-red-600 hover:bg-red-50 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap">Pagar Ahora</Link>
      </div>
    );
  }

  if (bannerType === 'readonly') {
    return (
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white px-4 py-2 flex items-center justify-between shadow-sm z-50">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Lock className="h-4 w-4" />
          <span>
            Cuenta suspendida. Modo solo lectura activado. No puedes crear ni editar datos.
          </span>
        </div>
        <Link to="/configuracion/mi-suscripcion" className="cursor-pointer bg-white text-red-700 hover:bg-red-50 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap">Reactivar</Link>
      </div>
    );
  }

  return null;
};
