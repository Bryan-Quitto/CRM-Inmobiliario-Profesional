import { useEffect } from 'react';
import { toast } from 'sonner';
import { Wifi, WifiOff } from 'lucide-react';

export const NetworkStatusListener = () => {
  useEffect(() => {
    const handleOnline = () => {
      toast.success('Conexión restablecida', {
        description: 'Vuelves a estar en línea. Tus cambios se sincronizarán.',
        icon: <Wifi className="h-4 w-4 text-emerald-500" />,
        duration: 4000,
      });
    };

    const handleOffline = () => {
      toast.error('Sin conexión a Internet', {
        description: 'Estás trabajando en modo local. Verifica tu red.',
        icon: <WifiOff className="h-4 w-4 text-rose-500" />,
        duration: Infinity, // Se queda hasta que vuelva la conexión
        id: 'offline-toast'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificación inicial si entra ya desconectado
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return null; // Componente lógico, no renderiza nada
};
