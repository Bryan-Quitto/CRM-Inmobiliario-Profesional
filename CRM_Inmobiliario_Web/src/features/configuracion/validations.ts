import { z } from 'zod';

export const agentProfileSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres, mínimo 1').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  apellido: z.string().min(1, 'El apellido es requerido').max(100, 'Máximo 100 caracteres, mínimo 1').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras y espacios'),
  email: z.string().min(1, 'El correo electrónico es requerido').email('Formato de correo inválido').max(255),
  telefono: z.string().min(1, 'El teléfono es requerido').max(20, 'Máximo 20 caracteres').regex(/^[0-9+\-\s()]*$/, 'Formato de teléfono inválido'),
  direccionFisica: z.string().max(500, 'Máximo 500 caracteres').optional().nullable().or(z.literal('')),
  promptPersonalIA: z.string().max(2000, 'El prompt personal no puede exceder 2000 caracteres').optional().nullable().or(z.literal(''))
});

export const agencySchema = z.object({
  nombre: z.string().min(1, 'Requerido').max(150),
  telefonoCorporativo: z.string().max(20).regex(/^[0-9+\-\s()]*$/, 'Formato de teléfono inválido').optional().nullable().or(z.literal('')),
  emailCorporativo: z.string().email('Formato inválido').max(255).optional().nullable().or(z.literal('')),
  direccionFisica: z.string().max(500).optional().nullable().or(z.literal('')),
  sitioWeb: z.string().url('Debe ser una URL válida').max(255).optional().nullable().or(z.literal('')),
  contextoCorporativoIA: z.string().max(2000).optional().nullable().or(z.literal(''))
});

export type AgentProfileFormValues = z.infer<typeof agentProfileSchema>;
export type AgencyFormValues = z.infer<typeof agencySchema>;
