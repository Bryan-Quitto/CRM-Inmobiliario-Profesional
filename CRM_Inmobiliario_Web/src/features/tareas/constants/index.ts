import { 
  Phone, 
  MapPin, 
  Users, 
  Briefcase 
} from 'lucide-react';

export const TIPOS_TAREA = [
  { label: 'Llamada', value: 'Llamada', icon: Phone, color: 'text-blue-600 bg-blue-50' },
  { label: 'Visita', value: 'Visita', icon: MapPin, color: 'text-emerald-600 bg-emerald-50' },
  { label: 'Reunión', value: 'Reunión', icon: Users, color: 'text-purple-600 bg-purple-50' },
  { label: 'Trámite', value: 'Trámite', icon: Briefcase, color: 'text-amber-600 bg-amber-50' },
] as const;

export const toLocalISOString = (dateInput: string | Date) => {
  const date = new Date(dateInput);
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  return localISOTime;
};
