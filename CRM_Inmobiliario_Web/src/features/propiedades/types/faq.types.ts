export type FaqEstado = 'Borrador' | 'EnRevision' | 'Aprobada' | 'Rechazada' | 'Desactivada';

export interface PropertyFaq {
  id: string;
  propiedadId: string;
  pregunta: string;
  respuesta: string;
  estado: FaqEstado;
  creadoPorAgenteId: string;
  nombreCreador?: string;
  notaRechazo?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CreateFaqDto {
  pregunta: string;
  respuesta: string;
}

export interface EditarFaqDto {
  pregunta: string;
  respuesta: string;
}

export interface RechazarFaqDto {
  notaRechazo: string;
}
