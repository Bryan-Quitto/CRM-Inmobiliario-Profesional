import { Search } from 'lucide-react';

interface AuditoriaHeaderProps {
  search: string;
  setSearch: (val: string) => void;
}

export const AuditoriaHeader = ({ search, setSearch }: AuditoriaHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-end gap-6 mb-6">
      <div className="relative w-full max-w-sm group">
        <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Buscar contacto o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-8 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none shadow-sm placeholder:text-slate-300"
        />
      </div>
    </div>
  );
};
