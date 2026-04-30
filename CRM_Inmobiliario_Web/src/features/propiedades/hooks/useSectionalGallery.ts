import { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { useSWRConfig } from 'swr';
import { useGalleryCore } from './useGalleryCore';
import { useUpload } from '../context/useUpload';
import type { MultimediaPropiedad, Propiedad } from '../types';

interface UseSectionalGalleryProps {
  propiedadId: string;
  propiedadTitulo: string;
  sectionId?: string | null;
  sectionNombre: string;
  sectionDescripcion?: string | null;
  onSetCover: (id: string) => Promise<void>;
  onDeleteMedia: (id: string | string[]) => Promise<void>;
  onImageUploaded?: (result: MultimediaPropiedad) => void;
  onRenameSection?: (id: string, nuevoNombre: string, descripcion: string | null) => Promise<void>;
  onDeleteSection?: (id: string) => Promise<void>;
  onClearGallery?: () => Promise<void>;
}

export const useSectionalGallery = ({
  propiedadId,
  propiedadTitulo,
  sectionId,
  sectionNombre,
  sectionDescripcion,
  onSetCover,
  onDeleteMedia,
  onImageUploaded,
  onRenameSection,
  onDeleteSection,
  onClearGallery
}: UseSectionalGalleryProps) => {
  const { mutate } = useSWRConfig();
  const [, startTransition] = useTransition();

  // Core Gallery Logic
  const galleryCore = useGalleryCore();
  const { uploadFiles, isUploading } = useUpload();

  // Local States
  const [isDragging, setIsDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeleteSelection, setConfirmDeleteSelection] = useState(false);
  const [confirmDeleteSection, setConfirmDeleteSection] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);
  
  const [nombre, setNombre] = useState(sectionNombre);
  const [descripcion, setDescripcion] = useState(sectionDescripcion || '');
  const [isSavingDesc, setIsSavingDesc] = useState(false);
  const [saveDescSuccess, setSaveDescSuccess] = useState(false);
  
  const descTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const descripcionRef = useRef(descripcion);
  const nombreRef = useRef(nombre);
  const isPendingSaveDesc = useRef(false);
  const isSavingRef = useRef(isSavingDesc);

  // Sync refs for unmount save
  useEffect(() => {
    descripcionRef.current = descripcion;
    nombreRef.current = nombre;
    isPendingSaveDesc.current = descripcion !== (sectionDescripcion || '') || nombre !== sectionNombre;
  }, [descripcion, nombre, sectionDescripcion, sectionNombre]);

  useEffect(() => {
    isSavingRef.current = isSavingDesc;
  }, [isSavingDesc]);

  // Guardado al desmontar (Fire and Forget)
  useEffect(() => {
    return () => {
      if (isPendingSaveDesc.current && !isSavingRef.current && sectionId && onRenameSection && !sectionId.startsWith('temp-')) {
        onRenameSection(sectionId, nombreRef.current, descripcionRef.current || null).catch(console.error);
      }
    };
  }, [sectionId, onRenameSection]);

  // Sincronizar estado local con props solo si no hay cambios pendientes locales
  useEffect(() => {
    if (!isSavingDesc && !descTimeoutRef.current) {
      setNombre(sectionNombre);
      setDescripcion(sectionDescripcion || '');
    }
  }, [sectionNombre, sectionDescripcion, isSavingDesc]);

  // Auto-save for section description
  useEffect(() => {
    if (descripcion === (sectionDescripcion || '')) {
      isPendingSaveDesc.current = false;
      return;
    }
    if (!sectionId || !onRenameSection || sectionId.startsWith('temp-')) return;

    if (descTimeoutRef.current) clearTimeout(descTimeoutRef.current);

    descTimeoutRef.current = setTimeout(async () => {
      setIsSavingDesc(true);
      const swrKey = `/propiedades/${propiedadId}`;

      // Actualización Optimista
      mutate(swrKey, (prev: Propiedad | undefined) => {
        if (!prev || !sectionId) return prev;
        return {
          ...prev,
          secciones: prev.secciones?.map(s => 
            s.id === sectionId ? { ...s, descripcion } : s
          )
        };
      }, false);

      try {
        await onRenameSection(sectionId, nombre, descripcion || null);
        isPendingSaveDesc.current = false;
        setSaveDescSuccess(true);
        startTransition(() => {
          mutate(swrKey);
        });
        setTimeout(() => setSaveDescSuccess(false), 2000);
      } catch {
        mutate(swrKey);
      } finally {
        setIsSavingDesc(false);
      }
    }, 1500);

    return () => { if (descTimeoutRef.current) clearTimeout(descTimeoutRef.current); };
  }, [descripcion, sectionId, nombre, onRenameSection, sectionDescripcion, propiedadId, mutate]);

  // Handlers
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const filesArray = Array.from(files);
    uploadFiles(propiedadId, propiedadTitulo, filesArray, onImageUploaded, sectionId);
  }, [propiedadId, propiedadTitulo, onImageUploaded, sectionId, uploadFiles]);

  const handleRenameSubmit = useCallback(() => {
    setIsEditingName(false);
    if (onRenameSection && sectionId && nombre !== sectionNombre) {
      const swrKey = `/propiedades/${propiedadId}`;
      mutate(swrKey, (prev: Propiedad | undefined) => {
        if (!prev) return prev;
        return {
          ...prev,
          secciones: prev.secciones?.map(s => s.id === sectionId ? { ...s, nombre } : s)
        };
      }, false);

      onRenameSection(sectionId, nombre, descripcion || null)
        .then(() => mutate(swrKey))
        .catch(() => mutate(swrKey));
    }
  }, [onRenameSection, sectionId, nombre, sectionNombre, descripcion, propiedadId, mutate]);

  const handleConfirmAction = useCallback(() => {
    if (sectionId && onDeleteSection) {
      onDeleteSection(sectionId);
    } else if (!sectionId && onClearGallery) {
      onClearGallery();
    }
    setConfirmDeleteSection(false);
  }, [sectionId, onDeleteSection, onClearGallery]);

  // Stable handlers for MediaCard
  const handleSetCoverStable = useCallback((id: string) => onSetCover(id), [onSetCover]);
  const handleDeleteMediaStable = useCallback((id: string | string[]) => onDeleteMedia(id), [onDeleteMedia]);
  const handleSavedStable = useCallback(() => {
    mutate(`/propiedades/${propiedadId}`);
  }, [mutate, propiedadId]);

  return {
    // States
    isDragging, setIsDragging,
    confirmDelete, setConfirmDelete,
    confirmDeleteSelection, setConfirmDeleteSelection,
    confirmDeleteSection, setConfirmDeleteSection,
    isEditingName, setIsEditingName,
    isOrderDropdownOpen, setIsOrderDropdownOpen,
    nombre, setNombre,
    descripcion, setDescripcion,
    isSavingDesc,
    saveDescSuccess,
    dropdownRef,
    
    // Core
    ...galleryCore,
    isUploading: isUploading(propiedadId, sectionId),
    
    // Actions
    handleFiles,
    handleRenameSubmit,
    handleConfirmAction,
    handleSetCoverStable,
    handleDeleteMediaStable,
    handleSavedStable
  };
};
