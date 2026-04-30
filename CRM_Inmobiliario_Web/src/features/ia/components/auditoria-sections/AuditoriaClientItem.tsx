import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, User, ExternalLink, Clock, Settings, MessageSquare, Heart } from 'lucide-react';
import { AuditoriaSectionRegistrado } from './AuditoriaSectionRegistrado';
import { AuditoriaSectionConversacion } from './AuditoriaSectionConversacion';
import { AuditoriaSectionIntereses } from './AuditoriaSectionIntereses';
import { dateFormatter, timeFormatter } from '../../constants/auditoriaConstants';
import type { ClientGroup } from '../../types/auditoria';

interface AuditoriaClientItemProps {
  group: ClientGroup;
  isExpanded: boolean;
  onToggle: () => void;
  // Acciones de registro
  idABorrar: string | null;
  setIdABorrar: (id: string | null) => void;
  isDeleting: boolean;
  handleEditClick: (id: string) => void;
  handleConfirmDelete: (id: string) => void;
  // Mutate para intereses
  mutate: () => Promise<ClientGroup[] | undefined>;
}

export const AuditoriaClientItem = ({
  group,
  isExpanded,
  onToggle,
  idABorrar,
  setIdABorrar,
  isDeleting,
  handleEditClick,
  handleConfirmDelete,
  mutate
}: AuditoriaClientItemProps) => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<'registrado' | 'conversacion' | 'intereses' | null>(null);

  const handleToggleSection = (section: 'registrado' | 'conversacion' | 'intereses') => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  return (
    <div 
      className={`bg-white border-2 transition-all duration-500 rounded-[2.5rem] overflow-hidden ${
        isExpanded 
          ? 'border-blue-200 shadow-2xl shadow-blue-600/5 ring-8 ring-blue-50/50' 
          : 'border-slate-50 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/20'
      }`}
    >
      {/* Header del Cliente */}
      <div className="p-6 flex items-center justify-between gap-4">
        <div 
          className="flex-1 flex items-center gap-5 cursor-pointer"
          onClick={onToggle}
        >
          <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center text-xl font-black shadow-inner rotate-2 transition-transform ${
            isExpanded ? 'bg-blue-600 text-white scale-110' : 'bg-slate-100 text-slate-400'
          }`}>
            {group.nombre[0]}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-black text-slate-900 tracking-tight truncate">
                {group.nombre}
              </h3>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm font-bold text-slate-400">{group.telefono}</p>
              <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {dateFormatter.format(new Date(group.ultimaActividad))} @ {timeFormatter.format(new Date(group.ultimaActividad))}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {group.clienteId && (
            <button 
              onClick={() => navigate(`/prospectos/${group.clienteId}`)}
              className="hidden sm:flex items-center gap-3 bg-slate-50 hover:bg-slate-900 hover:text-white p-3 pr-5 rounded-2xl transition-all group cursor-pointer border border-slate-100 hover:border-slate-900"
            >
              <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm transition-colors">
                <User size={20} />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black text-slate-400 group-hover:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  Expediente
                  <ExternalLink size={10} />
                </p>
                <p className="text-xs font-black leading-none mt-1">Ver Cliente</p>
              </div>
            </button>
          )}

          <button 
            onClick={onToggle}
            className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isExpanded ? 'bg-blue-50 text-blue-600 rotate-180' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
            }`}
          >
            <ChevronDown className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Secciones Desplegables */}
      {isExpanded && (
        <div className="p-8 pt-2 border-t border-slate-50 space-y-4 animate-in slide-in-from-top-4 duration-500">
          
          {/* Seccion: Registrado */}
          <div className="space-y-3">
            <button 
              onClick={() => handleToggleSection('registrado')}
              className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all cursor-pointer border ${
                expandedSection === 'registrado' ? 'bg-blue-50 border-blue-100 shadow-sm' : 'bg-slate-50/50 hover:bg-slate-50 border-transparent hover:border-slate-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${
                  expandedSection === 'registrado' ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'
                }`}>
                  <Settings className="h-5 w-5" />
                </div>
                <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Registrado</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform ${expandedSection === 'registrado' ? 'rotate-180 text-blue-500' : ''}`} />
            </button>

            {expandedSection === 'registrado' && (
              <AuditoriaSectionRegistrado 
                registradoPorIA={group.registradoPorIA}
                clienteId={group.clienteId}
                idABorrar={idABorrar}
                setIdABorrar={setIdABorrar}
                isDeleting={isDeleting}
                handleEditClick={handleEditClick}
                handleConfirmDelete={handleConfirmDelete}
              />
            )}
          </div>

          {/* Seccion: Conversación */}
          <div className="space-y-3">
            <button 
              onClick={() => handleToggleSection('conversacion')}
              className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all cursor-pointer border ${
                expandedSection === 'conversacion' ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-slate-50/50 hover:bg-slate-50 border-transparent hover:border-slate-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${
                  expandedSection === 'conversacion' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400'
                }`}>
                  <MessageSquare className="h-5 w-5" />
                </div>
                <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Conversación</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform ${expandedSection === 'conversacion' ? 'rotate-180 text-emerald-500' : ''}`} />
            </button>

            {expandedSection === 'conversacion' && (
              <AuditoriaSectionConversacion 
                telefono={group.telefono}
                isActive={expandedSection === 'conversacion'}
              />
            )}
          </div>

          {/* Seccion: Intereses */}
          <div className="space-y-3">
            <button 
              onClick={() => handleToggleSection('intereses')}
              className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all cursor-pointer border ${
                expandedSection === 'intereses' ? 'bg-rose-50 border-rose-100 shadow-sm' : 'bg-slate-50/50 hover:bg-slate-50 border-transparent hover:border-slate-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${
                  expandedSection === 'intereses' ? 'bg-rose-500 text-white' : 'bg-white text-slate-400'
                }`}>
                  <Heart className="h-5 w-5" />
                </div>
                <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Intereses</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform ${expandedSection === 'intereses' ? 'rotate-180 text-rose-500' : ''}`} />
            </button>

            {expandedSection === 'intereses' && (
              <AuditoriaSectionIntereses 
                clienteId={group.clienteId}
                intereses={group.intereses}
                logs={group.logs}
                mutate={mutate}
              />
            )}
          </div>

        </div>
      )}
    </div>
  );
};
