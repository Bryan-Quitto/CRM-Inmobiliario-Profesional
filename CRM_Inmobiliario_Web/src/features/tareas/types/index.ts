export interface Tarea {
  id: string;
  titulo: string;
  descripcion?: string;
  tipoTarea: 'Llamada' | 'Visita' | 'Reunión' | 'Trámite';
  fechaVencimiento: string;
  estado: 'Pendiente' | 'Completada' | 'Cancelada';
  clienteNombre?: string;
  propiedadTitulo?: string;
  clienteId?: string;
  propiedadId?: string;
}

export interface CrearTareaDTO {
  titulo: string;
  descripcion?: string;
  tipoTarea: string;
  fechaVencimiento: string;
  clienteId?: string;
  propiedadId?: string;
}
