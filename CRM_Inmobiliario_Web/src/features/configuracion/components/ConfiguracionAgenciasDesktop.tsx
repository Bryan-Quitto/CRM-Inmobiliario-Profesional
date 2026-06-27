import React from 'react';
import { Building2, Plus, Loader2, Pencil, Search } from 'lucide-react';
import type { ConfiguracionAgenciasLogic } from '../hooks/useConfiguracionAgenciasLogic';
import { AgenciaModal } from './AgenciaModal';

interface Props {
  logic: ConfiguracionAgenciasLogic;
}

export const ConfiguracionAgenciasDesktop: React.FC<Props> = ({ logic }) => {
  const {
    isLoading,
    searchTerm,
    setSearchTerm,
    handleOpenCreate,
    handleOpenEdit,
    filteredAgencias,
  } = logic;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="text-indigo-600" />
            Directorio de Agencias
          </h2>
          <p className="text-slate-500 font-medium">Gestiona la información corporativa y el contexto para IA de tus agencias.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <Plus size={18} />
          Nueva Agencia
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar agencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredAgencias.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No se encontraron agencias.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgencias.map((agencia) => (
              <div key={agencia.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all group flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">{agencia.nombre}</h3>
                  {agencia.telefonoCorporativo && <p className="text-xs text-slate-500 font-medium mb-1"><strong className="text-slate-700">Tel:</strong> {agencia.telefonoCorporativo}</p>}
                  {agencia.emailCorporativo && <p className="text-xs text-slate-500 font-medium mb-1"><strong className="text-slate-700">Email:</strong> {agencia.emailCorporativo}</p>}
                  {agencia.contextoCorporativoIA && (
                    <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">Contexto IA Activo</p>
                      <p className="text-xs text-slate-600 line-clamp-2 italic">{agencia.contextoCorporativoIA}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleOpenEdit(agencia)}
                  className="mt-4 w-full bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 hover:text-indigo-600 transition-all cursor-pointer"
                >
                  <Pencil size={14} />
                  Editar Perfil
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AgenciaModal logic={logic} />
    </div>
  );
};
