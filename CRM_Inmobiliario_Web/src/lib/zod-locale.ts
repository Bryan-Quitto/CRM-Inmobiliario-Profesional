import * as z from 'zod';

/**
 * Configura Zod con mensajes de error en español y términos amigables para el usuario.
 *
 * POR QUÉ: El locale `es()` nativo de Zod v4 traduce los mensajes por defecto, pero algunos
 * mensajes técnicos (ej. "se recibió NaN") son jerga de programación inapropiada para
 * usuarios finales no técnicos. Esta función intercepta esos casos y los reemplaza con
 * lenguaje natural claro, antes de delegar el resto al locale oficial.
 */
export function configureZodLocale(): void {
  const esLocale = z.locales.es();

  z.config({
    localeError: (issue) => {
      // --- Sobreescrituras amigables para el usuario ---

      if (issue.code === 'invalid_type') {
        const input = (issue as { input?: unknown }).input;
        const received = typeof input === 'number' && Number.isNaN(input) ? 'nan' : typeof input;

        // Campo numérico vacío o con texto no numérico → NaN tras z.coerce.number()
        if (received === 'nan') {
          return 'Ingresa un número válido';
        }

        // Campo requerido que llegó vacío
        if (input === undefined || input === null) {
          return 'Este campo es requerido';
        }

        // Se esperaba un booleano pero llegó otro tipo
        if (issue.expected === 'boolean') {
          return 'Selecciona una opción válida';
        }
      }

      // Número fuera de rango sin mensaje custom definido en el schema
      if (issue.code === 'too_small') {
        if ('minimum' in issue && issue.minimum === 0) return 'El valor no puede ser negativo';
      }

      // Delegar todo lo demás al locale oficial en español
      return esLocale.localeError(issue);
    },
  });
}
