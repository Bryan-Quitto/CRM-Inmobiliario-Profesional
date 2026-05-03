import { MapPin, Handshake } from 'lucide-react';
import type { Propiedad } from '../../types';

interface DetalleHeroInfoProps {
  propiedad: Propiedad;
  formatCurrency: (amount: number) => string;
}

export const DetalleHeroInfo = ({ propiedad, formatCurrency }: DetalleHeroInfoProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-widest">
            {propiedad.tipoPropiedad}
          </span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${propiedad.operacion === 'Venta' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
            {propiedad.operacion}
          </span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1 ${
            propiedad.esCaptacionPropia && propiedad.permissions?.canEditMasterData 
              ? 'bg-indigo-600 text-white' 
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}>
            <Handshake className="h-3 w-3" /> 
            {propiedad.esCaptacionPropia 
              ? (propiedad.permissions?.canEditMasterData ? 'Captación Propia' : `Captación de ${propiedad.agenteNombre}`)
              : (propiedad.agenteNombre === 'Agente Anónimo' ? 'Agente Anónimo' : `Captación: ${propiedad.agenteNombre}`)
            }
          </span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 contactoing-tight tracking-tight">{propiedad.titulo}</h1>
        <div className="flex items-start gap-3 text-slate-500 mt-4">
          <MapPin className="h-6 w-6 text-indigo-600 mt-1 shrink-0" />
          <div>
            <p className="text-lg font-bold italic contactoing-tight text-slate-700">{propiedad.direccion}</p>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{propiedad.sector}, {propiedad.ciudad}</p>
          </div>
        </div>
      </div>
      <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex flex-col items-end min-w-[200px]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio de Lista</p>
        <p className="text-4xl font-black text-indigo-600 tracking-tight">{formatCurrency(propiedad.precio)}</p>
      </div>
    </div>
  );
};
