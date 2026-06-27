import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/axios';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export interface NotificationSettings {
  notifyOverdueTasksIntervalMinutes: number;
  notifyTodayTasksAdvanceMinutes: number;
  notifyTodayTasksIntervalMinutes: number;
  notifyAiHelpTasksIntervalMinutes: number;
  notifyAiHelpTasksMaxRetries: number;
  notifyOverdueTasksMaxHours: number;
}

export function useConfiguracionNotificacionesLogic(agentId?: string) {
  const { user } = useAuth();
  const targetId = agentId || user?.id;
  const { resyncPushSubscription, subscribeToPush, unsubscribeFromPush, isSubscribed, isSubscribing, isSupported } = usePushNotifications();
  
  const { data, isLoading, mutate } = useSWR<NotificationSettings>(
    targetId ? `/agents/${targetId}/notifications` : null,
    (url: string) => api.get(url).then(res => res.data)
  );

  const [settings, setSettings] = useState<NotificationSettings>({
    notifyOverdueTasksIntervalMinutes: 60,
    notifyTodayTasksAdvanceMinutes: 300,
    notifyTodayTasksIntervalMinutes: 60,
    notifyAiHelpTasksIntervalMinutes: 1,
    notifyAiHelpTasksMaxRetries: 3,
    notifyOverdueTasksMaxHours: 24
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const handleChange = (field: keyof NotificationSettings, value: number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const isInvalidOverdueInterval = settings.notifyOverdueTasksIntervalMinutes < 1 || settings.notifyOverdueTasksIntervalMinutes > 1440;
  const isInvalidOverdueMax = settings.notifyOverdueTasksMaxHours < 1 || settings.notifyOverdueTasksMaxHours > 72;
  const isInvalidTodayAdvance = settings.notifyTodayTasksAdvanceMinutes < 1 || settings.notifyTodayTasksAdvanceMinutes > 4320;
  const isInvalidTodayInterval = settings.notifyTodayTasksIntervalMinutes < 1 || settings.notifyTodayTasksIntervalMinutes > 1440;
  const isInvalidAiInterval = settings.notifyAiHelpTasksIntervalMinutes < 1 || settings.notifyAiHelpTasksIntervalMinutes > 1440;
  const isInvalidAiRetries = settings.notifyAiHelpTasksMaxRetries < 1 || settings.notifyAiHelpTasksMaxRetries > 5;

  const isFormValid = !isInvalidOverdueInterval && !isInvalidOverdueMax && !isInvalidTodayAdvance && !isInvalidTodayInterval && !isInvalidAiInterval && !isInvalidAiRetries;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || !isFormValid) return;
    
    setIsSaving(true);
    try {
      await api.put(`/agents/${targetId}/notifications`, settings);
      await mutate(settings, false);
      toast.success('Configuración de notificaciones guardada');
    } catch (error) {
      if (data) {
        setSettings(data);
      }
      const err = error as { response?: { data?: { error?: string } } };
      const errorMessage = err.response?.data?.error || 'Error al guardar las configuraciones';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    settings,
    isLoading,
    isSaving,
    isFormValid,
    agentId,
    targetId,
    isSupported,
    isSubscribed,
    isSubscribing,
    validation: {
      isInvalidOverdueInterval,
      isInvalidOverdueMax,
      isInvalidTodayAdvance,
      isInvalidTodayInterval,
      isInvalidAiInterval,
      isInvalidAiRetries
    },
    actions: {
      handleChange,
      handleSubmit,
      subscribeToPush,
      resyncPushSubscription,
      unsubscribeFromPush
    }
  };
}

export type ConfiguracionNotificacionesLogicReturn = ReturnType<typeof useConfiguracionNotificacionesLogic>;
