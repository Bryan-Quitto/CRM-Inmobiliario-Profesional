import { Loader2 } from 'lucide-react';

export const PageLoader = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500">
    <Loader2 className="h-10 w-10 text-blue-700 animate-spin mb-4" />
    <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">Cargando módulo...</p>
  </div>
);

export const SidebarLoader = () => (
  <div className="w-80 bg-white border-l border-slate-200 h-full flex items-center justify-center">
    <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
  </div>
);
