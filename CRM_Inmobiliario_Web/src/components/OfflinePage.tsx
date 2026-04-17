import React from 'react';
import { WifiOff, RefreshCcw, AlertTriangle, Home } from 'lucide-react';

interface OfflinePageProps {
  type?: 'offline' | 'error';
  error?: Error;
  resetErrorBoundary?: () => void;
}

export const OfflinePage: React.FC<OfflinePageProps> = ({ 
  type = 'offline', 
  error,
  resetErrorBoundary 
}) => {
  const isError = type === 'error';

  const handleRetry = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans antialiased">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Icon Area */}
        <div className="flex justify-center">
          <div className={`h-24 w-24 rounded-3xl flex items-center justify-center shadow-2xl ${
            isError ? 'bg-rose-100 text-rose-600 shadow-rose-200' : 'bg-blue-100 text-blue-600 shadow-blue-200'
          }`}>
            {isError ? (
              <AlertTriangle className="h-12 w-12" />
            ) : (
              <WifiOff className="h-12 w-12" />
            )}
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {isError ? 'Algo no salió bien' : 'Sin conexión a Internet'}
          </h1>
          <p className="text-slate-600 font-medium leading-relaxed">
            {isError 
              ? 'Ha ocurrido un error inesperado en la aplicación. No te preocupes, tus datos están a salvo.'
              : 'Parece que has perdido la conexión. Verifica tu red para continuar gestionando tus prospectos.'}
          </p>
          {isError && error && (
            <div className="mt-4 p-3 bg-slate-100 rounded-xl border border-slate-200 text-left overflow-hidden">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Detalles técnicos</p>
              <p className="text-[11px] font-mono text-slate-500 break-words line-clamp-2 italic">
                {error.message || 'Error desconocido'}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={handleRetry}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all active:scale-95 shadow-lg cursor-pointer ${
              isError 
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
            }`}
          >
            <RefreshCcw className="h-5 w-5" />
            Reintentar ahora
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
          >
            <Home className="h-5 w-5" />
            Volver al Inicio
          </button>
        </div>

        {/* Footer info */}
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-8">
          CRM Inmobiliario Profesional • v1.1.0-Elite
        </p>
      </div>
    </div>
  );
};
