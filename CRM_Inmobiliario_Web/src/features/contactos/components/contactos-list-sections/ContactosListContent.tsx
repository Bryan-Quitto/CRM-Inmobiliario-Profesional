import { ContactosKanban } from '../ContactosKanban';
import { ContactoCard } from './ContactoCard';
import type { Contacto } from '../../types';

interface ContactosListContentProps {
  filteredContactos: Contacto[];
  activeSegment: 'todos' | 'clientes' | 'propietarios';
  viewMode: 'list' | 'kanban';
  syncing: boolean;
  onNavigate: (id: string) => void;
  onEdit: (contacto: Contacto) => void;
  onStageChange: (id: string, etapa: string, data?: { propiedadId: string, precioCierre: number, nuevoEstadoPropiedad: string }, tipo?: 'contacto' | 'propietario') => void;
}

export const ContactosListContent = ({
  filteredContactos,
  activeSegment,
  viewMode,
  syncing,
  onNavigate,
  onEdit,
  onStageChange,
}: ContactosListContentProps) => {
  if (viewMode === 'kanban') {
    return (
      <ContactosKanban 
        contactos={filteredContactos}
        activeSegment={activeSegment}
        onNavigate={onNavigate}
        onStageChange={onStageChange}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
      {filteredContactos.map((contacto) => (
        <ContactoCard 
          key={contacto.id}
          contacto={contacto}
          activeSegment={activeSegment}
          syncing={syncing}
          onNavigate={onNavigate}
          onEdit={onEdit}
          onStageChange={onStageChange}
        />
      ))}
    </div>
  );
};
