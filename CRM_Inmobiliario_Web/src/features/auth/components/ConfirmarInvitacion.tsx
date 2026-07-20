import React from 'react';
import { useConfirmarInvitacionLogic } from '../hooks/useConfirmarInvitacionLogic';
import { ConfirmarInvitacionDesktop } from './ConfirmarInvitacionDesktop';
import { ConfirmarInvitacionMobile } from './ConfirmarInvitacionMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const ConfirmarInvitacion: React.FC = () => {
  const logic = useConfirmarInvitacionLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <ConfirmarInvitacionMobile logic={logic} />
      ) : (
        <ConfirmarInvitacionDesktop logic={logic} />
      )}
    </>
  );
};
