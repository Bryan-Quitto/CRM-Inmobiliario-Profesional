import { api } from '../../../lib/axios';
import type { DashboardKpis } from '../types';

export const getDashboardKpis = async (): Promise<DashboardKpis> => {
  const { data } = await api.get<DashboardKpis>('/dashboard/kpis');
  return data;
};
