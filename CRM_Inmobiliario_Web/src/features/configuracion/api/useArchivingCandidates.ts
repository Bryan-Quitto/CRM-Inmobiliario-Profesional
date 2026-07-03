import useSWR from 'swr';
import { api } from '@/lib/axios';

export interface CandidateDto {
  id: string;
  name: string;
  lastActivityUtc: string;
  daysUntilArchive: number;
}

export interface ArchivingCandidatesResponse {
  contactos: CandidateDto[];
  propiedades: CandidateDto[];
}

export type SortByOptions = 'Recientes' | 'ProximosArchivar';

export const useArchivingCandidates = (sortBy: SortByOptions) => {
  const { data, error, isLoading, mutate } = useSWR<ArchivingCandidatesResponse>(
    `/agents/archiving-candidates?sortBy=${sortBy}`,
    (url: string) => api.get(url).then(res => res.data)
  );

  return {
    data,
    isLoading,
    error,
    mutate
  };
};
