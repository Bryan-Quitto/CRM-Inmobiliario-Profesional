import { ChevronLeft, UserCheck, Search, MessageSquare, MessageCircle, Pencil, Merge } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import type { Contacto } from '../../types';
import { ContactoStatusDropdown } from '../ContactoStatusDropdown';
import { ArchiveToggleButton } from '@/components/ui/ArchiveToggleButton';
import { useCopilotStore } from '@/features/copilot/store/useCopilotStore';

interface ContactoHeaderProps {
  contacto: Contacto;
  isUpdatingEstado: boolean;
  activeDropdown: 'cliente' | 'propietario' | null;
  setActiveDropdown: (show: 'cliente' | 'propietario' | null) => void;
  handleStageChange: (etapa: string, tipo?: 'cliente' | 'propietario') => void;
  navigate: (path: string) => void;
  onEdit: () => void;
  onMerge: () => void;
  isTogglingArchive: boolean;
  onToggleArchive: () => void;
}

export const ContactoHeader = ({
  contacto,
  isUpdatingEstado,
  activeDropdown,
  setActiveDropdown,
  handleStageChange,
  navigate,
  onEdit,
  onMerge,
  isTogglingArchive,
  onToggleArchive
}: ContactoHeaderProps) => {
  const { pathname } = useLocation();
  const isFromOwners = pathname.includes('/propietarios');
  const backPath = isFromOwners ? '/propietarios' : '/contactos';
  const { setFocusedContext, toggleOpen } = useCopilotStore();
  
  const handleAnalizarConIA = () => {
    setFocusedContext({ id: contacto.id, name: [contacto.nombre, contacto.apellido].filter(Boolean).join(' ') });
    toggleOpen();
  };
  

  return (
    <div className="bg-white border-b border-slate-100 px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
      <div className="flex items-start md:items-center gap-3 md:gap-4 w-full md:w-auto">
        <button 
          onClick={() => navigate(backPath)}
          className="p-1.5 md:p-2 mt-0.5 md:mt-0 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer shrink-0"
        >
          <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3 items-start">
            <h1 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight truncate w-full md:w-auto">{[contacto.nombre, contacto.apellido].filter(Boolean).join(' ')}</h1>
            
            <div className="flex items-center gap-2 md:gap-3 overflow-x-auto hide-scrollbar w-full md:w-auto pb-1 md:pb-0">
              {/* Badge & Dropdown de Cliente */}
              {contacto.esContacto && (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Cliente
                  </div>
                  
                  <ContactoStatusDropdown
                    contacto={contacto}
                    tipo="cliente"
                    isOpen={activeDropdown === 'cliente'}
                    isUpdating={isUpdatingEstado}
                    onToggle={(tipo) => setActiveDropdown(tipo)}
                    onStatusChange={(_id, etapa, t) => handleStageChange(etapa, t === 'contacto' ? 'cliente' : 'propietario')}
                    variant="header"
                  />
                </div>
              )}

              {/* Badge & Dropdown de Propietario */}
              {contacto.esPropietario && (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    Propietario
                  </div>
                  
                  <ContactoStatusDropdown
                    contacto={contacto}
                    tipo="propietario"
                    isOpen={activeDropdown === 'propietario'}
                    isUpdating={isUpdatingEstado}
                    onToggle={(tipo) => setActiveDropdown(tipo)}
                    onStatusChange={(_id, etapa, t) => handleStageChange(etapa, t === 'contacto' ? 'cliente' : 'propietario')}
                    variant="header"
                  />
                </div>
              )}
            </div>
          </div>
          <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Expediente del Contacto</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto hide-scrollbar pb-1 md:pb-0 w-full md:w-auto">
        {contacto.telefono && (
          <a 
            title="WhatsApp Directo"
            href={`https://wa.me/${contacto.telefono.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 cursor-pointer"
          >
            <MessageSquare className="h-5 w-5" />
          </a>
        )}

        {contacto.facebookSenderId && (
          <a 
            title="Facebook Messenger"
            href={`https://m.me/${contacto.facebookSenderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 cursor-pointer"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        )}

        {!contacto.isArchivedForCurrentUser && (
          <button
            onClick={handleAnalizarConIA}
            title="Analizar con IA"
            className="h-10 px-3 md:px-4 bg-indigo-50 text-indigo-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest rounded-lg md:rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 flex items-center gap-1.5 md:gap-2 cursor-pointer shrink-0"
          >
            ✨ <span className="hidden md:inline">Analizar con IA</span>
          </button>
        )}

        <ArchiveToggleButton
          isArchived={!!contacto.isArchivedForCurrentUser}
          isToggling={isTogglingArchive}
          onToggle={onToggleArchive}
        />

        {!contacto.isArchivedForCurrentUser && (
          <>
            <button 
              title="Fusionar Contactos"
              data-testid="btn-merge-entity"
              onClick={onMerge}
              className="h-8 md:h-10 px-3 md:px-4 bg-white text-slate-700 font-black text-[9px] md:text-[10px] uppercase tracking-widest rounded-lg md:rounded-xl hover:bg-slate-50 transition-all shadow-sm border border-slate-200 flex items-center gap-1.5 md:gap-2 cursor-pointer shrink-0"
            >
              <Merge className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
              Fusionar
            </button>

            <button 
              data-testid="btn-edit-entity"
              onClick={onEdit}
              className="h-8 md:h-10 px-3 md:px-4 bg-slate-900 text-white font-black text-[9px] md:text-[10px] uppercase tracking-widest rounded-lg md:rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-1.5 md:gap-2 cursor-pointer shrink-0"
            >
              <Pencil className="h-3 w-3 md:h-4 md:w-4" />
              Editar
            </button>
          </>
        )}
      </div>
    </div>
  );
};
