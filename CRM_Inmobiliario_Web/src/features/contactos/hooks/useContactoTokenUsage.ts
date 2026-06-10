import useSWR from 'swr';
import { api } from '@/lib/axios';

interface TokenUsageResponse {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  costoUSD: number;
}

export const useContactoTokenUsage = (contactoId: string, rango: 'hoy' | 'semana' | 'mes' | 'siempre', channel: 'todas' | 'WhatsApp' | 'Facebook' = 'todas') => {
  const fetcher = async (url: string) => {
    const { data } = await api.get<TokenUsageResponse>(url);
    return data;
  };

  const { data, error, isLoading } = useSWR(
    `/contactos/${contactoId}/token-usage?rango=${rango}&channel=${channel.toLowerCase()}`,
    fetcher
  );

  return {
    usage: data,
    isLoading,
    isError: error
  };
};
