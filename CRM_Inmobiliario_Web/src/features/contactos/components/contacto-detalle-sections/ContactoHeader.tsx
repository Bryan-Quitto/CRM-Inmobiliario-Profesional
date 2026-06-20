import { ChevronLeft, UserCheck, Search, MessageSquare, MessageCircle, Pencil, Merge } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import type { Contacto } from '../../types';
import { ContactoStatusDropdown } from '../ContactoStatusDropdown';
import { ArchiveToggleButton } from '@/components/ui/ArchiveToggleButton';

interface ContactoHeaderProps {
  contacto: Contacto;
  isUpdatingEtapa: boolean;
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
  isUpdatingEtapa,
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
  

  return (
    <div className="bg-white border-b border-slate-100 sticky top-0 z-[100] px-6 py-4 flex items-center justify-between backdrop-blur-md bg-white/80">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(backPath)}
          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{[contacto.nombre, contacto.apellido].filter(Boolean).join(' ')}</h1>
            
            <div className="flex items-center gap-3">
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
                    isUpdating={isUpdatingEtapa}
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
                    isUpdating={isUpdatingEtapa}
                    onToggle={(tipo) => setActiveDropdown(tipo)}
                    onStatusChange={(_id, etapa, t) => handleStageChange(etapa, t === 'contacto' ? 'cliente' : 'propietario')}
                    variant="header"
                  />
                </div>
              )}
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Expediente del Contacto</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {contacto.telefono && (
          <a 
            href={`https://wa.me/${contacto.telefono.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp Directo"
            className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 cursor-pointer"
          >
            <MessageSquare className="h-5 w-5" />
          </a>
        )}

        {contacto.facebookSenderId && (
          <a 
            href={`https://m.me/${contacto.facebookSenderId}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Facebook Messenger"
            className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 cursor-pointer"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
        )}

        <ArchiveToggleButton
          isArchived={!!contacto.isArchivedForCurrentUser}
          isToggling={isTogglingArchive}
          onToggle={onToggleArchive}
        />

        {!contacto.isArchivedForCurrentUser && (
          <>
            <button 
              data-testid="btn-merge-entity"
              onClick={onMerge}
              title="Fusionar Contactos"
              className="h-10 px-4 bg-white text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-sm border border-slate-200 flex items-center gap-2 cursor-pointer"
            >
              <Merge className="h-4 w-4 text-blue-500" />
              Fusionar
            </button>

            <button 
              data-testid="btn-edit-entity"
              onClick={onEdit}
              className="h-10 px-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 cursor-pointer"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </button>
          </>
        )}
      </div>
    </div>
  );
};
