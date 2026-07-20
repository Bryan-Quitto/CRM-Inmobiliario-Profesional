import { z } from 'zod';

export const propertySchema = z.object({
  titulo: z.string().min(1, 'El título es requerido').max(150, 'Máximo 150 caracteres'),
  descripcion: z.string().min(20, 'Debe proporcionar una descripción detallada (mín. 20 caracteres)').max(5000, 'Máximo 5000 caracteres'),
  tipoPropiedad: z.string().min(1, 'Seleccione un tipo'),
  operacion: z.string().min(1, 'Seleccione el tipo de operación'),
  precio: z.coerce.number().positive('El precio debe ser mayor a cero').multipleOf(0.01, 'Máximo 2 decimales'),
  direccion: z.string().min(1, 'Requerido').max(255),
  sector: z.string().min(1, 'Requerido').max(100),
  ciudad: z.string().min(1, 'Requerido').max(100),
  googleMapsUrl: z.string().url('Debe ser una URL válida').optional().nullable().or(z.literal('')),
  urlRemax: z.string().url('Debe ser una URL válida').max(1000).optional().nullable().or(z.literal('')),
  habitaciones: z.coerce.number().int().min(0).optional().nullable(),
  banos: z.coerce.number().min(0).multipleOf(0.1, 'Máximo 1 decimal').optional().nullable(),
  areaTotal: z.coerce.number().min(0).multipleOf(0.01, 'Máximo 2 decimales'),
  areaTerreno: z.coerce.number().min(0).multipleOf(0.01, 'Máximo 2 decimales').optional().nullable(),
  areaConstruccion: z.coerce.number().min(0).multipleOf(0.01, 'Máximo 2 decimales').optional().nullable(),
  estacionamientos: z.coerce.number().int().min(0).optional().nullable(),
  mediosBanos: z.coerce.number().int().min(0).optional().nullable(),
  aniosAntiguedad: z.coerce.number().int().min(0).optional().nullable(),
  esCaptacionPropia: z.boolean(),
  porcentajeComision: z.coerce.number().min(0).max(100).multipleOf(0.01, 'Máximo 2 decimales')
});

export type PropertyFormValues = z.infer<typeof propertySchema>;
