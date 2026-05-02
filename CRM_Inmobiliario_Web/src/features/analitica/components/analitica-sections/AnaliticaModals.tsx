import React from 'react';
import { X, Calendar, ArrowRight, Clock, CheckCircle2, Handshake, FileText, Target } from 'lucide-react';
import type { 
  ActividadAnalitica, 
  EficienciaAnalitica,
  KpiVisita,
  KpiCierre,
  KpiOferta,
  KpiCaptacion,
  DetalleCierreEficiencia
} from '../../types';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, title, icon, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
              {icon}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalles del Período</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600 shadow-sm border border-transparent hover:border-slate-100 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

interface AnaliticaModalsProps {
  activeModal: 'visitas' | 'cierres' | 'ofertas' | 'captaciones' | 'auditoria-velocidad' | null;
  onClose: () => void;
  actividad?: ActividadAnalitica;
  eficiencia?: EficienciaAnalitica;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

export const AnaliticaModals = ({
  activeModal,
  onClose,
  actividad,
  eficiencia
}: AnaliticaModalsProps) => {
  return (
    <>
      <DetailModal 
        isOpen={activeModal === 'visitas'} 
        onClose={onClose}
        title="Detalles de Visitas"
        icon={<CheckCircle2 />}
      >
        <div className="space-y-4">
          {actividad?.detalles?.visitas?.map((v: KpiVisita) => (
            <div key={v.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:bg-white hover:border-emerald-200 transition-all group">
              <div className="flex-1">
                <h4 className="text-sm font-black text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">{v.titulo}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><Calendar size={12} /> {v.fecha}</span>
                  {v.contacto && <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Contacto: {v.contacto}</span>}
                  {v.propiedad && <span className="text-[10px] font-bold text-slate-500">Propiedad: {v.propiedad}</span>}
                </div>
              </div>
              <div className="ml-4 h-2 w-2 rounded-full bg-emerald-400" />
            </div>
          ))}
          {(!actividad?.detalles?.visitas || actividad.detalles.visitas.length === 0) && (
            <div className="text-center py-10">
              <p className="text-slate-400 font-bold italic">No se encontraron visitas completadas en este período.</p>
            </div>
          )}
        </div>
      </DetailModal>

      <DetailModal 
        isOpen={activeModal === 'cierres'} 
        onClose={onClose}
        title="Detalles de Cierres"
        icon={<Handshake />}
      >
        <div className="space-y-4">
          {actividad?.detalles?.cierres?.map((c: KpiCierre) => (
            <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:bg-white hover:border-blue-200 transition-all group">
              <div className="flex-1">
                <h4 className="text-sm font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{c.propiedad}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><Calendar size={12} /> {c.fechaCierre}</span>
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Contacto: {c.contacto}</span>
                </div>
              </div>
              <div className="ml-4 h-2 w-2 rounded-full bg-blue-400" />
            </div>
          ))}
          {(!actividad?.detalles?.cierres || actividad.detalles.cierres.length === 0) && (
            <div className="text-center py-10">
              <p className="text-slate-400 font-bold italic">No se encontraron cierres finalizados en este período.</p>
            </div>
          )}
        </div>
      </DetailModal>

      <DetailModal 
        isOpen={activeModal === 'ofertas'} 
        onClose={onClose}
        title="Detalles de Ofertas"
        icon={<FileText />}
      >
        <div className="space-y-4">
          {actividad?.detalles?.ofertas?.map((o: KpiOferta) => (
            <div key={o.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:bg-white hover:border-indigo-200 transition-all group">
              <div className="flex-1">
                <h4 className="text-sm font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{o.propiedad}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><Calendar size={12} /> {o.fecha}</span>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Postulante: {o.contacto}</span>
                </div>
              </div>
              <div className="ml-4 h-2 w-2 rounded-full bg-indigo-400" />
            </div>
          ))}
          {(!actividad?.detalles?.ofertas || actividad.detalles.ofertas.length === 0) && (
            <div className="text-center py-10">
              <p className="text-slate-400 font-bold italic">No se encontraron ofertas activas en este período.</p>
            </div>
          )}
        </div>
      </DetailModal>

      <DetailModal 
        isOpen={activeModal === 'captaciones'} 
        onClose={onClose}
        title="Detalles de Captaciones"
        icon={<Target />}
      >
        <div className="space-y-4">
          {actividad?.detalles?.captaciones?.map((cap: KpiCaptacion) => (
            <div key={cap.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:bg-white hover:border-amber-200 transition-all group">
              <div className="flex-1">
                <h4 className="text-sm font-black text-slate-900 mb-1 group-hover:text-amber-600 transition-colors">{cap.titulo}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><Calendar size={12} /> {cap.fecha}</span>
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{formatCurrency(cap.precio)}</span>
                </div>
              </div>
              <div className="ml-4 h-2 w-2 rounded-full bg-amber-400" />
            </div>
          ))}
          {(!actividad?.detalles?.captaciones || actividad.detalles.captaciones.length === 0) && (
            <div className="text-center py-10">
              <p className="text-slate-400 font-bold italic">No se encontraron nuevas captaciones en este período.</p>
            </div>
          )}
        </div>
      </DetailModal>

      <DetailModal 
        isOpen={activeModal === 'auditoria-velocidad'} 
        onClose={onClose}
        title="Auditoría: Velocidad de Cierre"
        icon={<Clock />}
      >
        <div className="space-y-6">
          <div className="bg-indigo-50 p-6 rounded-[24px] border border-indigo-100">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Lógica de Cálculo</h4>
            <div className="flex items-center gap-4 text-indigo-900">
              <div className="text-center flex-1">
                <span className="block text-[8px] font-bold uppercase text-indigo-400">Total Días</span>
                <span className="text-xl font-black">{Math.round(eficiencia?.calculos?.detallesCierres?.reduce((acc, curr) => acc + curr.dias, 0) ?? 0)}</span>
              </div>
              <div className="h-8 w-px bg-indigo-200" />
              <div className="text-center flex-1">
                <span className="block text-[8px] font-bold uppercase text-indigo-400">Entre</span>
                <span className="text-xl font-black">{eficiencia?.calculos?.contactosConFechaCierre ?? 0} casos</span>
              </div>
              <div className="h-8 w-px bg-indigo-200" />
              <div className="text-center flex-1">
                <span className="block text-[8px] font-bold uppercase text-indigo-400">Promedio</span>
                <span className="text-xl font-black text-indigo-600">{eficiencia?.tiempoPromedioCierreDias ?? 0} d</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Casos Incluidos</h4>
             {eficiencia?.calculos?.detallesCierres?.map((d: DetalleCierreEficiencia) => (
               <div key={d.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-indigo-200 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{d.propiedad}</h5>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d.contacto}</p>
                    </div>
                    <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black">
                      {Math.round(d.dias)} días
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[7px] text-slate-400 uppercase">Creación</span>
                      <span>{d.fechaCreacion}</span>
                    </div>
                    <ArrowRight size={10} className="text-slate-300" />
                    <div className="flex flex-col">
                      <span className="text-[7px] text-slate-400 uppercase">Cierre</span>
                      <span>{d.fechaCierre}</span>
                    </div>
                    <div className="ml-auto italic text-slate-400">
                      (Δt = {Math.round(d.dias)} d)
                    </div>
                  </div>
               </div>
             ))}
             {(!eficiencia?.calculos?.detallesCierres || eficiencia.calculos.detallesCierres.length === 0) && (
               <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
                  <p className="text-slate-400 font-bold italic text-sm">No hay cierres con fecha válida para auditar.</p>
               </div>
             )}
          </div>
        </div>
      </DetailModal>
    </>
  );
};
