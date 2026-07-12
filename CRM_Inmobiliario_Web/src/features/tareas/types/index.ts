export interface Tarea {
  id: string;
  titulo: string;
  descripcion?: string;
  tipoTarea: 'Llamada' | 'Visita' | 'Reunión' | 'Trámite';
  fechaInicio: string;
  fechaCreacion: string;
  estado: 'Pendiente' | 'Completada' | 'Cancelada';
  esVencida: boolean;
  contactoNombre?: string;
  propiedadTitulo?: string;
  propiedadDireccion?: string;
  propiedadImagenPortadaUrl?: string;
  duracionMinutos: number;
  colorHex?: string;
  contactoId?: string;
  propiedadId?: string;
  lugar?: string;
}

export interface CrearTareaDTO {
  titulo: string;
  descripcion?: string;
  tipoTarea: string;
  fechaInicio: string;
  contactoId?: string;
  propiedadId?: string;
  lugar?: string;
  duracionMinutos?: number | null;
  colorHex?: string | null;
}

export interface ActualizarTareaDTO {
  titulo: string;
  descripcion?: string;
  tipoTarea: string;
  fechaInicio: string;
  duracionMinutos: number;
  colorHex?: string;
  contactoId?: string;
  propiedadId?: string;
  lugar?: string;
}
