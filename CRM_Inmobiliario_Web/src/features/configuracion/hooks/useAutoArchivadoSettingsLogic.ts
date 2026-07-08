import { useState, useEffect } from 'react';
import { useUpdateAgentArchivingConfig, type ArchivingConfig } from '../api/useUpdateAgentArchivingConfig';
import { useArchivingCandidates, type SortByOptions } from '../api/useArchivingCandidates';
import { toast } from 'sonner';

export const useAutoArchivadoSettingsLogic = () => {
  const { data, isLoading, updateConfig } = useUpdateAgentArchivingConfig();
  const [isSaving, setIsSaving] = useState(false);

  const [candidatesSortBy, setCandidatesSortBy] = useState<SortByOptions>('ProximosArchivar');
  const { data: candidatesData, isLoading: isLoadingCandidates } = useArchivingCandidates(candidatesSortBy);

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
    if (field === 'autoArchivarPropiedades' && value === true) {
      const hasSeen = localStorage.getItem('hasSeenAutoArchivarWarning') === 'true';
      if (!hasSeen) {
        const agreed = window.confirm("Aviso de Limpieza Automática:\n\nAl habilitar el auto-archivado, si una propiedad permanece en estado 'Archivado' por más de 31 días consecutivos, todas sus fotografías y ficha técnica (PDF) serán eliminadas de forma permanente del servidor para ahorrar espacio.\n\n¿Estás seguro de que deseas habilitar esta opción?");
        if (!agreed) return;
        localStorage.setItem('hasSeenAutoArchivarWarning', 'true');
      }
    }
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
    handleSubmit,
    candidatesSortBy,
    setCandidatesSortBy,
    candidatesData,
    isLoadingCandidates
  };
};

export type AutoArchivadoSettingsLogic = ReturnType<typeof useAutoArchivadoSettingsLogic>;
