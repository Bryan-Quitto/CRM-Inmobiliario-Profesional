import React, { useState } from 'react';
import { SWRConfig } from 'swr';
import { Loader2, Zap } from 'lucide-react';
import { localStorageProvider } from '../../../lib/swr';

// Hooks
import { useAnaliticaState } from '../hooks/useAnaliticaState';
import { useAnaliticaData } from '../hooks/useAnaliticaData';

// Secciones
import { AnaliticaHeader } from './analitica-sections/AnaliticaHeader';
import { AnaliticaProyeccion } from './analitica-sections/AnaliticaProyeccion';
import { AnaliticaEficiencia } from './analitica-sections/AnaliticaEficiencia';
import { AnaliticaActividad } from './analitica-sections/AnaliticaActividad';
import { AnaliticaModals } from './analitica-sections/AnaliticaModals';

const AnaliticaContent: React.FC = () => {
  const {
    mesSeleccionado,
    setMesSeleccionado,
    semanaIndice,
    setSemanaIndice,
    showMesDropdown,
    setShowMesDropdown,
    semanasDelMes,
    rangoActual
  } = useAnaliticaState();

  const {
    proyeccion,
    eficiencia,
    actividad,
    loadingActividad,
    initialLoading
  } = useAnaliticaData(rangoActual);

  const [expandedCard, setExpandedCard] = useState<'proyeccion' | 'velocidad' | 'tasa' | null>(null);
  const [activeModal, setActiveModal] = useState<'visitas' | 'cierres' | 'ofertas' | 'captaciones' | 'auditoria-velocidad' | null>(null);

  const formattedRange = `${rangoActual.inicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${rangoActual.fin.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 text-blue-700 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700 uppercase tracking-widest italic text-center">Iniciando motor de inteligencia comercial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 relative pb-20">
      {loadingActividad && (
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
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Pulso del Negocio</h2>
              <div className="flex items-center gap-2">
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
            proyeccion={proyeccion}
            isExpanded={expandedCard === 'proyeccion'}
            onToggleExpand={() => setExpandedCard(expandedCard === 'proyeccion' ? null : 'proyeccion')}
          />

          <AnaliticaEficiencia 
            eficiencia={eficiencia}
            expandedCard={expandedCard === 'proyeccion' ? null : expandedCard}
            setExpandedCard={setExpandedCard}
            setActiveModal={setActiveModal}
          />
        </div>
      </div>

      <div className="h-px bg-slate-100"></div>

      <div className="space-y-8">
        <AnaliticaHeader 
          mesSeleccionado={mesSeleccionado}
          setMesSeleccionado={setMesSeleccionado}
          semanaIndice={semanaIndice}
          setSemanaIndice={setSemanaIndice}
          showMesDropdown={showMesDropdown}
          setShowMesDropdown={setShowMesDropdown}
          semanasDelMes={semanasDelMes}
          formattedRange={formattedRange}
        />

        <AnaliticaActividad 
          actividad={actividad}
          loadingActividad={loadingActividad}
          setActiveModal={setActiveModal}
        />
      </div>

      <AnaliticaModals 
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        actividad={actividad}
        eficiencia={eficiencia}
      />
    </div>
  );
};

export const AnaliticaView: React.FC = () => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <AnaliticaContent />
    </SWRConfig>
  );
};
