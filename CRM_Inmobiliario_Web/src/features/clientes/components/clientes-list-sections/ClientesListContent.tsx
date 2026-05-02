import { ClientesKanban } from '../ClientesKanban';
import { ClienteCard } from './ClienteCard';
import type { Cliente } from '../../types';

interface ClientesListContentProps {
  filteredClientes: Cliente[];
  activeSegment: 'todos' | 'prospectos' | 'propietarios';
  viewMode: 'list' | 'kanban';
  syncing: boolean;
  onNavigate: (id: string) => void;
  onEdit: (cliente: Cliente) => void;
  onStageChange: (id: string, etapa: string, data?: { propiedadId: string, precioCierre: number, nuevoEstadoPropiedad: string }, tipo?: 'prospecto' | 'propietario') => void;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export const ClientesListContent = ({
  filteredClientes,
  activeSegment,
  viewMode,
  syncing,
  onNavigate,
  onEdit,
  onStageChange,
  openDropdownId,
  setOpenDropdownId,
  dropdownRef
}: ClientesListContentProps) => {
  if (viewMode === 'kanban') {
    return (
      <ClientesKanban 
        clientes={filteredClientes}
        activeSegment={activeSegment}
        onNavigate={onNavigate}
        onStageChange={onStageChange}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
      {filteredClientes.map((cliente) => (
        <ClienteCard 
          key={cliente.id}
          cliente={cliente}
          activeSegment={activeSegment}
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
