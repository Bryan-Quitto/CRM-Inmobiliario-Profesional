import { useState, useEffect } from 'react';
import { useUpdateArchivingConfig, type ArchivingConfig } from '../api/useUpdateArchivingConfig';
import { toast } from 'sonner';

export const useAutoArchivadoSettingsLogic = () => {
  const { data, isLoading, updateConfig } = useUpdateArchivingConfig();
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<ArchivingConfig>({
    autoArchivarContactos: false,
    diasInactividadContactos: 100,
    autoArchivarPropiedades: false,
    diasInactividadPropiedades: 100
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const handleChange = (field: keyof ArchivingConfig, value: number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const isInvalidContactos = settings.diasInactividadContactos < 100 || settings.diasInactividadContactos > 1095;
  const isInvalidPropiedades = settings.diasInactividadPropiedades < 100 || settings.diasInactividadPropiedades > 1095;
  const isFormValid = !isInvalidContactos && !isInvalidPropiedades;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setIsSaving(true);
    try {
      await updateConfig(settings);
      toast.success('Configuración de auto-archivado guardada');
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      const errorMessage = err.response?.data?.error || 'Error al guardar configuración (400 Bad Request)';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    settings,
    isLoading,
    isSaving,
    isInvalidContactos,
    isInvalidPropiedades,
    isFormValid,
    handleChange,
    handleSubmit
  };
};

export type AutoArchivadoSettingsLogic = ReturnType<typeof useAutoArchivadoSettingsLogic>;
