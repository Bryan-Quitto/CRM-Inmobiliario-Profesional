import { useMySubscription } from '@/features/configuracion/hooks/useMySubscription';

export const useSubscriptionGuard = () => {
  const { suscripcion, isLoading } = useMySubscription();

  let canWrite = true;
  let showBanner = false;
  let bannerType: 'warning' | 'grace' | 'readonly' | null = null;
  let daysRemaining = 0;

  if (suscripcion) {
    const end = new Date(suscripcion.currentPeriodEnd);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let effectiveStatus = suscripcion.status;
    
    // Auto-infer status based on dates if backend hasn't updated it yet
    if (effectiveStatus === 'Active') {
      if (daysRemaining < 0 && daysRemaining >= -1) {
        effectiveStatus = 'PastDue';
      } else if (daysRemaining < -1) {
        effectiveStatus = 'Expired';
      }
    } else if (effectiveStatus === 'PastDue' && daysRemaining < -1) {
      effectiveStatus = 'Expired';
    }

    if (effectiveStatus === 'Active') {
      if (daysRemaining <= 3 && daysRemaining >= 0) {
        showBanner = true;
        bannerType = 'warning';
      }
    } else if (effectiveStatus === 'PastDue') {
      showBanner = true;
      bannerType = 'grace';
    } else if (effectiveStatus === 'Expired') {
      showBanner = true;
      bannerType = 'readonly';
      canWrite = false;
    }
  }

  return {
    canWrite,
    subscriptionStatus: suscripcion ? (
      suscripcion.status === 'Active' && daysRemaining < 0 && daysRemaining >= -1 ? 'PastDue' :
      (suscripcion.status === 'Active' || suscripcion.status === 'PastDue') && daysRemaining < -1 ? 'Expired' : 
      suscripcion.status
    ) : 'Active',
    daysRemaining,
    showBanner,
    bannerType,
    planTier: suscripcion?.planTier || 'Normal',
    isLoading
  };
};
