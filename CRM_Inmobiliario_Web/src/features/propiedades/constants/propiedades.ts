export const ESTADOS = [
  { label: 'Disponible', value: 'Disponible', color: 'bg-emerald-500 border-emerald-400 text-white hover:bg-emerald-600' },
  { label: 'Reservada', value: 'Reservada', color: 'bg-amber-500 border-amber-400 text-white hover:bg-amber-600' },
  { label: 'Vendida', value: 'Vendida', color: 'bg-slate-700 border-slate-600 text-white hover:bg-slate-800' },
  { label: 'Alquilada', value: 'Alquilada', color: 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700' },
  { label: 'Inactiva', value: 'Inactiva', color: 'bg-rose-500 border-rose-400 text-white hover:bg-rose-600' },
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
