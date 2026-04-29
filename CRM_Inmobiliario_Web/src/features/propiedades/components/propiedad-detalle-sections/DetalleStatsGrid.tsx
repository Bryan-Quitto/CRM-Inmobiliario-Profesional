import { Maximize, MapPin, Bed, Bath, Car, CalendarDays, Handshake, Clock } from 'lucide-react';
import type { Propiedad } from '../../types';

interface DetalleStatsGridProps {
  propiedad: Propiedad;
  formatDate: (dateString: string) => string;
}

export const DetalleStatsGrid = ({ propiedad, formatDate }: DetalleStatsGridProps) => {
  const stats = [
    {
      label: 'Área Construcción',
      value: propiedad.areaConstruccion ? `${propiedad.areaConstruccion} m²` : `${propiedad.areaTotal} m²`,
      icon: Maximize,
      color: 'amber',
      show: true
    },
    {
      label: 'Área Terreno',
      value: `${propiedad.areaTerreno} m²`,
      icon: MapPin,
      color: 'orange',
      show: !!propiedad.areaTerreno && propiedad.areaTerreno > 0
    },
    {
      label: 'Habitaciones',
      value: propiedad.habitaciones,
      icon: Bed,
      color: 'blue',
      show: ['Casa', 'Departamento', 'Suite', 'Hotel'].includes(propiedad.tipoPropiedad)
    },
    {
      label: 'Baños',
      value: propiedad.banos + (propiedad.mediosBanos ? ` y ${propiedad.mediosBanos} medios` : ''),
      icon: Bath,
      color: 'emerald',
      show: propiedad.tipoPropiedad !== 'Terreno'
    },
    {
      label: 'Parqueaderos',
      value: propiedad.estacionamientos,
      icon: Car,
      color: 'indigo',
      show: !!propiedad.estacionamientos && propiedad.estacionamientos > 0
    },
    {
      label: 'Antigüedad',
      value: `${propiedad.aniosAntiguedad} años`,
      icon: CalendarDays,
      color: 'slate',
      show: !!propiedad.aniosAntiguedad && propiedad.aniosAntiguedad >= 0
    },
    {
      label: 'Comisión',
      value: `${propiedad.porcentajeComision}%`,
      icon: Handshake,
      color: 'indigo',
      show: true
    },
    {
      label: 'Registro',
      value: formatDate(propiedad.fechaIngreso),
      icon: Clock,
      color: 'slate',
      show: true
    }
  ].filter(stat => stat.show);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-indigo-100 transition-all hover:-translate-y-1">
          <div className={`h-10 w-10 bg-${stat.color}-50 rounded-xl flex items-center justify-center text-${stat.color}-500 group-hover:scale-110 transition-transform`}>
            <stat.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-sm font-black text-slate-900 leading-tight tracking-tight mt-0.5" title={stat.value?.toString()}>
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
