import { CrearContactoForm } from '../../features/contactos/components/CrearContactoForm';
import type { LogicProps } from '../../hooks/useGlobalContactoModalLogic';

export const GlobalContactoModalMobile = ({ logic }: { logic: LogicProps }) => {
  if (!logic.isOpen) return null;

  return (
    <div className="flex lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] items-end sm:items-center justify-center sm:p-4">
      <div className="w-full bg-transparent max-h-[100dvh] flex flex-col items-center animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
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
