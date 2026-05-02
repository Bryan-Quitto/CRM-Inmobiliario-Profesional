import type { TipoTarea } from './types';
import { TIPO_ALIASES, MESES, DIAS_SEMANA } from './constants';
import { ahoraEcuador } from './dateUtils';

/** Normaliza el texto: minúsculas, sin tildes en vocales (excepto ñ), trim. */
export const normalizar = (texto: string): string =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/([aeiou])\u0301/gi, '$1') // quita tildes solo en vocales
    .normalize('NFC')
    .trim();

/** Extrae el tipo de tarea buscando alias al inicio del texto o en cualquier parte. */
export const extraerTipo = (texto: string): TipoTarea | null => {
  const norm = normalizar(texto);
  // Primero busca al inicio de la oración
  for (const [alias, tipo] of Object.entries(TIPO_ALIASES)) {
    if (norm.startsWith(alias)) return tipo;
  }
  // Luego busca en cualquier posición como palabra completa
  for (const [alias, tipo] of Object.entries(TIPO_ALIASES)) {
    const regex = new RegExp(`\\b${alias}\\b`);
    if (regex.test(norm)) return tipo;
  }
  return null;
};

/** Extrae el nombre del contacto: texto después de "con" hasta la siguiente preposición/keyword. */
export const extraerContacto = (texto: string): string | null => {
  // Busca "con <Nombre Apellido>" — captura 1-3 palabras capitalizadas tras "con"
  const match = texto.match(
    /\bcon\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/u
  );
  return match ? match[1].trim() : null;
};

/** Extrae el lugar: texto después de "en" o "para la propiedad" / "para el". */
export const extraerLugar = (texto: string): string | null => {
  // "para la propiedad X" o "para el X"
  const matchPara = texto.match(/\bpara\s+(?:la\s+propiedad|el|la)\s+(.+?)(?:\s+(?:hoy|ma[nñ]ana|pasado|en\s+\d|el\s+\d|a\s+las|$))/i);
  if (matchPara) return matchPara[1].trim();

  // "en el X" o "en la X" o "en <Lugar>"
  const matchEn = texto.match(/\ben\s+(?:el\s+|la\s+|los\s+|las\s+)?(.+?)(?:\s+(?:hoy|ma[nñ]ana|pasado|en\s+\d|el\s+\d|a\s+las|$))/i);
  if (matchEn) return matchEn[1].trim();

  return null;
};

/** Extrae la hora del texto y la devuelve como { horas, minutos } o null. */
export const extraerHora = (texto: string, advertencias: string[]): { horas: number; minutos: number } | null => {
  const norm = normalizar(texto);

  // "a las X y media" / "a las X:30"
  const matchYMedia = norm.match(/a\s+las?\s+(\d{1,2})\s+y\s+media/);
  if (matchYMedia) {
    const h = parseInt(matchYMedia[1]);
    // Heurística: si h < 8, asumir PM (tarde/noche)
    return { horas: h < 8 ? h + 12 : h, minutos: 30 };
  }

  // "a las X:MM" (24h o 12h ambiguo)
  const matchColon = norm.match(/a\s+las?\s+(\d{1,2}):(\d{2})/);
  if (matchColon) {
    let h = parseInt(matchColon[1]);
    const m = parseInt(matchColon[2]);
    if (h < 8 && h !== 0) h += 12; // Heurística PM para horas < 8
    return { horas: h, minutos: m };
  }

  // "a las Xam" / "a las Xpm"
  const matchAmPm = norm.match(/a\s+las?\s+(\d{1,2})\s*(am|pm)/);
  if (matchAmPm) {
    let h = parseInt(matchAmPm[1]);
    const periodo = matchAmPm[2];
    if (periodo === 'pm' && h !== 12) h += 12;
    if (periodo === 'am' && h === 12) h = 0;
    return { horas: h, minutos: 0 };
  }

  // "a las X de la tarde/noche/mañana"
  const matchPeriodo = norm.match(/a\s+las?\s+(\d{1,2})\s+de\s+la\s+(mana|manana|tarde|noche)/);
  if (matchPeriodo) {
    let h = parseInt(matchPeriodo[1]);
    const periodo = matchPeriodo[2];
    if ((periodo === 'tarde' || periodo === 'noche') && h < 12) h += 12;
    return { horas: h, minutos: 0 };
  }

  // "a las X" sin periodo — heurística: < 7 → PM
  const matchSimple = norm.match(/a\s+las?\s+(\d{1,2})(?!\s*:)(?!\s*\d)/);
  if (matchSimple) {
    let h = parseInt(matchSimple[1]);
    if (h < 7) h += 12;
    return { horas: h, minutos: 0 };
  }

  advertencias.push('hora');
  return null;
};

/** Resuelve la fecha a partir de referencias temporales en el texto. */
export const extraerFecha = (texto: string, advertencias: string[]): Date => {
  const norm = normalizar(texto);
  const ahora = ahoraEcuador();

  // "hoy"
  if (/\bhoy\b/.test(norm)) return ahora;

  // "mañana" / "manana"
  if (/\bma[nñ]ana\b/.test(norm)) {
    const d = new Date(ahora);
    d.setDate(d.getDate() + 1);
    return d;
  }

  // "pasado mañana"
  if (/\bpasado\s+ma[nñ]ana\b/.test(norm)) {
    const d = new Date(ahora);
    d.setDate(d.getDate() + 2);
    return d;
  }

  // "en X días"
  const matchDias = norm.match(/\ben\s+(\d+)\s+d[ií]as?\b/);
  if (matchDias) {
    const d = new Date(ahora);
    d.setDate(d.getDate() + parseInt(matchDias[1]));
    return d;
  }

  // "en X semanas"
  const matchSemanas = norm.match(/\ben\s+(\d+)\s+semanas?\b/);
  if (matchSemanas) {
    const d = new Date(ahora);
    d.setDate(d.getDate() + parseInt(matchSemanas[1]) * 7);
    return d;
  }

  // "el <día> de <mes>" — ej. "el 15 de mayo"
  const matchFechaExacta = norm.match(/\bel\s+(\d{1,2})\s+de\s+([a-záéíóú]+)/);
  if (matchFechaExacta) {
    const dia = parseInt(matchFechaExacta[1]);
    const mesNombre = matchFechaExacta[2];
    const mes = MESES[mesNombre];
    if (mes !== undefined) {
      const d = new Date(ahora);
      d.setMonth(mes);
      d.setDate(dia);
      // Si la fecha ya pasó este año, avanzar al próximo
      if (d < ahora) d.setFullYear(d.getFullYear() + 1);
      return d;
    }
  }

  // "el <día de semana>" — ej. "el lunes", "el martes"
  const matchDiaSemana = norm.match(/\bel\s+(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/);
  if (matchDiaSemana) {
    const diaObjetivo = DIAS_SEMANA[matchDiaSemana[1]];
    if (diaObjetivo !== undefined) {
      const d = new Date(ahora);
      const hoyDia = d.getDay();
      let diff = diaObjetivo - hoyDia;
      if (diff <= 0) diff += 7; // Siempre el próximo
      d.setDate(d.getDate() + diff);
      return d;
    }
  }

  advertencias.push('fecha');
  return ahora; // Fallback: fecha actual
};
