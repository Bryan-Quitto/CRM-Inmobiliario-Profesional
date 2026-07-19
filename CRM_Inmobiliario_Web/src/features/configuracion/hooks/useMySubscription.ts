import useSWR from 'swr';
import { api } from '@/lib/axios';

export interface MySubscription {
  id: string;
  agentId: string;
  planTier: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export const useMySubscription = () => {
  const { data, error, isLoading, mutate } = useSWR<MySubscription>(
    '/subscriptions/me',
    async (url: string) => {
      const response = await api.get(url);
      const sub: MySubscription = response.data;
      if (!sub) return sub;

      const end = new Date(sub.currentPeriodEnd);
      const now = new Date();
      const diffTime = end.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let effectiveStatus = sub.status;
      if (effectiveStatus === 'Active') {
        if (daysRemaining < 0 && daysRemaining >= -3) {
          effectiveStatus = 'PastDue';
        } else if (daysRemaining < -3) {
          effectiveStatus = 'Expired';
        }
      } else if (effectiveStatus === 'PastDue' && daysRemaining < -3) {
        effectiveStatus = 'Expired';
      }

      return { ...sub, status: effectiveStatus };
    },
    {
      shouldRetryOnError: false,
    }
  );

  return {
    suscripcion: data,
    isLoading,
    isError: !!error,
    mutate
  };
};
