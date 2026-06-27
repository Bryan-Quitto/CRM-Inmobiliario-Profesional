import React from 'react';
import { Building2, Plus, Loader2, ChevronRight } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import type { ConfiguracionAgenciasLogic } from '../hooks/useConfiguracionAgenciasLogic';
import { AgenciaModal } from './AgenciaModal';

interface Props {
  logic: ConfiguracionAgenciasLogic;
}

export const ConfiguracionAgenciasMobile: React.FC<Props> = ({ logic }) => {
  const {
    isLoading,
    searchTerm,
    setSearchTerm,
    handleOpenCreate,
    handleOpenEdit,
    filteredAgencias,
  } = logic;

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] pb-24 animate-in fade-in duration-300">
      <div className="px-4 pt-6 pb-4 bg-white border-b border-slate-100 sticky top-0 z-10">
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2 mb-1 break-words">
          <Building2 className="text-indigo-600 w-6 h-6 shrink-0" />
          Agencias
        </h2>
        <p className="text-sm text-slate-500 font-medium mb-4">Gestiona la información corporativa.</p>
        
        <div className="w-full">
          <SearchInput
            placeholder="Buscar agencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-2.5 bg-slate-50 border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium"
          />
        </div>
      </div>

      <div className="flex-1 p-4 bg-slate-50">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredAgencias.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">No se encontraron agencias.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredAgencias.map((agencia) => (
              <div 
                key={agencia.id} 
                onClick={() => handleOpenEdit(agencia)}
                className="bg-white p-4 rounded-2xl border border-slate-200 active:bg-slate-50 transition-colors flex flex-col gap-2 shadow-sm"
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-base font-black text-slate-800 tracking-tight break-words flex-1 min-w-0">{agencia.nombre}</h3>
                  <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 shrink-0">
                    <ChevronRight size={16} />
                  </div>
                </div>
                
                <div className="space-y-1">
                  {agencia.telefonoCorporativo && (
                    <p className="text-xs text-slate-500 font-medium break-all">
                      <strong className="text-slate-700">Tel:</strong> {agencia.telefonoCorporativo}
                    </p>
                  )}
                  {agencia.emailCorporativo && (
                    <p className="text-xs text-slate-500 font-medium break-all">
                      <strong className="text-slate-700">Email:</strong> {agencia.emailCorporativo}
                    </p>
                  )}
                </div>

                {agencia.contextoCorporativoIA && (
                  <div className="mt-2 p-2 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600 mb-0.5 break-words">Contexto IA Activo</p>
                    <p className="text-xs text-slate-600 line-clamp-1 italic">{agencia.contextoCorporativoIA}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-20 right-4 z-20">
        <button
          onClick={handleOpenCreate}
          className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-600/30 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      <AgenciaModal logic={logic} />
    </div>
  );
};
