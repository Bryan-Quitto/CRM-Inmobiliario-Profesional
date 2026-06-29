import React from 'react';
import { Loader2, Zap } from 'lucide-react';

// Secciones
import { AnaliticaHeader } from './analitica-sections/AnaliticaHeader';
import { AnaliticaProyeccion } from './analitica-sections/AnaliticaProyeccion';
import { AnaliticaEficiencia } from './analitica-sections/AnaliticaEficiencia';
import { AnaliticaActividad } from './analitica-sections/AnaliticaActividad';
import { AnaliticaModals } from './analitica-sections/AnaliticaModals';
import type { AnaliticaViewLogic } from '../hooks/useAnaliticaViewLogic';
import { HelpButton } from '../../../components/ui/HelpButton';

interface Props {
  logic: AnaliticaViewLogic;
}

export const AnaliticaViewDesktop: React.FC<Props> = ({ logic }) => {
  const { state, actions, data } = logic;

  if (data.initialLoading) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 text-blue-700 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700 uppercase tracking-widest italic text-center">Iniciando motor de inteligencia comercial...</p>
      </div>
    );
  }

  return (
    <div className="hidden lg:block space-y-10 animate-in fade-in duration-700 relative pb-20">
      {data.loadingActividad && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Inteligencia...</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-start gap-3">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Pulso del Negocio</h2>
                <div className="pt-0.5">
                  <HelpButton title="Analítica y Dashboard" path="/docs/manuales/manual_analitica.md" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Snapshot en Tiempo Real</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <AnaliticaProyeccion 
            proyeccion={data.proyeccion}
            isExpanded={state.expandedCard === 'proyeccion'}
            onToggleExpand={() => actions.setExpandedCard(state.expandedCard === 'proyeccion' ? null : 'proyeccion')}
          />

          <AnaliticaEficiencia 
            eficiencia={data.eficiencia}
            expandedCard={state.expandedCard === 'proyeccion' ? null : state.expandedCard}
            setExpandedCard={actions.setExpandedCard}
            setActiveModal={actions.setActiveModal}
          />
        </div>
      </div>

      <div className="h-px bg-slate-100"></div>

      <div className="space-y-8">
        <AnaliticaHeader 
          mesSeleccionado={state.mesSeleccionado}
          setMesSeleccionado={actions.setMesSeleccionado}
          semanaIndice={state.semanaIndice}
          setSemanaIndice={actions.setSemanaIndice}
          showMesDropdown={state.showMesDropdown}
          setShowMesDropdown={actions.setShowMesDropdown}
          semanasDelMes={state.semanasDelMes}
          formattedRange={state.formattedRange}
        />

        <AnaliticaActividad 
          actividad={data.actividad}
          loadingActividad={data.loadingActividad}
          setActiveModal={actions.setActiveModal}
        />
      </div>

      <AnaliticaModals 
        activeModal={state.activeModal}
        onClose={() => actions.setActiveModal(null)}
        actividad={data.actividad}
        eficiencia={data.eficiencia}
      />
    </div>
  );
};
