import React from 'react';
import { useAgendaPanelLogic } from '../hooks/useAgendaPanelLogic';
import { AgendaPanelDesktop } from './AgendaPanelDesktop';
import { AgendaPanelMobile } from './AgendaPanelMobile';

interface AgendaPanelProps {
  onClose?: () => void;
}

export const AgendaPanel: React.FC<AgendaPanelProps> = ({ onClose }) => {
  const logic = useAgendaPanelLogic();

  return (
    <>
      <div className="hidden lg:block h-full">
        <AgendaPanelDesktop logic={logic} onClose={onClose} />
      </div>
      <div className="block lg:hidden h-full w-full">
        <AgendaPanelMobile logic={logic} onClose={onClose} />
      </div>
    </>
  );
};
