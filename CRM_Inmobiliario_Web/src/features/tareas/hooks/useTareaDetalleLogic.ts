import { useNavigate } from 'react-router-dom';
import { Phone, MapPin, Users, Briefcase, Clock, type LucideIcon } from 'lucide-react';
import type { Tarea } from '../types';

const TIPO_ICONOS: Record<string, LucideIcon> = {
  'Llamada': Phone,
  'Visita': MapPin,
  'Reunión': Users,
  'Trámite': Briefcase
};

const TIPO_COLORES: Record<string, string> = {
  'Llamada': 'text-blue-600 bg-blue-50',
  'Visita': 'text-emerald-600 bg-emerald-50',
  'Reunión': 'text-purple-600 bg-purple-50',
  'Trámite': 'text-amber-600 bg-amber-50'
};

export interface UseTareaDetalleLogicProps {
  tarea: Tarea;
  onEdit: () => void;
  onCancelTask: () => void;
  onCompleteTask: () => void;
  onBack: () => void;
}

export const useTareaDetalleLogic = (props: UseTareaDetalleLogicProps) => {
  const { tarea, onEdit, onCancelTask, onCompleteTask, onBack } = props;
  const navigate = useNavigate();
  
  const Icon = TIPO_ICONOS[tarea.tipoTarea] || Clock;
  const colorClass = TIPO_COLORES[tarea.tipoTarea] || 'text-slate-600 bg-slate-50';
  const isPending = tarea.estado === 'Pendiente';

  const formatFecha = (dateStr: string) => {
    return new Intl.DateTimeFormat('es-EC', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateStr));
  };

  const handleNavigateToClient = () => {
    if (tarea.contactoId) {
      navigate(`/contactos/${tarea.contactoId}`);
    }
  };

  const handleNavigateToProperty = () => {
    if (tarea.propiedadId) {
      navigate(`/propiedades?id=${tarea.propiedadId}`);
    }
  };

  return {
    tarea,
    onEdit,
    onCancelTask,
    onCompleteTask,
    onBack,
    Icon,
    colorClass,
    isPending,
    formatFecha,
    handleNavigateToClient,
    handleNavigateToProperty
  };
};

export type TareaDetalleLogicReturn = ReturnType<typeof useTareaDetalleLogic>;
