import React from 'react';
import { useLoginFormLogic } from '../hooks/useLoginFormLogic';
import { LoginFormDesktop } from './LoginFormDesktop';
import { LoginFormMobile } from './LoginFormMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const LoginForm: React.FC = () => {
  const logic = useLoginFormLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <LoginFormMobile logic={logic} />
      ) : (
        <LoginFormDesktop logic={logic} />
      )}
    </>
  );
};
