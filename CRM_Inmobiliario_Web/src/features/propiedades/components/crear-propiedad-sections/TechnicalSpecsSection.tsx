import { useFormContext, useWatch } from 'react-hook-form';
import { Ruler, LandPlot, Box, Bed, Bath, Droplet, CarFront, Clock } from 'lucide-react';
import type { CrearPropiedadDTO } from '../../api/crearPropiedad';

interface Props {
  isSuccess: boolean;
  missedFields: string[];
}

export const TechnicalSpecsSection = ({ isSuccess, missedFields }: Props) => {
  const { register, control } = useFormContext<CrearPropiedadDTO>();
  const tipoSeleccionado = useWatch({ control, name: 'tipoPropiedad' });

  return (
    <div className="md:col-span-6 grid grid-cols-1 md:grid-cols-6 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
      
      {/* Área Total */}
      <div className="md:col-span-2 space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
          Área Total (m²) {missedFields.includes('areaTotal') && <span className="text-amber-500 font-black ml-1">(Vacío)</span>}
        </label>
        <div className="relative">
          <Ruler className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            {...register('areaTotal', { required: 'Requerido', min: 1 })}
            type="number" 
            disabled={isSuccess}
            step="any"
            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-50 ${missedFields.includes('areaTotal') ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/20' : 'border-slate-200'}`}
          />
        </div>
      </div>

      {/* Área Terreno */}
      {['Casa', 'Terreno', 'Galpón', 'Bodega', 'Local Comercial', 'Hotel'].includes(tipoSeleccionado) && (
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Área Terreno (m²) {missedFields.includes('areaTerreno') && <span className="text-amber-500 font-black ml-1">(Vacío)</span>}
          </label>
          <div className="relative">
            <LandPlot className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              {...register('areaTerreno')}
              type="number" 
              disabled={isSuccess}
              step="any"
              className={`w-full pl-10 px-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-50 ${missedFields.includes('areaTerreno') ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/20' : 'border-slate-200'}`}
            />
          </div>
        </div>
      )}

      {/* Área Construcción */}
      {['Casa', 'Galpón', 'Bodega', 'Hotel'].includes(tipoSeleccionado) && (
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Área Cubierta (m²) {missedFields.includes('areaConstruccion') && <span className="text-amber-500 font-black ml-1">(Vacío)</span>}
          </label>
          <div className="relative">
            <Box className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              {...register('areaConstruccion')}
              type="number" 
              disabled={isSuccess}
              step="any"
              className={`w-full pl-10 px-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-50 ${missedFields.includes('areaConstruccion') ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/20' : 'border-slate-200'}`}
            />
          </div>
        </div>
      )}

      {/* Habitaciones */}
      {['Casa', 'Departamento', 'Suite', 'Hotel'].includes(tipoSeleccionado) && (
        <div className="md:col-span-2 space-y-2 animate-in fade-in duration-300">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Habitaciones {missedFields.includes('habitaciones') && <span className="text-amber-500 font-black ml-1">(Vacío)</span>}
          </label>
          <div className="relative">
            <Bed className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              {...register('habitaciones', { min: 0 })}
              type="number" 
              disabled={isSuccess}
              className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-50 ${missedFields.includes('habitaciones') ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/20' : 'border-slate-200'}`}
            />
          </div>
        </div>
      )}

      {/* Baños */}
      {tipoSeleccionado !== 'Terreno' && (
        <div className="md:col-span-2 space-y-2 animate-in fade-in duration-300">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Baños {missedFields.includes('banos') && <span className="text-amber-500 font-black ml-1">(Vacío)</span>}
          </label>
          <div className="relative">
            <Bath className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              {...register('banos', { min: 0 })}
              type="number" 
              disabled={isSuccess}
              step="0.5"
              className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-50 ${missedFields.includes('banos') ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/20' : 'border-slate-200'}`}
            />
          </div>
        </div>
      )}
      
      {/* Medios Baños */}
      {tipoSeleccionado !== 'Terreno' && (
        <div className="md:col-span-2 space-y-2 animate-in fade-in duration-300">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Medios Baños {missedFields.includes('mediosBanos') && <span className="text-amber-500 font-black ml-1">(Vacío)</span>}
          </label>
          <div className="relative">
            <Droplet className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              {...register('mediosBanos')}
              type="number" 
              disabled={isSuccess}
              className={`w-full pl-10 px-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-50 ${missedFields.includes('mediosBanos') ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/20' : 'border-slate-200'}`}
            />
          </div>
        </div>
      )}

      {/* Estacionamientos */}
      {tipoSeleccionado !== 'Terreno' && (
        <div className="md:col-span-2 space-y-2 animate-in fade-in duration-300">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Parqueaderos {missedFields.includes('estacionamientos') && <span className="text-amber-500 font-black ml-1">(Vacío)</span>}
          </label>
          <div className="relative">
            <CarFront className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              {...register('estacionamientos')}
              type="number" 
              disabled={isSuccess}
              className={`w-full pl-10 px-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-50 ${missedFields.includes('estacionamientos') ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/20' : 'border-slate-200'}`}
            />
          </div>
        </div>
      )}

      {/* Antigüedad */}
      {tipoSeleccionado !== 'Terreno' && (
        <div className="md:col-span-2 space-y-2 animate-in fade-in duration-300">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Antigüedad (Años) {missedFields.includes('aniosAntiguedad') && <span className="text-amber-500 font-black ml-1">(Vacío)</span>}
          </label>
          <div className="relative">
            <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              {...register('aniosAntiguedad')}
              type="number" 
              disabled={isSuccess}
              className={`w-full pl-10 px-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all disabled:opacity-50 ${missedFields.includes('aniosAntiguedad') ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/20' : 'border-slate-200'}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
