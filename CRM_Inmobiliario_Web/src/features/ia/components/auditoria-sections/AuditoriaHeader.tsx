import { Bot, Activity, Search } from 'lucide-react';

interface AuditoriaHeaderProps {
  search: string;
  setSearch: (val: string) => void;
}

export const AuditoriaHeader = ({ search, setSearch }: AuditoriaHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-2xl shadow-blue-600/30 rotate-3">
            <Bot className="h-8 w-8" />
          </div>
          Auditoría IA
        </h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 flex items-center gap-2">
          <Activity className="h-3 w-3 text-emerald-500" />
          Supervisión proactiva del asistente
        </p>
      </div>

      <div className="relative w-full max-w-sm group">
        <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Buscar cliente o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-8 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none shadow-sm placeholder:text-slate-300"
        />
      </div>
    </div>
  );
};
