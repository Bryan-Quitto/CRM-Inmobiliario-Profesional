import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { parseComando } from '../utils/parseComando';
import type { ComandoParseado } from '../utils/parseComando';

interface UseComandoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onParsed: (resultado: ComandoParseado) => void;
}

export const useComandoPanel = ({ isOpen, onClose, onParsed }: UseComandoPanelProps) => {
  const [comandoText, setComandoText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isInstruccionesOpen, setIsInstruccionesOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Instancia de SpeechRecognition
  const recognitionRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  const isListeningRef = useRef(false);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setComandoText('');
        setIsListening(false);
        setIsInstruccionesOpen(false);
        textareaRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    } else {
      if (isListeningRef.current && recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isInstruccionesOpen) {
        setIsInstruccionesOpen(false);
      } else if (isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isInstruccionesOpen, onClose]);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (!SpeechRecognition) {
      toast.error('Tu navegador no soporta el dictado por voz.');
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript;

        if (transcript) {
          const formatted = transcript.trim().charAt(0).toUpperCase() + transcript.trim().slice(1);
          setComandoText(prev =>
            prev ? `${prev.trim()} ${formatted}.` : `${formatted}.`
          );
        }
      };

      recognitionRef.current.onerror = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
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

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Error starting recognition:', e);
      }
    }
  };

  const handleProcesar = () => {
    const texto = comandoText.trim();
    if (!texto) {
      toast.error('Escribe o dicta una instrucción primero.');
      return;
    }

    const resultado = parseComando(texto);

    if (resultado.advertencias.length > 0) {
      toast.warning('Algunos campos no se detectaron', {
        description: `Revisa en el formulario: ${resultado.advertencias.join(', ')}.`,
        duration: 4000,
      });
    } else {
      toast.success('¡Instrucción procesada!', {
        description: `"${resultado.titulo}" · ${resultado.fechaInicio.replace('T', ' ')}`,
        duration: 3000,
      });
    }

    onClose();
    setTimeout(() => onParsed(resultado), 150);
  };

  return {
    comandoText,
    setComandoText,
    isListening,
    isInstruccionesOpen,
    setIsInstruccionesOpen,
    textareaRef,
    toggleListening,
    handleProcesar
  };
};
