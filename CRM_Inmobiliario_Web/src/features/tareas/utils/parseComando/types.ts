export type TipoTarea = 'Llamada' | 'Visita' | 'Reunión' | 'Trámite';

export interface ComandoParseado {
  /** Tipo de la tarea detectado; null si no se pudo determinar */
  tipoTarea: TipoTarea | null;
  /** Título generado automáticamente: "{tipo} {contacto}" o "{tipo} {lugar}" */
  titulo: string;
  /** Fecha y hora resultante en formato "YYYY-MM-DDTHH:mm" (datetime-local) */
  fechaInicio: string;
  /** Nombre del contacto extraído del texto ("con X") */
  contactoTexto: string | null;
  /** Lugar o nombre de propiedad extraído ("en X" / "para X") */
  lugarTexto: string | null;
  /** Texto de la instrucción original (para el campo descripción) */
  instruccionOriginal: string;
  /** Advertencias no bloqueantes (campos que no se pudieron determinar) */
  advertencias: string[];
}
