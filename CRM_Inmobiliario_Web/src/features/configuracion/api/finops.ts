import useSWR from 'swr';
import { api } from '@/lib/axios';
import type { TokenUsage } from '../types/finops.types';

export const fetchTokenUsage = async (): Promise<TokenUsage[]> => {
  const { data } = await api.get<TokenUsage[]>('/api/finops/token-usage');
  return data || [];
};

export const useTokenUsage = () => {
  return useSWR<TokenUsage[]>('/api/finops/token-usage', fetchTokenUsage);
};
