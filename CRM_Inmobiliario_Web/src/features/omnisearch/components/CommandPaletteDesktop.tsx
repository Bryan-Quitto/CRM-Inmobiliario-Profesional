import React, { useRef, useEffect } from 'react';
import { Search, X, Settings, Calendar, PlusSquare, User, Home, CheckCircle, Loader2, Users, Building, BarChart, Bot } from 'lucide-react';
import { useCommandPaletteLogic, type OmniSearchResult } from '../hooks/useCommandPaletteLogic';
import { HelpButton } from '../../../components/ui/HelpButton';

const IconMap: Record<string, React.ElementType> = {
  Settings,
  Calendar,
  PlusSquare,
  Users,
  Building,
  BarChart,
  Bot,
  Contacto: User,
  Propiedad: Home,
  Tarea: CheckCircle,
};

interface Props {
  logic: ReturnType<typeof useCommandPaletteLogic>;
}

export const CommandPaletteDesktop: React.FC<Props> = ({ logic }) => {
  const {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    data,
    isLoading,
    isSyncing,
    filteredStaticOptions,
    handleSelectStatic,
    handleSelectDynamic,
  } = logic;

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 sm:pt-40 hidden lg:flex">
      {/* Backdrop */}
      <div 
        className="cursor-pointer fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header / Input */}
        <div className="flex items-center border-b border-slate-100 px-4 py-4 relative">
          <Search className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-lg text-slate-900 placeholder-slate-400 focus:outline-none min-w-0"
            placeholder="Buscar contactos, propiedades, tareas o ir a..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {isSyncing && <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />}
            <div className="pt-0.5">
              <HelpButton title="Búsqueda y Herramientas" path="/docs/manuales/manual_busqueda.md" />
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">
          
          {isLoading && (
            <div className="py-14 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
              <p className="text-sm font-medium">Buscando resultados...</p>
            </div>
          )}

          {!isLoading && (
            <>
              {/* Static Options */}
              {filteredStaticOptions.length > 0 && (
                <div className="mb-4">
                  <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Acciones Rápidas
                  </h3>
                  <ul className="space-y-1">
                    {filteredStaticOptions.map(option => {
                      const Icon = IconMap[option.icon] || Search;
                      return (
                        <li key={option.id}>
                          <button
                            onClick={() => handleSelectStatic(option)}
                            className="w-full flex items-center px-3 py-2.5 rounded-xl hover:bg-slate-50 focus:bg-slate-50 text-left transition-colors group cursor-pointer"
                          >
                            <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mr-3 group-hover:bg-white group-hover:shadow-sm">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{option.title}</p>
                              <p className="text-xs text-slate-500">{option.subtitle}</p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Dynamic Results */}
              {data && (
                <>
                  {['Contactos', 'Propiedades', 'Tareas'].map((groupLabel) => {
                    const items = data[groupLabel.toLowerCase() as keyof typeof data] as OmniSearchResult[];
                    if (!items || items.length === 0) return null;
                    
                    const itemTypeStr = items[0]?.entityType;
                    const Icon = IconMap[itemTypeStr] || Search;

                    return (
                      <div key={groupLabel} className="mb-4">
                        <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {groupLabel}
                        </h3>
                        <ul className="space-y-1">
                          {items.map(item => (
                            <li key={item.entityId}>
                              <button
                                onClick={() => handleSelectDynamic(item)}
                                className="w-full flex items-center px-3 py-2.5 rounded-xl hover:bg-slate-50 focus:bg-slate-50 text-left transition-colors group cursor-pointer"
                              >
                                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 group-hover:bg-white group-hover:shadow-sm shrink-0 overflow-hidden border border-indigo-100/50">
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                                  ) : (
                                    <Icon className="h-4 w-4" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                                  {item.subtitle && (
                                    <p className="text-xs text-slate-500 line-clamp-1">{item.subtitle}</p>
                                  )}
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                  
                  {(!data.contactos?.length && !data.propiedades?.length && !data.tareas?.length && filteredStaticOptions.length === 0) && (
                    <div className="py-14 text-center text-slate-500">
                      <p className="text-sm font-medium text-slate-900">No se encontraron resultados</p>
                      <p className="text-xs mt-1">Intenta con otros términos de búsqueda.</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}

        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-sans font-medium text-slate-700">Ctrl</kbd> + <kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-sans font-medium text-slate-700">K</kbd> para abrir</span>
            <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-sans font-medium text-slate-700">Esc</kbd> para cerrar</span>
          </div>
          <span className="font-medium text-slate-400">OmniSearch Global</span>
        </div>
      </div>
    </div>
  );
};
