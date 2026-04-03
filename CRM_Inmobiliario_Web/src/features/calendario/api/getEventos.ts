import { api as axios } from '../../../lib/axios';
import type { CalendarEvent } from '../types';

export const getEventos = async (inicio: string, fin: string): Promise<CalendarEvent[]> => {
  const response = await axios.get<CalendarEvent[]>('/calendario', {
    params: { inicio, fin }
  });
  return response.data;
};
