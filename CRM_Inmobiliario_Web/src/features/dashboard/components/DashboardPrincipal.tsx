import React from 'react';
import { SWRConfig } from 'swr';
import { Loader2 } from 'lucide-react';
import { localStorageProvider } from '@/lib/swr';
import { usePerfil } from '../../auth/api/perfil';
import { useDashboardKpis } from '../hooks/useDashboardKpis';
import { KpiCards } from './KpiCards';
import { SeguimientoCritico } from './SeguimientoCritico';
import { EmbudoVentas } from './EmbudoVentas';

const DashboardContent: React.FC = () => {
  const { perfil } = usePerfil();
  const { data, syncing } = useDashboardKpis();

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500">
        <Loader2 className="h-10 w-10 text-blue-700 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700 uppercase tracking-widest italic">Iniciando motor de inteligencia comercial...</p>
      </div>
    );
  }

  const greeting = perfil?.nombre
    ? [perfil.nombre, perfil.apellido].filter(Boolean).join(' ')
    : 'Agente';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {/* Sincronización Overlay (UPSP Pattern) */}
      {syncing && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Resumen...</span>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Hola de nuevo, <span className="text-blue-600">{greeting}</span>.
        </h1>
        <p className="text-slate-500 font-medium">Aquí está el resumen estratégico de tu negocio hoy.</p>
      </div>

      {/* KPI Cards Grid */}
      <KpiCards data={data} syncing={syncing} />

      {/* Row 2: Seguimiento Crítico & Embudo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <SeguimientoCritico data={data} />
        <EmbudoVentas data={data} syncing={syncing} />
      </div>
    </div>
  );
};

export const DashboardPrincipal: React.FC = () => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <DashboardContent />
    </SWRConfig>
  );
};
