import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/axios';
import type { AuditoriaSessionResponse } from '../types/auditoria';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export const useAuditoriaGeneral = () => {
  const [dias, setDias] = useState<number | 'custom'>(7);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [canal, setCanal] = useState<string>('');

  const queryParams = new URLSearchParams();
  if (dias !== 'custom') {
    queryParams.append('dias', dias.toString());
  } else {
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
  }
  if (canal) {
    queryParams.append('canal', canal);
  }

  const { data: sesiones, error, isLoading, mutate } = useSWR<AuditoriaSessionResponse[]>(
    `/ia/auditoria-general?${queryParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 0,
      keepPreviousData: true,
    }
  );

  const handleRetry = () => mutate(undefined, { revalidate: true });

  return {
    sesiones: sesiones || [],
    isLoading,
    error,
    dias,
    setDias,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    canal,
    setCanal,
    handleRetry,
    mutate,
  };
};
