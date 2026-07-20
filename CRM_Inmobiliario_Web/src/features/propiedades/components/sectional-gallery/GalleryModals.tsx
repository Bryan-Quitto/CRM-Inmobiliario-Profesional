import React from 'react';
import ConfirmModal from '@/components/ConfirmModal';

interface GalleryModalsProps {
  confirmDelete: string | null;
  setConfirmDelete: (val: string | null) => void;
  onDeleteMedia: (id: string | string[]) => Promise<void>;
  confirmDeleteSelection: boolean;
  setConfirmDeleteSelection: (val: boolean) => void;
  selectedMediaIds: Set<string>;
  clearSelection: () => void;
  confirmDeleteSection: boolean;
  setConfirmDeleteSection: (val: boolean) => void;
  handleConfirmAction: (isFullDelete?: boolean) => void;
  sectionId?: string | null;
}

export const GalleryModals: React.FC<GalleryModalsProps> = ({
  confirmDelete,
  setConfirmDelete,
  onDeleteMedia,
  confirmDeleteSelection,
  setConfirmDeleteSelection,
  selectedMediaIds,
  clearSelection,
  confirmDeleteSection,
  setConfirmDeleteSection,
  handleConfirmAction,
  sectionId
}) => {
  return (
    <>
      <ConfirmModal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={() => {
          if (confirmDelete) onDeleteMedia(confirmDelete);
          setConfirmDelete(null);
        }}
        title="¿Eliminar imagen?"
        description="Esta acción es permanente."
      />

      <ConfirmModal 
        isOpen={confirmDeleteSelection} 
        onClose={() => setConfirmDeleteSelection(false)} 
        onConfirm={async () => {
          await onDeleteMedia(Array.from(selectedMediaIds));
          clearSelection();
          setConfirmDeleteSelection(false);
        }}
        title={`¿Eliminar ${selectedMediaIds.size} imágenes?`}
        description="Se borrarán definitivamente del servidor."
      />

      {confirmDeleteSection && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer"
            onClick={() => setConfirmDeleteSection(false)}
          />
          {/* Modal */}
          <div className="relative bg-white w-full max-w-md max-h-[95vh] md:max-h-[90vh] flex flex-col rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <button 
              onClick={() => setConfirmDeleteSection(false)}
              className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all cursor-pointer z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar text-center">
              <div className={`h-20 w-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6 mx-auto`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                {sectionId ? "Opciones de eliminación" : "Opciones de limpieza"}
              </h3>
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                Selecciona cómo deseas proceder con esta acción. La foto de portada no será eliminada, y si pertenece a una sección a eliminar, será movida a la galería general.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleConfirmAction(true)}
                  className={`w-full py-4 text-white font-black rounded-2xl transition-all shadow-xl flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    sectionId 
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' 
                      : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                  }`}
                >
                  <span>{sectionId ? "Eliminar sección completa" : "Limpiar solo la galería general"}</span>
                  <span className="text-[10px] font-medium opacity-80 font-normal">
                    {sectionId ? "Todas las fotos de la sección serán eliminadas (excepto portada)." : "Elimina todas las fotos de la galería general (excepto portada)."}
                  </span>
                </button>
                
                <button
                  onClick={() => handleConfirmAction(false)}
                  className={`w-full py-4 text-white font-black rounded-2xl transition-all shadow-xl flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    sectionId 
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  }`}
                >
                  <span>{sectionId ? "Eliminar sección parcialmente" : "Limpiar toda la galería"}</span>
                  <span className="text-[10px] font-medium opacity-80 font-normal">
                    {sectionId ? "Se eliminará esta sección pero las fotos pasarán a galería general." : "Elimina fotos de general y secciones (excepto portada)."}
                  </span>
                </button>
                
                <button
                  onClick={() => setConfirmDeleteSection(false)}
                  className="w-full py-3 mt-2 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};