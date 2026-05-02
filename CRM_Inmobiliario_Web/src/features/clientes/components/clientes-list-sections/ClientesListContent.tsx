import { Search } from 'lucide-react';
import { ClientesKanban } from '../ClientesKanban';
import { ClienteCard } from './ClienteCard';
import type { Cliente } from '../../types';

interface ClientesListContentProps {
  filteredClientes: Cliente[];
  viewMode: 'list' | 'kanban';
  syncing: boolean;
  onNavigate: (id: string) => void;
  onEdit: (cliente: Cliente) => void;
  onStageChange: (id: string, etapa: string) => void;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export const ClientesListContent = ({
  filteredClientes,
  viewMode,
  syncing,
  onNavigate,
  onEdit,
  onStageChange,
  openDropdownId,
  setOpenDropdownId,
  dropdownRef
}: ClientesListContentProps) => {
  if (filteredClientes.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-32 text-center shadow-sm flex flex-col items-center">
        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <Search className="h-10 w-10 text-slate-200" />
        </div>
        <p className="text-xl font-bold text-slate-900">Sin resultados</p>
        <p className="text-slate-400 text-sm mt-1">No encontramos lo que buscas. Intenta con otros filtros.</p>
      </div>
    );
  }

  if (viewMode === 'kanban') {
    return (
      <ClientesKanban 
        clientes={filteredClientes} 
        onStageChange={onStageChange}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
      {filteredClientes.map((cliente) => (
        <ClienteCard 
          key={cliente.id}
          cliente={cliente}
          syncing={syncing}
          onNavigate={onNavigate}
          onEdit={onEdit}
          onStageChange={onStageChange}
          isOpenDropdown={openDropdownId === cliente.id}
          setOpenDropdownId={setOpenDropdownId}
          dropdownRef={dropdownRef}
        />
      ))}
    </div>
  );
};
