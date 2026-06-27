import { useState } from 'react';
import useSWR from 'swr';
import { api } from '../../../lib/axios';
import { crearAgencia, actualizarAgencia, type Agency, type AgencyData } from '../api/agencias';
import { toast } from 'sonner';

export const useConfiguracionAgenciasLogic = () => {
  const { data: agencias, isLoading, mutate } = useSWR<Agency[]>('/configuracion/agencias', (url: string) => api.get(url).then(res => res.data));
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<AgencyData>({
    nombre: '',
    telefonoCorporativo: '',
    emailCorporativo: '',
    direccionFisica: '',
    sitioWeb: '',
    contextoCorporativoIA: ''
  });

  const handleOpenCreate = () => {
    setEditingAgency(null);
    setFormData({ nombre: '', telefonoCorporativo: '', emailCorporativo: '', direccionFisica: '', sitioWeb: '', contextoCorporativoIA: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (agency: Agency) => {
    setEditingAgency(agency);
    setFormData({
      nombre: agency.nombre,
      telefonoCorporativo: agency.telefonoCorporativo || '',
      emailCorporativo: agency.emailCorporativo || '',
      direccionFisica: agency.direccionFisica || '',
      sitioWeb: agency.sitioWeb || '',
      contextoCorporativoIA: agency.contextoCorporativoIA || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingAgency) {
        await actualizarAgencia(editingAgency.id, formData);
        toast.success('Agencia actualizada', { description: `La agencia "${formData.nombre}" ha sido modificada.` });
      } else {
        await crearAgencia(formData);
        toast.success('Agencia creada', { description: `La agencia "${formData.nombre}" ha sido registrada.` });
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
    formData,
    setFormData,
    handleOpenCreate,
    handleOpenEdit,
    handleSubmit,
    filteredAgencias,
  };
};

export type ConfiguracionAgenciasLogic = ReturnType<typeof useConfiguracionAgenciasLogic>;
