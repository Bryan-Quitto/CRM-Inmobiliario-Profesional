import { api } from '../../../lib/axios';
import type { DashboardKpis } from '../types';

export const getDashboardKpis = async (): Promise<DashboardKpis> => {
  // Construimos la fecha local conservando el offset (ej. -05:00)
  // ESTABILIZACIÓN: Redondeamos a minutos (eliminamos segundos) para que la caché
  // de salida (Output Cache) del servidor sea efectiva durante ese minuto.
  const date = new Date();
  const tzo = -date.getTimezoneOffset();
  const dif = tzo >= 0 ? '+' : '-';
  const pad = (num: number) => num.toString().padStart(2, '0');
  const offsetString = `${dif}${pad(Math.floor(Math.abs(tzo) / 60))}:${pad(Math.abs(tzo) % 60)}`;
  
  // Formato: YYYY-MM-DDTHH:mm:00±HH:MM (Segundos siempre en 00 para estabilidad)
  const clientDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00${offsetString}`;

  const { data } = await api.get<DashboardKpis>(`/dashboard/kpis?clientDate=${encodeURIComponent(clientDate)}`);
  return data;
};