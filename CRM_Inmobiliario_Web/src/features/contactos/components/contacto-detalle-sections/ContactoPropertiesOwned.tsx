import { Home, ExternalLink, Calendar } from 'lucide-react';
import type { Contacto } from '../../types';

interface ContactoPropertiesOwnedProps {
  contacto: Contacto;
  onNavigate: (id: string) => void;
}

export const ContactoPropertiesOwned = ({ contacto, onNavigate }: ContactoPropertiesOwnedProps) => {
  const propiedades = contacto.propiedadesCaptadas || [];

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString)).toUpperCase();
  };

  if (propiedades.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center space-y-4">
        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
          <Home className="h-8 w-8 text-slate-300" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Sin propiedades captadas</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest contactoing-relaxed">
            Este propietario aún no tiene inmuebles registrados a su nombre.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Home className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Propiedades Captadas</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inmuebles bajo su autoría</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-wider shadow-sm">
          {propiedades.length} Inmuebles
        </span>
      </div>

      <div className="divide-y divide-slate-50">
        {propiedades.map((prop) => (
          <div 
            key={prop.id}
            className="p-5 hover:bg-slate-50 transition-colors group relative"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase tracking-wider border border-blue-100">
                    {prop.tipoPropiedad}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                    prop.estadoComercial === 'Disponible' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {prop.estadoComercial}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 uppercase tracking-tight">
                  {prop.titulo}
                </h4>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-blue-600">
                    ${prop.precio.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="h-3 w-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {formatDate(prop.fechaIngreso)}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onNavigate(`/propiedades?id=${prop.id}`)}
                className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shadow-sm cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
