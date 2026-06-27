import { CrearContactoForm } from '../../features/contactos/components/CrearContactoForm';
import type { LogicProps } from '../../hooks/useGlobalContactoModalLogic';

export const GlobalContactoModalMobile = ({ logic }: { logic: LogicProps }) => {
  if (!logic.isOpen) return null;

  return (
    <div className="flex lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] items-end justify-center">
      <div className="w-full bg-transparent max-h-[100dvh] flex flex-col animate-in slide-in-from-bottom-full duration-300">
        <CrearContactoForm 
          initialData={logic.contacto}
          isOwnersView={logic.isOwnersView}
          onSuccess={logic.close}
          onCancel={logic.close}
        />
      </div>
    </div>
  );
};
