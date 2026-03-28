import { useEffect, useState } from 'react';
import { 
  X, 
  Bed, 
  Bath, 
  Maximize, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Tag, 
  Info,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Building2,
  Clock
} from 'lucide-react';
import { getPropiedadById } from '../api/getPropiedadById';
import type { Propiedad } from '../types';

interface PropiedadDetalleProps {
  id: string;
  onClose: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(dateString));
};

export const PropiedadDetalle = ({ id, onClose }: PropiedadDetalleProps) => {
  const [propiedad, setPropiedad] = useState<Propiedad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetalles = async () => {
      try {
        setLoading(true);
        const data = await getPropiedadById(id);
        setPropiedad(data);
      } catch (err) {
        console.error('Error al cargar detalles de la propiedad:', err);
        setError('No se pudo cargar la información de la propiedad.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetalles();
  }, [id]);

  const getStatusBadgeStyles = (estado: string) => {
    switch (estado) {
      case 'Disponible': return 'bg-emerald-500 text-white';
      case 'Reservada': return 'bg-amber-500 text-white';
      case 'Vendida': return 'bg-slate-700 text-white';
      case 'Alquilada': return 'bg-blue-600 text-white';
      default: return 'bg-rose-500 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full md:w-[700px] lg:w-[850px] bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500 ease-out">
        {/* Header Fijo */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Detalles del Inmueble</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {id.split('-')[0]}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {propiedad && (
              <>
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${getStatusBadgeStyles(propiedad.estadoComercial)}`}>
                  {propiedad.estadoComercial}
                </span>
                <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                  {propiedad.operacion}
                </span>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Cargando información...</p>
          </div>
        ) : error || !propiedad ? (
          <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center p-8 text-center">
            <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
              <Info className="h-10 w-10 text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">¡Ups! Algo salió mal</h3>
            <p className="text-slate-500 max-w-xs">{error || 'No se encontró la propiedad solicitada.'}</p>
            <button 
              onClick={onClose}
              className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cerrar Panel
            </button>
          </div>
        ) : (
          <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Título y Precio */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-widest">
                    {propiedad.tipoPropiedad}
                  </span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 leading-tight tracking-tight">
                  {propiedad.titulo}
                </h1>
                <div className="flex items-center gap-2 text-slate-500 mt-4">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-bold italic">{propiedad.direccion}</span>
                </div>
                <div className="text-slate-400 text-sm font-medium ml-7">
                  {propiedad.sector}, {propiedad.ciudad}
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-end min-w-[200px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio de Lista</p>
                <p className="text-4xl font-black text-blue-600 tracking-tight">
                  {formatCurrency(propiedad.precio)}
                </p>
              </div>
            </div>

            {/* Grid de Características */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Habitaciones', value: propiedad.habitaciones, icon: Bed, color: 'blue' },
                { label: 'Baños', value: propiedad.banos, icon: Bath, color: 'emerald' },
                { label: 'Área Total', value: `${propiedad.areaTotal} m²`, icon: Maximize, color: 'amber' },
                { label: 'Ingreso', value: formatDate(propiedad.fechaIngreso), icon: Clock, color: 'slate' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-blue-100 transition-all">
                  <div className={`h-10 w-10 bg-${stat.color}-50 rounded-xl flex items-center justify-center text-${stat.color}-600 group-hover:bg-${stat.color}-600 group-hover:text-white transition-all`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-lg font-black text-slate-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Descripción */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Descripción General</h3>
              </div>
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Building2 className="h-16 w-16 text-slate-900" />
                </div>
                <p className="text-slate-600 leading-relaxed text-lg font-medium whitespace-pre-line relative z-10">
                  {propiedad.descripcion}
                </p>
              </div>
            </div>

            {/* Galería Placeholder */}
            <div className="space-y-4 pb-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight text-nowrap">Galería de Imágenes</h3>
                </div>
                <div className="h-px w-full bg-slate-100 ml-6 hidden md:block"></div>
              </div>
              
              <div className="relative group">
                <div className="border-4 border-dashed border-slate-100 bg-slate-50/50 rounded-[40px] h-80 flex flex-col items-center justify-center gap-4 transition-all group-hover:bg-blue-50/30 group-hover:border-blue-100">
                  <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-xl shadow-slate-200/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <ImageIcon className="h-10 w-10 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-900 font-black text-lg tracking-tight">Zona de carga de galería</p>
                    <p className="text-slate-400 font-bold text-sm italic mt-1">(Próximamente disponible)</p>
                  </div>
                  
                  {/* Floating decorative dots */}
                  <div className="absolute top-8 left-8 h-2 w-2 bg-slate-200 rounded-full"></div>
                  <div className="absolute bottom-8 right-8 h-3 w-3 bg-blue-100 rounded-full"></div>
                  <div className="absolute top-12 right-12 h-1.5 w-1.5 bg-slate-200 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
