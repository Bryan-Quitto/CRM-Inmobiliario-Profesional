import { Plus, X, Check, Loader2 } from 'lucide-react';
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import { SectionalGallery } from '../SectionalGallery';
import type { Propiedad, SeccionGaleria } from '../../types';

interface DetalleGalleryManagerProps {
  id: string;
  propiedad: Propiedad;
  isCreatingInline: boolean;
  isAddingSection: boolean;
  newSectionName: string;
  setNewSectionName: (name: string) => void;
  setIsCreatingInline: (open: boolean) => void;
  handleAddSection: () => void;
  handleConfirmAddSection: () => void;
  handleSetCover: (imagenId: string) => Promise<void>;
  handleDeleteMedia: (ids: string | string[]) => Promise<void>;
  handleClearGallery: () => Promise<void>;
  handleDeleteSection: (sectionId: string) => Promise<void>;
  handleRenameSection: (id: string, nombre: string, desc: string | null, orden: number) => Promise<void>;
  handleMoveSection: (index: number, direction: 'up' | 'down', customTargetIndex?: number) => void;
  handleDragEnd: (result: DropResult) => void;
  mutate: () => void;
}

export const DetalleGalleryManager = ({
  id,
  propiedad,
  isCreatingInline,
  isAddingSection,
  newSectionName,
  setNewSectionName,
  setIsCreatingInline,
  handleAddSection,
  handleConfirmAddSection,
  handleSetCover,
  handleDeleteMedia,
  handleClearGallery,
  handleDeleteSection,
  handleRenameSection,
  handleMoveSection,
  handleDragEnd,
  mutate
}: DetalleGalleryManagerProps) => {
  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-indigo-600 rounded-full"></div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Galerías del Inmueble</h3>
        </div>
        {propiedad.permissions?.canManageGallery && (
          <button
            onClick={handleAddSection}
            disabled={isCreatingInline}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Plus size={16} />
            Nueva Sección
          </button>
        )}
      </div>

      {/* Galería General */}
      <SectionalGallery
        propiedadId={id}
        propiedadTitulo={propiedad.titulo}
        index={-1}
        media={propiedad.mediaSinSeccion || []}
        onSetCover={handleSetCover}
        onDeleteMedia={handleDeleteMedia}
        onImageUploaded={() => mutate()}
        onClearGallery={handleClearGallery}
        isReadOnly={!propiedad.permissions?.canManageGallery}
      />

      {/* Secciones Dinámicas con Drag & Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections-list" isDropDisabled={!propiedad.permissions?.canManageGallery}>
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-12">
              {propiedad.secciones?.map((seccion, index) => {
                const seccionConClient = seccion as SeccionGaleria & { clientId?: string };
                return (
                  <SectionalGallery
                    key={seccionConClient.clientId || seccion.id}
                    index={index}
                    sectionId={seccion.id}
                    sectionNombre={seccion.nombre}
                    sectionDescripcion={seccion.descripcion}
                    propiedadId={id}
                    propiedadTitulo={propiedad.titulo}
                    media={seccion.media || []}
                    onSetCover={handleSetCover}
                    onDeleteMedia={handleDeleteMedia}
                    onImageUploaded={() => mutate()}
                    onDeleteSection={handleDeleteSection}
                    onRenameSection={(id, nombre, desc) => handleRenameSection(id, nombre, desc, seccion.orden)}
                    onMoveUp={() => handleMoveSection(index, 'up')}
                    onMoveDown={() => handleMoveSection(index, 'down')}
                    onMoveTo={(newIndex) => handleMoveSection(index, newIndex > index ? 'down' : 'up', newIndex)}
                    totalSections={propiedad.secciones?.length || 0}
                    isReadOnly={!propiedad.permissions?.canManageGallery}
                  />
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Input Inline para Nueva Sección - World Class UX */}
      {isCreatingInline && propiedad.permissions?.canManageGallery && (
        <div className="bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-[2rem] p-6 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Plus size={24} />
            </div>
            <div className="flex-1">
              <input
                autoFocus
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmAddSection();
                  if (e.key === 'Escape') setIsCreatingInline(false);
                }}
                placeholder="Ej: Master Suite, Jardín Trasero..."
                className="w-full bg-transparent border-none text-xl font-black text-slate-900 placeholder:text-slate-300 outline-none"
              />
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Presiona Enter para crear o Esc para cancelar</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreatingInline(false)}
                className="p-3 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
              <button
                onClick={handleConfirmAddSection}
                disabled={!newSectionName.trim() || isAddingSection}
                className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isAddingSection ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check size={20} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
