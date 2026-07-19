import React from 'react';
import { Database, AlertTriangle, Loader2, X } from 'lucide-react';
import { BaseConocimientoSection } from './BaseConocimientoSection';
import type { UseConfiguracionIALogicReturn } from '../hooks/useConfiguracionIALogic';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { toast } from 'sonner';

interface ConfiguracionIADesktopProps {
  logic: UseConfiguracionIALogicReturn;
}

export const ConfiguracionIADesktop: React.FC<ConfiguracionIADesktopProps> = ({ logic }) => {
  const { canWrite } = useSubscriptionGuard();

  return (
    <div className="space-y-6">
      <section className="space-y-6 bg-slate-100/50 p-8 rounded-[40px] border border-slate-200/60 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Database size={20} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Vectorización para Propiedades</h2>
        </div>

        <div className="max-w-xl">
          <p className="text-slate-600 font-medium mb-6">
            Sincroniza los embeddings vectoriales de las propiedades para las búsquedas semánticas y recomendaciones. El proceso se ejecutará de forma asíncrona en segundo plano.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                if (!canWrite) {
                  toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
                  return;
                }
                logic.handleVectorize(false);
              }}
              disabled={logic.isVectorizing}
              className={`flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {logic.isVectorizing ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
              Vectorizar Faltantes
            </button>

            <button
              onClick={() => {
                if (!canWrite) {
                  toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
                  return;
                }
                logic.setShowForceModal(true);
              }}
              disabled={logic.isVectorizing}
              className={`flex-1 px-6 py-3 bg-white text-rose-600 border-2 border-rose-100 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-rose-50 hover:border-rose-200 active:scale-95 transition-all disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <AlertTriangle size={18} />
              Forzar Todas
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-6 bg-slate-100/50 p-8 rounded-[40px] border border-slate-200/60 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Database size={20} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Vectorización de Documentos</h2>
        </div>

        <div className="max-w-xl">
          <p className="text-slate-600 font-medium mb-6">
            Sincroniza los embeddings vectoriales de los documentos (Base de Conocimiento Corporativa). El proceso se ejecutará de forma asíncrona en segundo plano.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                if (!canWrite) {
                  toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
                  return;
                }
                logic.handleVectorizeDocs(false);
              }}
              disabled={logic.isVectorizingDocs}
              className={`flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {logic.isVectorizingDocs ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
              Vectorizar Faltantes
            </button>

            <button
              onClick={() => {
                if (!canWrite) {
                  toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
                  return;
                }
                logic.setShowForceDocsModal(true);
              }}
              disabled={logic.isVectorizingDocs}
              className={`flex-1 px-6 py-3 bg-white text-rose-600 border-2 border-rose-100 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-rose-50 hover:border-rose-200 active:scale-95 transition-all disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <AlertTriangle size={18} />
              Forzar Todas
            </button>
          </div>
        </div>
      </section>

      <BaseConocimientoSection />

      {/* Modal Confirmación Force Vectorización */}
      {logic.showForceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh] md:max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
                  <AlertTriangle size={24} />
                </div>
                <button onClick={() => logic.setShowForceModal(false)} className="cursor-pointer text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">¿Forzar Re-Vectorización?</h3>
              <p className="text-slate-600 mb-8 font-medium">
                Esta acción sobrescribirá todos los vectores existentes. 
                Se consumirán tokens de tu proveedor de IA configurado por cada propiedad registrada en el sistema. 
                ¿Estás seguro de que deseas continuar?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => logic.setShowForceModal(false)}
                  className="cursor-pointer flex-1 px-4 py-3 font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => logic.handleVectorize(true)}
                  className="cursor-pointer flex-1 px-4 py-3 font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/20"
                >
                  Sí, Forzar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Force Vectorización Docs */}
      {logic.showForceDocsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh] md:max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
                  <AlertTriangle size={24} />
                </div>
                <button onClick={() => logic.setShowForceDocsModal(false)} className="cursor-pointer text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">¿Forzar Re-Vectorización de Documentos?</h3>
              <p className="text-slate-600 mb-8 font-medium">
                Esta acción sobrescribirá todos los vectores existentes de los documentos. 
                Se consumirán tokens de tu proveedor de IA configurado por cada chunk de documento registrado. 
                ¿Estás seguro de que deseas continuar?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => logic.setShowForceDocsModal(false)}
                  className="cursor-pointer flex-1 px-4 py-3 font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => logic.handleVectorizeDocs(true)}
                  className="cursor-pointer flex-1 px-4 py-3 font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/20"
                >
                  Sí, Forzar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
