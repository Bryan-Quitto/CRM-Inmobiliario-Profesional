import { useState } from 'react';
import { FileText, ShieldCheck, ExternalLink, Loader2 } from 'lucide-react';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { usePerfil } from '@/features/auth/api/perfil';

export const TermsOfServiceModal = () => {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { mutate } = usePerfil();

  const handleAccept = async () => {
    if (!accepted) return;
    setLoading(true);
    try {
      const currentVersion = import.meta.env.VITE_CURRENT_TOS_VERSION || '';
      await api.patch('/configuracion/perfil/terminos', { version: currentVersion });
      await mutate(); // Revalidates and updates profile, triggering unmount from the wrapper
      toast.success('Términos aceptados correctamente.');
    } catch (error) {
      console.error(error);
      toast.error('Ocurrió un error al aceptar los términos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-6 md:p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-100">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Actualización Importante</h2>
          <p className="text-slate-600 mb-6 text-sm leading-relaxed">
            Hemos actualizado nuestros Términos de Servicio y Política de Privacidad. 
            Para continuar utilizando Lúmina, es necesario que leas y aceptes las nuevas condiciones.
          </p>

          <div className="w-full flex flex-col gap-3 mb-8">
            <a 
              href="/terminos" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-center gap-3 text-slate-700 group-hover:text-blue-700">
                <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                <span className="font-medium">Términos de Servicio</span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
            </a>
            <a 
              href="/privacidad" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-center gap-3 text-slate-700 group-hover:text-blue-700">
                <ShieldCheck className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                <span className="font-medium">Política de Privacidad</span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
            </a>
          </div>

          <label className="flex items-start gap-3 w-full text-left cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input 
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 checked:bg-blue-600 checked:border-blue-600 transition-colors cursor-pointer"
              />
              <svg 
                className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-sm text-slate-700 select-none">
              He leído y acepto los nuevos Términos de Servicio y la Política de Privacidad de Lúmina.
            </span>
          </label>
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button
            onClick={handleAccept}
            disabled={!accepted || loading}
            className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer
              ${accepted && !loading
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow active:scale-[0.98]' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Aceptar y Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
};
