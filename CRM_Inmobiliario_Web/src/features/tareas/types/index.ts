export interface Tarea {
  id: string;
  titulo: string;
  descripcion?: string;
  tipoTarea: 'Llamada' | 'Visita' | 'Reunión' | 'Trámite';
  fechaInicio: string;
  estado: 'Pendiente' | 'Completada' | 'Cancelada';
  contactoNombre?: string;
  propiedadTitulo?: string;
  propiedadDireccion?: string;
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
