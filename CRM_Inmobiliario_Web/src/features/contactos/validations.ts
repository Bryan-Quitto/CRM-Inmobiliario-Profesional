import { z } from 'zod';

export const contactSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  apellido: z.string().trim().max(100, 'Máximo 100 caracteres').optional().nullable().or(z.literal('')),
  email: z.string().trim().max(150).optional().nullable().refine(val => !val || /^\S+@\S+\.\S+$/.test(val), 'Formato de email inválido'),
  telefono: z.string().trim().max(20).optional().nullable().refine(val => !val || /^\+?[0-9\s-]+$/.test(val), 'Formato inválido'),
  origen: z.string().max(50).optional().nullable().or(z.literal('')),
  estadoEmbudo: z.string().max(50).optional().nullable().or(z.literal('')),
  esCliente: z.boolean().optional().nullable(),
  estadoPropietario: z.string().max(50).optional().nullable().or(z.literal('')),
  esPropietario: z.boolean().optional().nullable()
});

export type ContactFormValues = z.infer<typeof contactSchema>;
