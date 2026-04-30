import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Propiedad } from '../../types';

export const usePropiedadesUI = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [statusConfirmation, setStatusConfirmation] = useState<{ id: string; nuevoEstado: string } | null>(null);
  const [closingPropiedad, setClosingPropiedad] = useState<{ propiedad: Propiedad; nuevoEstado: string } | null>(null);
  const [showReversionModal, setShowReversionModal] = useState<{ type: 'status', id: string, targetStatus: string } | null>(null);
  const [selectedPropiedadIdForEdit, setSelectedPropiedadIdForEdit] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedPropiedadId = searchParams.get('id');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleOpenDetail = (id: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('id', id);
    setSearchParams(newParams);
  };

  const handleCloseDetail = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('id');
    setSearchParams(newParams);
  };

  return {
    isModalOpen,
    setIsModalOpen,
    notification,
    setNotification,
    openDropdownId,
    setOpenDropdownId,
    statusConfirmation,
    setStatusConfirmation,
    closingPropiedad,
    setClosingPropiedad,
    showReversionModal,
    setShowReversionModal,
    selectedPropiedadIdForEdit,
    setSelectedPropiedadIdForEdit,
    selectedPropiedadId,
    dropdownRef,
    handleOpenDetail,
    handleCloseDetail
  };
};
