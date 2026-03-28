import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Home, 
  MapPin, 
  Image as ImageIcon, 
  Plus, 
  Search, 
  Filter as FilterIcon, 
  X, 
  Loader2, 
  TrendingUp, 
  Tag, 
  Building2 
} from 'lucide-react';
import { getPropiedades } from '../api/getPropiedades';
import type { Propiedad } from '../types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const SkeletonPropertyCard = () => (
  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm animate-pulse">
    <div className="h-56 bg-slate-100 w-full"></div>
    <div className="p-6 space-y-4">
      <div className="flex gap-2">
        <div className="h-5 w-20 bg-slate-50 rounded-full"></div>
        <div className="h-5 w-16 bg-slate-50 rounded-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-6 w-3/4 bg-slate-100 rounded-md"></div>
        <div className="h-4 w-1/2 bg-slate-50 rounded-md"></div>
      </div>
      <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
        <div className="h-7 w-24 bg-slate-100 rounded-md"></div>
        <div className="h-5 w-5 bg-slate-50 rounded-full"></div>
      </div>
    </div>
  </div>
);

const PropertyStats = ({ total, venta, alquiler }: { total: number, venta: number, alquiler: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-blue-100 transition-all">
      <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
        <Building2 className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Catálogo</p>
        <p className="text-2xl font-black text-slate-900">{total}</p>
      </div>
    </div>
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-emerald-100 transition-all">
      <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
        <TrendingUp className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Venta</p>
        <p className="text-2xl font-black text-slate-900">{venta}</p>
      </div>
    </div>
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-amber-100 transition-all">
      <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
        <Tag className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En Alquiler</p>
        <p className="text-2xl font-black text-slate-900">{alquiler}</p>
      </div>
    </div>
  </div>
);

export const PropiedadesList = () => {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPropiedades = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPropiedades();
      setPropiedades(data);
    } catch (err) {
      console.error('Error al cargar propiedades:', err);
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  }, []);

  useEffect(() => {
    fetchPropiedades();
  }, [fetchPropiedades]);

  const filteredPropiedades = useMemo(() => {
    return propiedades.filter(p => 
      p.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ciudad.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [propiedades, searchQuery]);

  const stats = useMemo(() => ({
    total: propiedades.length,
    venta: propiedades.filter(p => p.operacion === 'Venta').length,
    alquiler: propiedades.filter(p => p.operacion === 'Alquiler').length
  }), [propiedades]);

  return (
    <div className="bg-slate-50 min-h-screen font-sans antialiased">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Catálogo de Inmuebles</h2>
          <p className="text-gray-500 mt-1 font-medium italic">Explora y gestiona el inventario de propiedades.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:min-w-[300px]">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, sector o ciudad..." 
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 cursor-pointer">
            <Plus className="h-5 w-5" />
            <span>Nueva Propiedad</span>
          </button>
        </div>
      </div>

      <PropertyStats total={stats.total} venta={stats.venta} alquiler={stats.alquiler} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonPropertyCard key={i} />)}
        </div>
      ) : filteredPropiedades.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-32 text-center shadow-sm flex flex-col items-center">
          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Home className="h-10 w-10 text-slate-200" />
          </div>
          <p className="text-xl font-bold text-slate-900">Catálogo vacío</p>
          <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
            No hay propiedades que coincidan con tu búsqueda o el inventario está vacío.
          </p>
          <button 
            onClick={() => setSearchQuery('')}
            className="mt-8 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-600/10"
          >
            Ver todo el catálogo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in duration-500">
          {filteredPropiedades.map((p) => (
            <div key={p.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
              {/* Imagen / Placeholder */}
              <div className="h-56 bg-slate-200 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                <ImageIcon className="h-12 w-12 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                
                {/* Badges Flotantes */}
                <div className="absolute top-4 left-4 flex gap-2 z-20">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                    p.estadoComercial === 'Disponible' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-500 border-slate-400 text-white'
                  }`}>
                    {p.estadoComercial}
                  </span>
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-900 shadow-sm">
                    {p.operacion}
                  </span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-widest">
                    {p.tipoPropiedad}
                  </span>
                </div>
                
                <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate mb-1">
                  {p.titulo}
                </h3>
                
                <div className="flex items-center gap-1.5 text-slate-400 mb-6">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold truncate italic">{p.sector}, {p.ciudad}</span>
                </div>

                <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(p.precio)}
                  </span>
                  <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all cursor-pointer">
                    <Plus className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
