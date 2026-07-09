import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Clock, CalendarDays, Users, Home } from 'lucide-react';
import type { CandidateDto, SortByOptions } from '../api/useArchivingCandidates';
import { TruncatedText } from '@/components/ui/TruncatedText';

interface Props {
  type: 'contactos' | 'propiedades';
  candidates: CandidateDto[];
  isLoading: boolean;
  sortBy: SortByOptions;
  setSortBy: (sortBy: SortByOptions) => void;
  isEnabled: boolean; // AutoArchivadoContactos/Propiedades config
}

export const AutoArchivadoCandidatesList: React.FC<Props> = ({
  type,
  candidates,
  isLoading,
  sortBy,
  setSortBy,
  isEnabled
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isEnabled) {
    return null; // Don't render if the auto-archive config for this type is off
  }

  const isContacts = type === 'contactos';
  const Icon = isContacts ? Users : Home;
  const title = isContacts ? 'Contactos' : 'Propiedades';

  return (
    <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all duration-300">
      <div 
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isContacts ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Candidatos a Archivar: {title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Vista previa de los 10 registros principales</p>
          </div>
        </div>
        <div className="text-slate-400">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <p className="text-sm text-slate-600 font-medium">Lista de {title.toLowerCase()} inactivos</p>
            <div className="relative w-full sm:w-64" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full flex items-center justify-between pl-4 pr-4 py-2.5 bg-white border rounded-xl text-sm font-bold outline-none shadow-sm transition-all cursor-pointer ${
                  isDropdownOpen 
                    ? 'border-indigo-400 ring-2 ring-indigo-100 text-indigo-700' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <TruncatedText as="span" className="truncate">
                  {sortBy === 'ProximosArchivar' ? 'Mayor inactividad' : 'Actividad reciente'}
                </TruncatedText>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-indigo-500' : 'text-slate-400'}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-lg z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('ProximosArchivar');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                      sortBy === 'ProximosArchivar' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Mayor inactividad
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('Recientes');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                      sortBy === 'Recientes' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Actividad reciente
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Última Actividad</th>
                  <th className="px-4 py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                      <div className="flex justify-center mb-2">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      Cargando candidatos...
                    </td>
                  </tr>
                ) : candidates.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500 italic">
                      No hay {title.toLowerCase()} próximos a archivar.
                    </td>
                  </tr>
                ) : (
                  candidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {candidate.name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <CalendarDays size={14} className="text-slate-400" />
                          {new Date(candidate.lastActivityUtc).toLocaleDateString('es-EC', { 
                            day: '2-digit', month: 'short', year: 'numeric' 
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {candidate.daysUntilArchive <= 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                            <Clock size={12} />
                            Se archivará hoy
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            <Clock size={12} />
                            En {candidate.daysUntilArchive} días
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
