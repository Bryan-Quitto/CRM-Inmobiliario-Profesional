import type { UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import type { CrearPropiedadDTO } from '../api/crearPropiedad';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

export const useVoiceDictation = (
  setValue: UseFormSetValue<CrearPropiedadDTO>,
  getValues: UseFormGetValues<CrearPropiedadDTO>
) => {
  const { isListening, toggleListening } = useSpeechRecognition({
    onResult: (transcript) => {
      const currentDesc = getValues('descripcion') || '';
      const formattedTranscript = transcript.trim().charAt(0).toUpperCase() + transcript.trim().slice(1);
      const newDesc = currentDesc 
        ? `${currentDesc.trim()} ${formattedTranscript}.` 
        : `${formattedTranscript}.`;
      
      setValue('descripcion', newDesc, { shouldDirty: true, shouldValidate: true });
    }
  });

  return { isListening, toggleListening };
};
