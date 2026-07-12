import { z } from 'zod';

export const taskSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido').max(150, 'Máximo 150 caracteres'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional().nullable().or(z.literal('')),
  tipoTarea: z.string().min(1, 'Seleccione el tipo de tarea'),
  fechaInicio: z.string().min(1, 'La fecha es requerida'),
  duracionMinutos: z.coerce.number().int().min(5, 'La duración mínima es 5 minutos').max(1440, 'La duración máxima es 24 horas').optional().nullable(),
  contactoId: z.string().uuid('ID inválido').optional().nullable(),
  propiedadId: z.string().uuid('ID inválido').optional().nullable(),
  lugar: z.string().max(255, 'Máximo 255 caracteres').optional().nullable().or(z.literal('')),
  colorHex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color inválido').optional().nullable().or(z.literal(''))
});

export type TaskFormValues = z.infer<typeof taskSchema>;
