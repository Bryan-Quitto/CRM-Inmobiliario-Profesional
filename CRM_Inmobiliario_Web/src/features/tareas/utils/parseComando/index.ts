import type { ComandoParseado } from './types';
import { 
  extraerTipo, 
  extraerContacto, 
  extraerLugar, 
  extraerFecha, 
  extraerHora 
} from './extractors';
import { conHora, toDatetimeLocal } from './dateUtils';

/**
 * Orquestador del parser de intención en lenguaje natural para creación de tareas.
 * Procesa una instrucción en texto y extrae metadatos estructurados.
 */
export const parseComando = (instruccion: string): ComandoParseado => {
  const advertencias: string[] = [];

  const tipoTarea = extraerTipo(instruccion);
  if (!tipoTarea) advertencias.push('tipo de tarea');

  const contactoTexto = extraerContacto(instruccion);
  const lugarTexto = extraerLugar(instruccion);

  const fechaBase = extraerFecha(instruccion, advertencias);
  const horaExtraida = extraerHora(instruccion, advertencias);

  // Valores por defecto si no se detectó hora
  const horas = horaExtraida?.horas ?? 10;
  const minutos = horaExtraida?.minutos ?? 0;
  const fechaFinal = conHora(fechaBase, horas, minutos);

  // Generación automática del título: "{tipo} {contacto}" o "{tipo} {lugar}" o solo "{tipo}"
  const tipoLabel = tipoTarea ?? 'Tarea';
  let titulo = tipoLabel;
  
  if (contactoTexto) {
    titulo = `${tipoLabel} ${contactoTexto}`;
  } else if (lugarTexto) {
    // Truncar el lugar si es excesivamente largo (max ~25 chars) para el título
    const lugarCorto = lugarTexto.length > 25 ? lugarTexto.slice(0, 22) + '…' : lugarTexto;
    titulo = `${tipoLabel} ${lugarCorto}`;
  }

  return {
    tipoTarea,
    titulo,
    fechaInicio: toDatetimeLocal(fechaFinal),
    contactoTexto,
    lugarTexto,
    instruccionOriginal: instruccion,
    advertencias,
  };
};

export * from './types';
