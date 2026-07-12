import { useState } from 'react';
import useSWR from 'swr';
import { api } from '../../../lib/axios';
import { crearAgencia, actualizarAgencia, type Agency } from '../api/agencias';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export const agenciaSchema = z.object({
  nombre: z.string().min(1, 'El nombre comercial es obligatorio').max(150, 'Máximo 150 caracteres'),
  telefonoCorporativo: z.string().optional().nullable().or(z.literal('')),
  emailCorporativo: z.string().max(255).optional().nullable().or(z.literal('')),
  direccionFisica: z.string().max(500).optional().nullable().or(z.literal('')),
  sitioWeb: z.string().url('Ingrese una URL válida (ej. https://...)').optional().nullable().or(z.literal('')),
  contextoCorporativoIA: z.string().max(2000, 'Máximo 2000 caracteres').optional().nullable().or(z.literal(''))
});

export type AgenciaFormValues = z.infer<typeof agenciaSchema>;

export const useConfiguracionAgenciasLogic = () => {
  const { data: agencias, isLoading, mutate } = useSWR<Agency[]>('/configuracion/agencias', (url: string) => api.get(url).then(res => res.data));
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<AgenciaFormValues>({
    resolver: zodResolver(agenciaSchema),
    mode: 'onBlur',
    defaultValues: {
      nombre: '',
      telefonoCorporativo: '',
      emailCorporativo: '',
      direccionFisica: '',
      sitioWeb: '',
      contextoCorporativoIA: ''
    }
  });

  const { reset, handleSubmit: hookSubmit } = methods;

  const handleOpenCreate = () => {
    setEditingAgency(null);
    reset({ nombre: '', telefonoCorporativo: '', emailCorporativo: '', direccionFisica: '', sitioWeb: '', contextoCorporativoIA: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (agency: Agency) => {
    setEditingAgency(agency);
    reset({
      nombre: agency.nombre,
      telefonoCorporativo: agency.telefonoCorporativo || '',
      emailCorporativo: agency.emailCorporativo || '',
      direccionFisica: agency.direccionFisica || '',
      sitioWeb: agency.sitioWeb || '',
      contextoCorporativoIA: agency.contextoCorporativoIA || ''
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: AgenciaFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingAgency) {
        await actualizarAgencia(editingAgency.id, data);
        toast.success('Agencia actualizada', { description: `La agencia "${data.nombre}" ha sido modificada.` });
      } else {
        await crearAgencia(data);
        toast.success('Agencia creada', { description: `La agencia "${data.nombre}" ha sido registrada.` });
      }
      setIsModalOpen(false);
      mutate();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: string } };
      const msg = axiosError.response?.data || 'Error al guardar la agencia';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAgencias = agencias?.filter(a => a.nombre.toLowerCase().includes(searchTerm.toLowerCase())) || [];

  return {
    agencias,
    isLoading,
    searchTerm,
    setSearchTerm,
    isModalOpen,
    setIsModalOpen,
    editingAgency,
    isSubmitting,
    methods,
    handleOpenCreate,
    handleOpenEdit,
    onSubmit: hookSubmit(onSubmit),
    filteredAgencias,
  };
};

export type ConfiguracionAgenciasLogic = ReturnType<typeof useConfiguracionAgenciasLogic>;
