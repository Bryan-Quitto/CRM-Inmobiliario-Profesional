export interface Tarea {
  id: string;
  titulo: string;
  descripcion?: string;
  tipoTarea: 'Llamada' | 'Visita' | 'Reunión' | 'Trámite';
  fechaVencimiento: string;
  estado: 'Pendiente' | 'Completada';
  clienteNombre?: string;
  propiedadTitulo?: string;
}

export interface CrearTareaDTO {
  titulo: string;
  descripcion?: string;
  tipoTarea: string;
  fechaVencimiento: string;
  clienteId?: string;
  propiedadId?: string;
}
