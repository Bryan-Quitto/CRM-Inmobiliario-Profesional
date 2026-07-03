import { Search, Command, X, Users, Home, Zap } from 'lucide-react';
import { ManualSection, ManualAlert, ManualBadge } from '../../../components/ui/manuales';

export function ManualBusquedaMobile() {
  return (
    <div className="p-4 bg-sky-50 min-h-screen text-slate-800">
      <div className="space-y-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
            <Search className="w-7 h-7 text-indigo-600" />
            Búsqueda Rápida
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Descubre cómo usar el buscador global para encontrar propiedades, clientes y tareas al instante.
          </p>
        </header>

        <ManualSection title="OmniSearch">
          <p className="text-sm mb-4">
            Buscador inteligente y unificado para localizar todo desde un solo lugar.
          </p>
          <ManualAlert className="text-sm">
            <p className="mb-2">Abrir: <ManualBadge className="bg-indigo-100 text-indigo-800"><Command className="w-3 h-3 inline"/> Ctrl + K</ManualBadge></p>
            <p>Cerrar: <ManualBadge className="bg-rose-100 text-rose-800"><X className="w-3 h-3 inline"/> Escape</ManualBadge></p>
          </ManualAlert>
        </ManualSection>

        <ManualSection title="Funciones">
          <div className="flex flex-col gap-4 mt-3">
            <div className="bg-white p-4 rounded-lg shadow-sm flex gap-3 items-start border border-sky-100">
              <Zap className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <h3 className="font-semibold text-base">Accesos rápidos</h3>
                <p className="text-xs text-slate-600 mt-1">Navega a cualquier sección del sistema de forma ágil.</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm flex gap-3 items-start border border-sky-100">
              <Users className="w-6 h-6 text-indigo-500 shrink-0" />
              <div>
                <h3 className="font-semibold text-base">Contactos</h3>
                <p className="text-xs text-slate-600 mt-1">Busca por nombre, apellido o teléfono.</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm flex gap-3 items-start border border-sky-100">
              <Home className="w-6 h-6 text-emerald-500 shrink-0" />
              <div>
                <h3 className="font-semibold text-base">Propiedades</h3>
                <p className="text-xs text-slate-600 mt-1">Busca por título, ciudad o sector.</p>
              </div>
            </div>
          </div>
        </ManualSection>
      </div>
    </div>
  );
}
