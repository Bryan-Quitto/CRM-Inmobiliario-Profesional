import { useState, useRef } from 'react';
import { toast } from 'sonner';
import type { UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import type { CrearPropiedadDTO } from '../api/crearPropiedad';

export const useVoiceDictation = (
  setValue: UseFormSetValue<CrearPropiedadDTO>,
  getValues: UseFormGetValues<CrearPropiedadDTO>
) => {
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<null | any>(null);

  const toggleListening = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Tu navegador no soporta el dictado por voz.');
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript;
        
        if (transcript) {
          const currentDesc = getValues('descripcion') || '';
          const formattedTranscript = transcript.trim().charAt(0).toUpperCase() + transcript.trim().slice(1);
          const newDesc = currentDesc 
            ? `${currentDesc.trim()} ${formattedTranscript}.` 
            : `${formattedTranscript}.`;
          
          setValue('descripcion', newDesc, { shouldDirty: true, shouldValidate: true });
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Permiso de micrófono denegado.');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Error starting recognition:', e);
      }
    }
  };

  return { isListening, toggleListening };
};
