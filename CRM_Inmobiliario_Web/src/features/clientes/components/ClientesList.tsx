import { useEffect, useState } from 'react';
import { Mail, Phone, User, Loader2, AlertCircle, Plus, Search, Filter } from 'lucide-react';
import { getClientes } from '../api/getClientes';
import type { Cliente } from '../types';

export const ClientesList = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        setLoading(true);
        const data = await getClientes();
        setClientes(data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar clientes:', err);
        setError('No se pudo establecer conexión con el CRM. Verifica que el servidor esté activo.');
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Cargando base de datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 flex flex-col items-center text-center gap-4">
        <AlertCircle className="h-10 w-10 text-red-600" />
        <div>
          <h3 className="text-red-900 font-bold text-lg mb-1">Error de Sincronización</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
        >
          Reintentar ahora
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Cabecera Corporativa */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Cartera de Clientes</h2>
          <p className="text-gray-500 mt-1 font-medium italic">Gestión integral de prospectos e interesados.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64 shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
            <Plus className="h-5 w-5" />
            Nuevo Prospecto
          </button>
        </div>
      </div>

      {/* Grid de Tarjetas */}
      {clientes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-20 text-center shadow-sm">
          <User className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-medium text-lg italic">Aún no hay clientes registrados en el sistema.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientes.map((cliente) => (
            <div 
              key={cliente.id} 
              className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 group cursor-pointer"
            >
              {/* Card Header: Nombre + Badge */}
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {cliente.nombre[0]}
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  cliente.etapaEmbudo === 'Nuevo' 
                  ? 'bg-blue-50 text-blue-700 border-blue-100' 
                  : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  {cliente.etapaEmbudo}
                </span>
              </div>

              {/* Card Body: Info de Contacto */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {cliente.nombre} {cliente.apellido}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 tracking-tighter">
                    ID: {cliente.id.substring(0, 8)}
                  </span>
                </div>
              </div>

              {/* Card Footer: Links de Contacto */}
              <div className="space-y-3 pt-4 border-t border-gray-50">
                {cliente.email && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                    <Mail className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                    <span className="truncate">{cliente.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  <Phone className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                  <span>{cliente.telefono}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer / Stats */}
      <div className="mt-12 flex justify-between items-center text-sm text-gray-400 font-medium">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span>Mostrando {clientes.length} prospectos</span>
        </div>
        <div className="italic">
          Última actualización: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
