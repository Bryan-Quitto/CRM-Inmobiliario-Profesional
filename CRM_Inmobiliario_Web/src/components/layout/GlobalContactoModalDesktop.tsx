import { CrearContactoForm } from '../../features/contactos/components/CrearContactoForm';
import type { LogicProps } from '../../hooks/useGlobalContactoModalLogic';

export const GlobalContactoModalDesktop = ({ logic }: { logic: LogicProps }) => {
  if (!logic.isOpen) return null;

  return (
    <div className="hidden lg:flex fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] items-center justify-center p-4">
      <CrearContactoForm 
        initialData={logic.contacto}
        isOwnersView={logic.isOwnersView}
        onSuccess={logic.close}
        onCancel={logic.close}
      />
    </div>
  );
};
