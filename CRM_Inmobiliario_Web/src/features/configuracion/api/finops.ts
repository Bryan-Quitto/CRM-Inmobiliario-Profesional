import useSWR from 'swr';
import { api } from '@/lib/axios';
import type { TokenUsage } from '../types/finops.types';

export const fetchTokenUsage = async (channel: string = 'Copilot'): Promise<TokenUsage[]> => {
  const { data } = await api.get<TokenUsage[]>(`/api/finops/token-usage?channel=${channel}`);
  return data || [];
};

export const useTokenUsage = (channel: string = 'Copilot') => {
  return useSWR<TokenUsage[]>([`/api/finops/token-usage`, channel], () => fetchTokenUsage(channel));
};
