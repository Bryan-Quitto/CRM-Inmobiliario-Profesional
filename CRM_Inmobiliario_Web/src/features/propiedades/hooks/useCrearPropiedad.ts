import { useState, useEffect, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { swrDefaultConfig } from '@/lib/swr';

// API & Types
import { crearPropiedad } from '../api/crearPropiedad';
import { actualizarPropiedad } from '../api/actualizarPropiedad';
import { getPropiedadById } from '../api/getPropiedadById';
import type { Propiedad } from '../types';
import type { CrearPropiedadDTO } from '../api/crearPropiedad';

// Hooks & Constants
import { usePropertyDraft } from './usePropertyDraft';
import { useVoiceDictation } from './useVoiceDictation';
import { useRemaxScraper } from './useRemaxScraper';
import { DRAFT_STORAGE_KEY } from '../constants/propertyForm';

interface UseCrearPropiedadProps {
  listData?: Propiedad;
  onSuccess: () => void;
}

export const useCrearPropiedad = ({ listData, onSuccess }: UseCrearPropiedadProps) => {
  const { mutate } = useSWRConfig();
  const isEditing = !!listData;
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // FETCH DE DATOS COMPLETOS (Solo en edición)
  const { data: initialData, isLoading: isLoadingDetails } = useSWR(
    isEditing ? `/propiedades/${listData?.id}` : null,
    () => getPropiedadById(listData!.id),
    swrDefaultConfig
  );

  const getInitialValues = useCallback((dataToMap?: Propiedad): Partial<CrearPropiedadDTO> => {
    const today = new Date();
    // UTC-5 Ecuador
    const todayEcuador = new Date(today.getTime() - (5 * 60 * 60 * 1000));
    const ecuadorDate = todayEcuador.toISOString().split('T')[0];

    if (isEditing && dataToMap) {
      const fecha = dataToMap.fechaIngreso ? dataToMap.fechaIngreso.split('T')[0] : ecuadorDate;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = dataToMap as any;
      
      return {
        ...dataToMap,
        titulo: raw.Titulo || dataToMap.titulo,
        descripcion: raw.Descripcion || dataToMap.descripcion,
        precio: raw.Precio || dataToMap.precio,
        direccion: raw.Direccion || dataToMap.direccion,
        sector: raw.Sector || dataToMap.sector,
        ciudad: raw.Ciudad || dataToMap.ciudad,
        tipoPropiedad: raw.TipoPropiedad || dataToMap.tipoPropiedad,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        operacion: (raw.Operacion || dataToMap.operacion) as any,
        urlRemax: raw.UrlRemax || dataToMap.urlRemax || '',
        googleMapsUrl: raw.GoogleMapsUrl || dataToMap.googleMapsUrl || '',
        
        habitaciones: raw.Habitaciones ?? dataToMap.habitaciones,
        banos: raw.Banos ?? dataToMap.banos,
        areaTotal: raw.AreaTotal ?? dataToMap.areaTotal,
        areaTerreno: raw.AreaTerreno ?? dataToMap.areaTerreno,
        areaConstruccion: raw.AreaConstruccion ?? dataToMap.areaConstruccion,
        estacionamientos: raw.Estacionamientos ?? dataToMap.estacionamientos,
        mediosBanos: raw.MediosBanos ?? dataToMap.mediosBanos,
        aniosAntiguedad: raw.AniosAntiguedad ?? dataToMap.aniosAntiguedad,

        esCaptacionPropia: raw.EsCaptacionPropia ?? dataToMap.esCaptacionPropia,
        captadorId: !(raw.EsCaptacionPropia ?? dataToMap.esCaptacionPropia) 
          ? (raw.AgenteId || dataToMap.agenteId) 
          : undefined,
        porcentajeComision: raw.PorcentajeComision ?? dataToMap.porcentajeComision ?? 5,
        fechaIngreso: fecha
      };
    }

    if (!isEditing) {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { fechaIngreso: ecuadorDate, porcentajeComision: 5, ...parsed };
        } catch (e) { console.error('Error al parsear borrador:', e); }
      }
    }

    return {
      tipoPropiedad: '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      operacion: '' as any,
      urlRemax: '',
      fechaIngreso: ecuadorDate,
      esCaptacionPropia: true,
      porcentajeComision: 5
    };
  }, [isEditing]);

  const methods = useForm<CrearPropiedadDTO>({
    defaultValues: getInitialValues() as CrearPropiedadDTO
  });

  const { handleSubmit, reset, control, formState: { isDirty } } = methods;
  const watchedValues = useWatch({ control });
  const tipoSeleccionado = useWatch({ control, name: 'tipoPropiedad' });

  // Hooks de lógica extraída
  const { handleClearDraft } = usePropertyDraft(isEditing, watchedValues as CrearPropiedadDTO, reset);
  const { isListening, toggleListening } = useVoiceDictation(methods.setValue, methods.getValues);
  const { isScraping, missedFields, handleImportar } = useRemaxScraper(methods.setValue, methods.getValues);

  // EFECTO DE SINCRONIZACIÓN
  useEffect(() => {
    if (initialData && !isDirty) {
      reset(getInitialValues(initialData) as CrearPropiedadDTO);
    }
  }, [initialData, reset, isDirty, getInitialValues]);

  const hasData = watchedValues 
    ? Object.values(watchedValues).some(v => v && v !== '' && v !== 0) 
    : false;

  const onSubmit = (data: CrearPropiedadDTO) => {
    setIsSuccess(true);
    if (!isEditing) localStorage.removeItem(DRAFT_STORAGE_KEY);

    setTimeout(() => onSuccess(), 600);

    const payload = {
      ...data,
      precio: Number(data.precio),
      habitaciones: Number(data.habitaciones || 0),
      banos: Number(data.banos || 0),
      areaTotal: Number(data.areaTotal || 0),
      areaTerreno: data.areaTerreno !== undefined && data.areaTerreno !== null && (data.areaTerreno as unknown as string) !== '' ? Number(data.areaTerreno) : undefined,
      areaConstruccion: data.areaConstruccion !== undefined && data.areaConstruccion !== null && (data.areaConstruccion as unknown as string) !== '' ? Number(data.areaConstruccion) : undefined,
      estacionamientos: data.estacionamientos !== undefined && data.estacionamientos !== null && (data.estacionamientos as unknown as string) !== '' ? Number(data.estacionamientos) : undefined,
      mediosBanos: data.mediosBanos !== undefined && data.mediosBanos !== null && (data.mediosBanos as unknown as string) !== '' ? Number(data.mediosBanos) : undefined,
      aniosAntiguedad: data.aniosAntiguedad !== undefined && data.aniosAntiguedad !== null && (data.aniosAntiguedad as unknown as string) !== '' ? Number(data.aniosAntiguedad) : undefined,
      fechaIngreso: data.fechaIngreso ? `${data.fechaIngreso}T12:00:00-05:00` : undefined,
    };

    const action = isEditing 
      ? actualizarPropiedad(listData!.id, payload)
      : crearPropiedad(payload);

    action.then(() => {
      mutate('/dashboard/kpis');
      mutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      mutate('/propiedades');
    }).catch((err) => {
      console.error('Error al guardar propiedad:', err);
      toast.error(`Error al ${isEditing ? 'actualizar' : 'registrar'} propiedad`);
    });
  };

  return {
    methods,
    isEditing,
    isLoadingDetails,
    isSuccess,
    hasData,
    isConfirmingClear,
    setIsConfirmingClear,
    isListening,
    toggleListening,
    isScraping,
    missedFields,
    handleImportar,
    handleClearDraft,
    onSubmit: handleSubmit(onSubmit),
    tipoSeleccionado,
    initialData
  };
};
