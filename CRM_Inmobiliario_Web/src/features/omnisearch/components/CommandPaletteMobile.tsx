import React, { useRef, useEffect } from 'react';
import { Search, X, Settings, Calendar, PlusSquare, User, Home, CheckCircle, Loader2, Users, Building, BarChart, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCommandPaletteLogic, type OmniSearchResult } from '../hooks/useCommandPaletteLogic';
import { HelpButton } from '../../../components/ui/HelpButton';
import { TruncatedText } from '@/components/ui/TruncatedText';

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

export const CommandPaletteMobile: React.FC<Props> = ({ logic }) => {
  const {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    data,
    isLoading,
    isSyncing,
    filteredStaticOptions,
    handleSelectStatic
  } = logic;

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col lg:hidden animate-in slide-in-from-bottom-full duration-300">
      
      {/* Header / Input */}
      <div className="flex items-center border-b border-slate-100 px-4 py-3 bg-slate-50 relative pt-[env(safe-area-inset-top,1rem)]">
        <Search className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent text-base text-slate-900 placeholder-slate-400 focus:outline-none min-w-0"
          placeholder="Buscar o ir a..."
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
            className="p-2 -mr-2 rounded-xl text-slate-500 hover:bg-slate-200 cursor-pointer touch-manipulation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Results Body */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-2 pb-[env(safe-area-inset-bottom,1rem)]">
        
        {isLoading && (
          <div className="py-14 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
            <p className="text-sm font-medium">Buscando...</p>
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
                    const content = (
                      <>
                        <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mr-3 shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <TruncatedText as="p" className="text-sm font-semibold text-slate-900 truncate">{option.title}</TruncatedText>
                          <TruncatedText as="p" className="text-xs text-slate-500 truncate">{option.subtitle}</TruncatedText>
                        </div>
                      </>
                    );
                    const className = "w-full flex items-center px-3 py-3 rounded-xl active:bg-slate-100 text-left transition-colors cursor-pointer touch-manipulation no-underline block";
                    
                    return (
                      <li key={option.id}>
                        {option.path ? (
                          <Link
                            to={option.path}
                            onClick={() => { setIsOpen(false); setQuery(''); }}
                            className={className}
                          >
                            {content}
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleSelectStatic(option)}
                            className={className}
                          >
                            {content}
                          </button>
                        )}
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
                        {items.map(item => {
                          let path = '';
                          if (item.entityType === 'Contacto') path = `/contactos/${item.entityId}`;
                          else if (item.entityType === 'Propiedad') path = `/propiedades?id=${item.entityId}`;
                          else if (item.entityType === 'Tarea') path = `/?tarea=${item.entityId}`;

                          return (
                            <li key={item.entityId}>
                              <Link
                                to={path}
                                onClick={() => { setIsOpen(false); setQuery(''); }}
                                className="w-full flex items-center px-3 py-3 rounded-xl active:bg-slate-100 text-left transition-colors cursor-pointer touch-manipulation no-underline block"
                              >
                                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 shrink-0 overflow-hidden border border-indigo-100/50">
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                                  ) : (
                                    <Icon className="h-5 w-5" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <TruncatedText as="p" className="text-sm font-semibold text-slate-900 truncate">{item.title}</TruncatedText>
                                  {item.subtitle && (
                                    <TruncatedText as="p" className="text-xs text-slate-500 truncate">{item.subtitle}</TruncatedText>
                                  )}
                                </div>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
                
                {(!data.contactos?.length && !data.propiedades?.length && !data.tareas?.length && filteredStaticOptions.length === 0) && (
                  <div className="py-14 text-center text-slate-500 px-4">
                    <p className="text-base font-semibold text-slate-900">No se encontraron resultados</p>
                    <p className="text-sm mt-1">Intenta con otros términos de búsqueda para encontrar lo que necesitas.</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
};
