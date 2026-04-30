export const NIVELES_INTERES = [
  { label: 'Alto 🔥', value: 'Alto', color: 'text-rose-600 bg-rose-50' },
  { label: 'Medio ⚡', value: 'Medio', color: 'text-amber-600 bg-amber-50' },
  { label: 'Bajo ❄️', value: 'Bajo', color: 'text-blue-600 bg-blue-50' },
  { label: 'Descartada ❌', value: 'Descartada', color: 'text-slate-400 bg-slate-50' }
];

export const dateFormatter = new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short' });
export const fullDateFormatter = new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
export const timeFormatter = new Intl.DateTimeFormat('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });
export const currencyFormatter = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });

// Nota: formatWhatsAppText se movió a un componente de utilidad o se queda en el componente de chat
// pero los formateadores son constantes globales.
