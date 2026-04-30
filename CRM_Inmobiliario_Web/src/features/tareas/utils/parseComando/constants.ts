import type { TipoTarea } from './types';

export const TIPO_ALIASES: Record<string, TipoTarea> = {
  // Visita
  'visita': 'Visita', 'visitar': 'Visita', 'ver': 'Visita', 'mostrar': 'Visita',
  // Llamada
  'llamada': 'Llamada', 'llamar': 'Llamada', 'call': 'Llamada', 'telefono': 'Llamada', 'teléfono': 'Llamada',
  // Reunión
  'reunion': 'Reunión', 'reunión': 'Reunión', 'junta': 'Reunión', 'meeting': 'Reunión', 'reunir': 'Reunión',
  // Trámite
  'tramite': 'Trámite', 'trámite': 'Trámite', 'gestion': 'Trámite', 'gestión': 'Trámite', 'proceso': 'Trámite',
};

export const MESES: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

export const DIAS_SEMANA: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miércoles: 3, miercoles: 3,
  jueves: 4, viernes: 5, sábado: 6, sabado: 6,
};
