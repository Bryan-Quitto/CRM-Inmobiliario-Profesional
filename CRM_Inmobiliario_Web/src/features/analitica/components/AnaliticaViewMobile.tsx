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

export const AnaliticaViewMobile: React.FC<Props> = ({ logic }) => {
  const { state, actions, data } = logic;

  if (data.initialLoading) {
    return (
      <div className="flex lg:hidden flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 text-blue-700 animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-700 uppercase tracking-widest italic text-center px-2">
          Iniciando motor de inteligencia comercial...
        </p>
      </div>
    );
  }

  return (
    <div className="block lg:hidden space-y-3 animate-in fade-in duration-700 relative pb-24">
      {data.loadingActividad && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300 w-[90%] max-w-sm">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white px-2 py-2 rounded-full shadow-2xl flex items-center justify-center gap-2 border border-white/10">
            <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] truncate">Sincronizando...</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-md">
            <Zap className="h-3 w-3" />
          </div>
          <div>
            <div className="flex items-start gap-2">
              <h2 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tight">Pulso del Negocio</h2>
              <div className="pt-0.5 shrink-0">
                <HelpButton title="Analítica y Panel de Control" path="/docs/manuales/manual_analitica.md" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">En Tiempo Real</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
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

      <div className="h-px bg-slate-100 w-full"></div>

      <div className="space-y-3">
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

        <div className="overflow-x-auto hide-scrollbar pb-4 snap-x snap-mandatory">
          <AnaliticaActividad 
            actividad={data.actividad}
            loadingActividad={data.loadingActividad}
            setActiveModal={actions.setActiveModal}
          />
        </div>
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
