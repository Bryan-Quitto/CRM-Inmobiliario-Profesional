import { Mail, Phone, Clock, Pencil, ChevronDown, Check } from 'lucide-react';
import { ETAPAS, ETAPAS_PROPIETARIO } from '../../constants/contactos';
import type { Contacto } from '../../types';

interface ContactoCardProps {
  contacto: Contacto;
  activeSegment: 'todos' | 'contactos' | 'propietarios';
  syncing: boolean;
  onNavigate: (id: string) => void;
  onEdit: (contacto: Contacto) => void;
  onStageChange: (id: string, etapa: string, data?: { propiedadId: string, precioCierre: number, nuevoEstadoPropiedad: string }, tipo?: 'contacto' | 'propietario') => void;
  isOpenDropdown: boolean;
  setOpenDropdownId: (id: string | null) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export const ContactoCard = ({
  contacto,
  activeSegment,
  syncing,
  onNavigate,
  onEdit,
  onStageChange,
  isOpenDropdown,
  setOpenDropdownId,
  dropdownRef
}: ContactoCardProps) => {
  const isOwnerMode = activeSegment === 'propietarios';
  
  const getEtapaStyles = (etapa: string, isPropietario: boolean = false) => {
    const list = isPropietario ? ETAPAS_PROPIETARIO : ETAPAS;
    const found = list.find((e: { value: string }) => e.value === etapa);
    return found?.color || 'bg-gray-50 text-gray-600 border-gray-100';
  };

  const currentEtapa = isOwnerMode ? contacto.estadoPropietario : contacto.etapaEmbudo;
  const currentOptions = isOwnerMode ? ETAPAS_PROPIETARIO : ETAPAS;

  return (
    <div 
      onClick={() => onNavigate(contacto.id)}
      className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 group relative overflow-hidden cursor-pointer"
    >
      {syncing && <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px] pointer-events-none" />}
      
      <div className="flex justify-between items-start mb-5">
        <div className="h-12 w-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-slate-900/10 group-hover:bg-blue-600 group-hover:shadow-blue-600/20 transition-all">
          {contacto.nombre[0]}{contacto.apellido?.[0] || ''}
        </div>
        
        <div className="relative" ref={isOpenDropdown ? dropdownRef : null}>
          {activeSegment !== 'todos' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdownId(isOpenDropdown ? null : contacto.id);
              }}
              className={`cursor-pointer px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm transition-all flex items-center gap-2 ${getEtapaStyles(currentEtapa, isOwnerMode)}`}
            >
              {isOwnerMode ? `Propietario: ${currentEtapa}` : currentEtapa}
              <ChevronDown className={`h-3 w-3 transition-transform ${isOpenDropdown ? 'rotate-180' : ''}`} />
            </button>
          )}

          {activeSegment === 'todos' && (
             <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-slate-50 text-slate-500 border-slate-100`}>
                Multipolar
             </div>
          )}

          {isOpenDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[50] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
              {currentOptions.map((etapa) => (
                <button
                  key={etapa.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStageChange(contacto.id, etapa.value, undefined, isOwnerMode ? 'propietario' : 'contacto');
                  }}
                  className={`cursor-pointer w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 ${
                    currentEtapa === etapa.value ? 'text-blue-600' : 'text-slate-600'
                  }`}
                >
                  {etapa.label}
                  {currentEtapa === etapa.value && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
          {[contacto.nombre, contacto.apellido].filter(Boolean).join(' ')}
        </h3>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {contacto.esContacto && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100/50">
              Contacto
            </span>
          )}
          {contacto.esPropietario && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
              contacto.propiedadesCaptadas && contacto.propiedadesCaptadas.some(p => p.estadoComercial === 'Disponible' || p.estadoComercial === 'En Negociación')
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                : 'bg-slate-50 text-slate-400 border-slate-100'
            }`}>
              Propietario: {contacto.propiedadesCaptadas && contacto.propiedadesCaptadas.some(p => p.estadoComercial === 'Disponible' || p.estadoComercial === 'En Negociación') ? 'Activo' : 'Cerrado'}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-5 border-t border-slate-50">
        {contacto.email && (
          <div className="flex items-center gap-3 text-sm text-slate-500 font-medium group-hover:text-slate-900 transition-colors">
            <Mail className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
            <span className="truncate">{contacto.email}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium group-hover:text-slate-900 transition-colors">
          <Phone className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
          <span>{contacto.telefono}</span>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          Desde: {new Date(contacto.fechaCreacion!).toLocaleDateString()}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEdit(contacto);
          }}
          className="h-8 w-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
          title="Editar Contacto"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
