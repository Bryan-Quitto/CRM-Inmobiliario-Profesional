import React from 'react';
import ConfirmModal from '../ConfirmModal';
import { AlertTriangle } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLogout?: boolean;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLogout = false,
}) => {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      type="warning"
      icon={<AlertTriangle className="h-10 w-10 text-amber-500" />}
      title={isLogout ? "Cerrar sesión con cambios pendientes" : "Tienes cambios sin guardar"}
      description={
        isLogout
          ? "Hay operaciones guardándose en segundo plano. Si cierras sesión ahora, podrías perder información importante. ¿Estás seguro de que deseas salir?"
          : "Hay operaciones guardándose en segundo plano. Si sales de esta pantalla ahora, podrías perder información. ¿Estás seguro de abandonar la página?"
      }
      confirmText="Sí, salir de todos modos"
      cancelText="No, esperar a que se guarde"
    />
  );
};
