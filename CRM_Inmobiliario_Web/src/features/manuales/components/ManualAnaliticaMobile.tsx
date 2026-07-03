import { BarChart3 } from 'lucide-react';
import { ManualSection, ManualAlert, ManualBadge } from '../../../components/ui/manuales';

export function ManualAnaliticaMobile() {
  return (
    <div className="p-4 bg-indigo-50 min-h-screen text-slate-800">
      <div className="space-y-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Analítica Mensual
          </h1>
        </header>

        <ManualSection title="Rendimiento">
          <p className="text-sm">El sistema calcula todas las métricas optimizando las consultas para garantizar tiempos de carga instantáneos.</p>
        </ManualSection>

        <ManualSection title="Métricas Mensuales">
          <div className="flex flex-col gap-3 mt-3">
            <div className="bg-white p-3 rounded-lg border border-indigo-100 flex flex-col gap-1">
              <ManualBadge className="w-fit bg-emerald-100 text-emerald-800">Visitas</ManualBadge>
              <p className="text-xs text-slate-600">Recorridos completados.</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-indigo-100 flex flex-col gap-1">
              <ManualBadge className="w-fit bg-indigo-100 text-indigo-800">Cierres</ManualBadge>
              <p className="text-xs text-slate-600">Ventas o alquileres concretados.</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-indigo-100 flex flex-col gap-1">
              <ManualBadge className="w-fit bg-sky-100 text-sky-800">Ofertas</ManualBadge>
              <p className="text-xs text-slate-600">Clientes en estado "En Negociación".</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-indigo-100 flex flex-col gap-1">
              <ManualBadge className="w-fit bg-amber-100 text-amber-800">Captaciones</ManualBadge>
              <p className="text-xs text-slate-600">Propiedades nuevas captadas.</p>
            </div>
          </div>
        </ManualSection>

        <ManualSection title="Actualización">
          <div className="flex flex-col gap-2 mt-3">
             <ManualAlert className="text-xs bg-sky-50 text-sky-900 border-sky-200">
               Actualización proactiva en segundo plano.
             </ManualAlert>
             <ManualAlert className="text-xs bg-indigo-50 text-indigo-900 border-indigo-200">
               Hora local de Ecuador.
             </ManualAlert>
          </div>
        </ManualSection>
      </div>
    </div>
  );
}
