/**
 * Utilidades de fecha especializadas para Ecuador (UTC-5).
 */

/** Fecha/hora actual en Ecuador (UTC-5). */
export const ahoraEcuador = (): Date => {
  const utc = new Date();
  // Aplicar offset de -5 horas para Ecuador
  return new Date(utc.getTime() - 5 * 60 * 60 * 1000);
};

/** Formatea un Date a "YYYY-MM-DDTHH:mm" (datetime-local compliant). */
export const toDatetimeLocal = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Crea un nuevo objeto Date a partir de una fecha base, sobrescribiendo horas y minutos. */
export const conHora = (base: Date, horas: number, minutos: number): Date => {
  const d = new Date(base);
  d.setHours(horas, minutos, 0, 0);
  return d;
};
