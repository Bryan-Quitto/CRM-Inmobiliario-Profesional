import React from 'react';
import { useAgendaPanelLogic } from '../hooks/useAgendaPanelLogic';
import { AgendaPanelDesktop } from './AgendaPanelDesktop';
import { AgendaPanelMobile } from './AgendaPanelMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

interface AgendaPanelProps {
  onClose?: () => void;
}

export const AgendaPanel: React.FC<AgendaPanelProps> = ({ onClose }) => {
  const logic = useAgendaPanelLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <AgendaPanelMobile logic={logic} onClose={onClose} />
      ) : (
        <AgendaPanelDesktop logic={logic} onClose={onClose} />
      )}
    </>
  );
};
