export const ETAPAS = [
  { label: 'Nuevo', value: 'Nuevo', color: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100' },
  { label: 'Contactado', value: 'Contactado', color: 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100' },
  { label: 'En Negociación', value: 'En Negociación', color: 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100' },
  { label: 'Cerrado', value: 'Cerrado', color: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' },
  { label: 'Perdido', value: 'Perdido', color: 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100' },
];

export const ETAPAS_PROPIETARIO = [
  { label: 'Activo', value: 'Activo', color: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' },
  { label: 'Cerrado', value: 'Cerrado', color: 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100' },
];

export const TIPO_NOTA_OPCIONES = [
  { label: 'Nota', value: 'Nota' },
  { label: 'Llamada', value: 'Llamada' },
  { label: 'WhatsApp', value: 'WhatsApp' },
  { label: 'Visita', value: 'Visita' },
  { label: 'Correo', value: 'Correo' }
];

export const NIVELES_INTERES = [
  { label: 'Alto 🔥', value: 'Alto', color: 'text-rose-600 bg-rose-50' },
  { label: 'Medio ⚡', value: 'Medio', color: 'text-amber-600 bg-amber-50' },
  { label: 'Bajo ❄️', value: 'Bajo', color: 'text-blue-600 bg-blue-50' },
  { label: 'Descartada ❌', value: 'Descartada', color: 'text-slate-400 bg-slate-50' }
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};
