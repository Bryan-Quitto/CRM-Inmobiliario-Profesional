import { useFormContext, useWatch } from 'react-hook-form';
import { Ruler, LandPlot, Box, Bed, Bath, Droplet, CarFront, Clock } from 'lucide-react';
import type { CrearPropiedadDTO } from '../../api/crearPropiedad';
import { Controller } from 'react-hook-form';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';

interface Props {
  isSuccess: boolean;
  missedFields: string[];
}

export const TechnicalSpecsSection = ({ isSuccess, missedFields }: Props) => {
  const { control, formState: { errors } } = useFormContext<CrearPropiedadDTO>();
  const tipoSeleccionado = useWatch({ control, name: 'tipoPropiedad' });




  return (
    <div className="md:col-span-6 grid grid-cols-1 md:grid-cols-6 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
      
      {/* Área Total */}
      <div className="md:col-span-2 space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
          Área Total (m²) {missedFields.includes('areaTotal') && <span className="text-amber-500 font-black ml-1">(Vacío)</span>}
        </label>
        <Controller
          name="areaTotal"
          control={control}
          rules={{ required: 'Requerido', min: 1 }}
          render={({ field }) => (
            <FormattedNumberInput
              {...field}
              icon={<Ruler className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />}
              suffixIcon={<span className="text-slate-400 text-xs font-bold mr-1">m²</span>}
              disabled={isSuccess}
              error={errors.areaTotal?.message}
              containerClassName={missedFields.includes('areaTotal') ? 'rounded-2xl ring-2 ring-amber-100 bg-amber-50/20' : ''}
              placeholder="Ej. 120,50"
            />
          )}
        />
      </div>

      {/* Área Terreno */}
      {['Casa', 'Terreno', 'Galpón', 'Bodega', 'Local Comercial', 'Hotel'].includes(tipoSeleccionado) && (
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Área Terreno (m²) {missedFields.includes('areaTerreno') && <span className="text-amber-500 font-black ml-1">(Vacío)</span>}
          </label>
          <Controller
            name="areaTerreno"
            control={control}
            render={({ field }) => (
              <FormattedNumberInput
                {...field}
                icon={<LandPlot className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />}
                suffixIcon={<span className="text-slate-400 text-xs font-bold mr-1">m²</span>}
                disabled={isSuccess}
                error={errors.areaTerreno?.message}
                containerClassName={missedFields.includes('areaTerreno') ? 'rounded-2xl ring-2 ring-amber-100 bg-amber-50/20' : ''}
                placeholder="Ej. 250,00"
              />
            )}
          />
        </div>
      )}

      {/* Área Construcción */}
      {['Casa', 'Galpón', 'Bodega', 'Hotel'].includes(tipoSeleccionado) && (
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Área Cubierta (m²) {missedFields.includes('areaConstruccion') && <span className="text-amber-500 font-black ml-1">(Vacío)</span>}
          </label>
          <Controller
            name="areaConstruccion"
            control={control}
            render={({ field }) => (
              <FormattedNumberInput
                {...field}
                icon={<Box className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />}
                suffixIcon={<span className="text-slate-400 text-xs font-bold mr-1">m²</span>}
                disabled={isSuccess}
                error={errors.areaConstruccion?.message}
                containerClassName={missedFields.includes('areaConstruccion') ? 'rounded-2xl ring-2 ring-amber-100 bg-amber-50/20' : ''}
                placeholder="Ej. 180,50"
              />
            )}
          />
        </div>
      )}

      {/* Habitaciones */}
      {['Casa', 'Departamento', 'Suite', 'Hotel'].includes(tipoSeleccionado) && (
        <div className="md:col-span-2 space-y-2 animate-in fade-in duration-300">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Habitaciones {missedFields.includes('habitaciones') && <span className="text-amber-500 font-black ml-1">(Vacío)</span>}
          </label>
          <Controller
            name="habitaciones"
            control={control}
            rules={{ min: 0 }}
            render={({ field }) => (
              <FormattedNumberInput
                {...field}
                icon={<Bed className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />}
                disabled={isSuccess}
                error={errors.habitaciones?.message}
                containerClassName={missedFields.includes('habitaciones') ? 'rounded-2xl ring-2 ring-amber-100 bg-amber-50/20' : ''}
              />
            )}
          />
        </div>
      )}

      {/* Baños */}
      {tipoSeleccionado !== 'Terreno' && (
        <div className="md:col-span-2 space-y-2 animate-in fade-in duration-300">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Baños {missedFields.includes('banos') && <span className="text-amber-500 font-black ml-1">(Vacío)</span>}
          </label>
          <Controller
            name="banos"
            control={control}
            rules={{ min: 0 }}
            render={({ field }) => (
              <FormattedNumberInput
                {...field}
                icon={<Bath className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />}
                disabled={isSuccess}
                error={errors.banos?.message}
                containerClassName={missedFields.includes('banos') ? 'rounded-2xl ring-2 ring-amber-100 bg-amber-50/20' : ''}
              />
            )}
          />
        </div>
      )}
      
      {/* Medios Baños */}
      {tipoSeleccionado !== 'Terreno' && (
        <div className="md:col-span-2 space-y-2 animate-in fade-in duration-300">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Medios Baños {missedFields.includes('mediosBanos') && <span className="text-amber-500 font-black ml-1">(Vacío)</span>}
          </label>
          <Controller
            name="mediosBanos"
            control={control}
            render={({ field }) => (
              <FormattedNumberInput
                {...field}
                icon={<Droplet className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />}
                disabled={isSuccess}
                error={errors.mediosBanos?.message}
                containerClassName={missedFields.includes('mediosBanos') ? 'rounded-2xl ring-2 ring-amber-100 bg-amber-50/20' : ''}
              />
            )}
          />
        </div>
      )}

      {/* Estacionamientos */}
      {tipoSeleccionado !== 'Terreno' && (
        <div className="md:col-span-2 space-y-2 animate-in fade-in duration-300">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Parqueaderos {missedFields.includes('estacionamientos') && <span className="text-amber-500 font-black ml-1">(Vacío)</span>}
          </label>
          <Controller
            name="estacionamientos"
            control={control}
            render={({ field }) => (
              <FormattedNumberInput
                {...field}
                icon={<CarFront className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />}
                disabled={isSuccess}
                error={errors.estacionamientos?.message}
                containerClassName={missedFields.includes('estacionamientos') ? 'rounded-2xl ring-2 ring-amber-100 bg-amber-50/20' : ''}
              />
            )}
          />
        </div>
      )}

      {/* Antigüedad */}
      {tipoSeleccionado !== 'Terreno' && (
        <div className="md:col-span-2 space-y-2 animate-in fade-in duration-300">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Antigüedad (Años) {missedFields.includes('aniosAntiguedad') && <span className="text-amber-500 font-black ml-1">(Vacío)</span>}
          </label>
          <Controller
            name="aniosAntiguedad"
            control={control}
            render={({ field }) => (
              <FormattedNumberInput
                {...field}
                icon={<Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />}
                disabled={isSuccess}
                error={errors.aniosAntiguedad?.message}
                containerClassName={missedFields.includes('aniosAntiguedad') ? 'rounded-2xl ring-2 ring-amber-100 bg-amber-50/20' : ''}
              />
            )}
          />
        </div>
      )}
    </div>
  );
};
