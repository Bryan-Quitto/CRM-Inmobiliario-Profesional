import { Loader2 } from 'lucide-react';

interface ContactosSyncIndicatorProps {
  syncing: boolean;
  count: number;
}

export const ContactosSyncIndicator = ({ syncing, count }: ContactosSyncIndicatorProps) => {
  if (!syncing || count === 0) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
        <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Contactos...</span>
      </div>
    </div>
  );
};
