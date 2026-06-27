
import { SearchInput } from '@/components/ui/SearchInput';

interface AuditoriaHeaderProps {
  search: string;
  setSearch: (val: string) => void;
}

export const AuditoriaHeader = ({ search, setSearch }: AuditoriaHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-end gap-6 mb-6">
      <div className="w-full max-w-sm group">
        <SearchInput 
          placeholder="Buscar contacto o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 focus:ring-8 focus:ring-blue-50 focus:border-blue-200 shadow-sm placeholder:text-slate-300"
          iconClassName="left-4 h-5 w-5 text-slate-300 group-focus-within:text-blue-500 transition-colors"
        />
      </div>
    </div>
  );
};
