import useSWR from 'swr';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

export interface AdminSubscriptionInfo {
  id: string;
  agentId: string;
  agentName: string;
  planTier: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  remainingDays: number;
}

export const useSubscriptionManagement = () => {
  const { data, error, isLoading, mutate } = useSWR<AdminSubscriptionInfo[]>(
    '/admin/subscriptions',
    async (url: string) => {
      const response = await api.get(url);
      const subs: AdminSubscriptionInfo[] = response.data;
      
      // Calculate effective status on the fly based on remaining days
      return subs.map(sub => {
        let effectiveStatus = sub.status;
        if (effectiveStatus === 'Active') {
          if (sub.remainingDays < 0 && sub.remainingDays >= -1) {
            effectiveStatus = 'PastDue';
          } else if (sub.remainingDays < -1) {
            effectiveStatus = 'Expired';
          }
        } else if (effectiveStatus === 'PastDue' && sub.remainingDays < -1) {
          effectiveStatus = 'Expired';
        }
        return { ...sub, status: effectiveStatus };
      });
    },
    {
      shouldRetryOnError: false,
    }
  );

  const activatePlan = async (agentId: string, planTier: string, paymentNotes: string, months: number = 1) => {
    try {
      await api.post('/admin/subscriptions/activate', { agentId, planTier, paymentNotes, months });
      toast.success(`Suscripción a ${planTier} por ${months} mes(es) exitosa`);
      mutate();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message: string };
      toast.error('Error al activar suscripción', {
        description: err.response?.data?.message || err.message,
      });
      throw err;
    }
  };

  const expireSubscription = async (id: string) => {
    try {
      await api.post(`/admin/subscriptions/${id}/expire`);
      toast.success('Suscripción expirada exitosamente');
      mutate();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message: string };
      toast.error('Error al expirar suscripción', {
        description: err.response?.data?.message || err.message,
      });
      throw err;
    }
  };

  return {
    suscripciones: data || [],
    isLoading,
    isError: !!error,
    activatePlan,
    expireSubscription,
    mutate
  };
};
