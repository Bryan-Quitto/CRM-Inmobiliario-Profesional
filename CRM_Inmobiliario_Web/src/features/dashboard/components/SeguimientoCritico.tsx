import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronDown, ChevronRight, User } from 'lucide-react';
import type { DashboardKpis, ContactoDashboardItem } from '../types';

interface SeguimientoCriticoProps {
  data: DashboardKpis;
}

const ContactoAvatar = ({ nombre, apellido }: { nombre: string, apellido: string }) => {
  const iniciales = [nombre?.[0], apellido?.[0]].filter(Boolean).join('').toUpperCase();
  return (
    <div className="h-8 w-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 border border-blue-200">
      {iniciales || <User className="h-3 w-3" />}
    </div>
  );
};

export const SeguimientoCritico: React.FC<SeguimientoCriticoProps> = ({ data }) => {
  const navigate = useNavigate();
  const [isSeguimientoOpen, setIsSeguimientoOpen] = useState(false);

  return (
    <div className="lg:col-span-4 bg-rose-50 border-2 border-rose-100 rounded-[32px] overflow-hidden group shadow-sm hover:shadow-md transition-all">
      <div 
        className="p-8 relative cursor-pointer"
        onClick={() => setIsSeguimientoOpen(!isSeguimientoOpen)}
      >
        <Users className="absolute -right-4 -bottom-4 h-24 w-24 text-rose-500/10 group-hover:scale-110 transition-transform" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">Seguimiento Crítico</p>
            <ChevronDown className={`h-4 w-4 text-rose-400 transition-transform duration-300 ${isSeguimientoOpen ? 'rotate-180' : ''}`} />
          </div>
          <h3 className="text-5xl font-black text-rose-600 tracking-tighter">{data.seguimientoRequerido}</h3>
          <p className="text-[11px] font-bold text-rose-500/70 mt-2">Contactos nuevos con interés Alto/Medio</p>
        </div>
      </div>

      {isSeguimientoOpen && (
        <div className="px-4 pb-6 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-white/50 backdrop-blur-sm rounded-[24px] border border-rose-200/50 overflow-hidden">
            {data.contactosSeguimiento.length === 0 ? (
              <p className="text-center py-6 text-[10px] font-bold text-rose-400 uppercase italic">Sin pendientes críticos</p>
            ) : (
              <div className="divide-y divide-rose-100">
                {data.contactosSeguimiento.map((contacto: ContactoDashboardItem) => (
                  <div 
                    key={contacto.id}
                    onClick={() => navigate(`/contactos/${contacto.id}`)}
                    className="p-4 hover:bg-white transition-all flex items-center gap-3 group/item cursor-pointer"
                  >
                    <ContactoAvatar nombre={contacto.nombre} apellido={contacto.apellido} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-black text-slate-900 truncate uppercase tracking-tight">
                        {[contacto.nombre, contacto.apellido].filter(Boolean).join(' ')}
                      </p>
                      <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">
                        {contacto.etapaEmbudo}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-rose-300 group-hover/item:translate-x-1 transition-transform" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
