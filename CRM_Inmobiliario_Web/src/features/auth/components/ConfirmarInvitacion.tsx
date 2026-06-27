import React from 'react';
import { useConfirmarInvitacionLogic } from '../hooks/useConfirmarInvitacionLogic';
import { ConfirmarInvitacionDesktop } from './ConfirmarInvitacionDesktop';
import { ConfirmarInvitacionMobile } from './ConfirmarInvitacionMobile';

export const ConfirmarInvitacion: React.FC = () => {
  const logic = useConfirmarInvitacionLogic();

  return (
    <>
      <div className="hidden lg:block">
        <ConfirmarInvitacionDesktop logic={logic} />
      </div>
      <div className="block lg:hidden">
        <ConfirmarInvitacionMobile logic={logic} />
      </div>
    </>
  );
};
