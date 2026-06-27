import React from 'react';
import { useLoginFormLogic } from '../hooks/useLoginFormLogic';
import { LoginFormDesktop } from './LoginFormDesktop';
import { LoginFormMobile } from './LoginFormMobile';

export const LoginForm: React.FC = () => {
  const logic = useLoginFormLogic();

  return (
    <>
      <div className="hidden lg:block h-full w-full">
        <LoginFormDesktop logic={logic} />
      </div>
      <div className="block lg:hidden h-full w-full">
        <LoginFormMobile logic={logic} />
      </div>
    </>
  );
};
