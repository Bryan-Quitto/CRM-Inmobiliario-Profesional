import { useState } from 'react';
import { Plus, X, Check, Loader2, Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { MobileInfoPopover } from '@/components/ui/MobileInfoPopover';
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import { SectionalGallery } from '../SectionalGallery';
import type { Propiedad, SeccionGaleria } from '../../types';

interface DetalleGalleryManagerProps {
  id: string;
  propiedad: Propiedad;
  isCreatingInline: boolean;
  isAddingSection: boolean;
  newSectionName: string;
  newSectionDesc: string;
  setNewSectionName: (name: string) => void;
  setNewSectionDesc: (desc: string) => void;
  setIsCreatingInline: (open: boolean) => void;
  handleAddSection: () => void;
  handleConfirmAddSection: () => void;
  handleSetCover: (imagenId: string) => Promise<void>;
  handleDeleteMedia: (ids: string | string[]) => Promise<void>;
  handleClearGallery: (soloGeneral?: boolean) => Promise<void>;
  handleDeleteSection: (sectionId: string, deleteMedia?: boolean) => Promise<void>;
  handleRenameSection: (id: string, nombre: string, desc: string | null, orden: number) => Promise<void>;
  handleMoveSection: (index: number, direction: 'up' | 'down', customTargetIndex?: number) => void;
  handleDragEnd: (result: DropResult) => void;
  mutate: () => void;
  isArchived?: boolean;
}

export const DetalleGalleryManager = ({
  id,
  propiedad,
  isCreatingInline,
  isAddingSection,
  newSectionName,
  newSectionDesc,
  setNewSectionName,
  setNewSectionDesc,
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
  mutate,
  isArchived
}: DetalleGalleryManagerProps) => {
  
  const [now] = useState(() => Date.now());
  const isCleaned = propiedad.bloqueoLimpiezaOverride !== null && propiedad.bloqueoLimpiezaOverride !== undefined
    ? propiedad.bloqueoLimpiezaOverride
    : (propiedad.estadoComercial === 'Vendida' || propiedad.estadoComercial === 'Alquilada') && 
      propiedad.fechaProgramadaLimpiezaR2 === null && 
      propiedad.fechaCierre && 
      new Date(propiedad.fechaCierre).getTime() < now - 365 * 24 * 60 * 60 * 1000;

  const canManage = !isArchived && propiedad.permissions?.canManageGallery;
  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-indigo-600 rounded-full"></div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Galerías del Inmueble</h3>
        </div>
        {canManage && (
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
        isReadOnly={!canManage}
        isCleaned={!!isCleaned}
      />

      {/* Secciones Dinámicas con Drag & Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections-list" isDropDisabled={!canManage}>
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
                    isReadOnly={!canManage}
                    isCleaned={!!isCleaned}
                  />
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Input Inline para Nueva Sección - World Class UX */}
      {isCreatingInline && canManage && (
        <div className="bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-[2rem] p-6 animate-in zoom-in-95 duration-300">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0 mt-1">
              <Plus size={24} />
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <div className="relative">
                <input
                  autoFocus
                  maxLength={50}
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmAddSection();
                    if (e.key === 'Escape') setIsCreatingInline(false);
                  }}
                  placeholder="Nombre de sección (Ej: Master Suite, Cocina...)"
                  className="w-full bg-transparent border-none text-xl font-black text-slate-900 placeholder:text-slate-400 outline-none pr-16"
                />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                  {newSectionName.length}/50
                </span>
              </div>
              <div className="relative">
                <textarea
                  maxLength={300}
                  value={newSectionDesc}
                  onChange={(e) => setNewSectionDesc(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleConfirmAddSection();
                    }
                    if (e.key === 'Escape') setIsCreatingInline(false);
                  }}
                  rows={2}
                  placeholder="Descripción comercial detallada de esta área..."
                  className="w-full bg-white/50 border border-indigo-100/50 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-200 transition-all resize-none pb-7"
                />
                <span className="absolute right-3 bottom-2 text-[10px] font-bold text-slate-400">
                  {newSectionDesc.length}/300
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Presiona Enter para guardar o Esc para cancelar</p>
                <div className="flex items-center">
                  <div className="hidden lg:flex">
                    <Tooltip content="La IA usará este texto para redactar un mensaje de venta persuasivo al enviar estas fotos.">
                      <div className="text-indigo-300 hover:text-indigo-600 transition-colors cursor-help flex">
                        <Info size={14} />
                      </div>
                    </Tooltip>
                  </div>
                  <div className="flex lg:hidden">
                    <MobileInfoPopover content="La IA usará este texto para redactar un mensaje de venta persuasivo al enviar estas fotos.">
                      <div className="text-indigo-300 hover:text-indigo-600 transition-colors cursor-help flex">
                        <Info size={14} />
                      </div>
                    </MobileInfoPopover>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => setIsCreatingInline(false)}
                className="p-3 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
              <button
                onClick={handleConfirmAddSection}
                disabled={!newSectionName.trim() || !newSectionDesc.trim() || isAddingSection}
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

