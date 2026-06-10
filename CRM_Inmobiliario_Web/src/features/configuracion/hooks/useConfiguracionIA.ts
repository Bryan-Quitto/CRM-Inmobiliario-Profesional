import useSWR from 'swr';
import { api } from '@/lib/axios';

export interface IASettings {
  aiApiKey: string | null;
  whatsAppPhoneNumberId: string | null;
  dailyTokenLimitPerContact: number;
  dailyTokenLimitPersonal: number;
  hasActiveSubscription: boolean;
  isWhatsAppAiEnabled: boolean;
  autoCreateWhatsAppContacts: boolean;
  isPersonalAiEnabled: boolean;
  tokensUsedToday: number;
  facebookPageId: string | null;
  facebookPageName: string | null;
  isFacebookAiEnabled: boolean;
  autoCreateFacebookContacts: boolean;
}

const getIASettings = async () => {
  const response = await api.get<IASettings>('/configuracion/ia-settings');
  return response.data;
};

export const updateIASettings = async (dailyTokenLimitPerContact: number) => {
  const response = await api.put('/configuracion/ia-settings', { dailyTokenLimitPerContact });
  return response.data;
};

export const useConfiguracionIA = () => {
  const { data, error, isLoading, mutate } = useSWR('/configuracion/ia-settings', getIASettings);

  const resetPersonalTokens = async () => {
    await api.post('/configuracion/ia-settings/reset-tokens');
    await mutate();
  };

  return {
    settings: data,
    isLoading,
    isError: error,
    mutate,
    resetPersonalTokens
  };
};
