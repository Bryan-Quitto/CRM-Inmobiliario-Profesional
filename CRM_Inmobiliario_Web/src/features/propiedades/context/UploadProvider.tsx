import React from 'react';
import { UploadContext } from './UploadContext';
import { useUploadManager } from '../hooks/useUploadManager';
import { UploadNotificationStack } from '../components/UploadNotificationStack';

/**
 * Proveedor global de subidas que orquestra el estado y la UI de carga en background.
 * Implementa la "Zero Wait Policy" permitiendo al usuario seguir navegando mientras se suben archivos.
 */
export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    uploads, 
    activeUploads, 
    uploadFiles, 
    isUploading, 
    dismissUpload 
  } = useUploadManager();

  return (
    <UploadContext.Provider value={{ uploads, activeUploads, uploadFiles, isUploading }}>
      {children}
      <UploadNotificationStack 
        activeUploads={activeUploads} 
        onDismiss={dismissUpload} 
      />
    </UploadContext.Provider>
  );
};
