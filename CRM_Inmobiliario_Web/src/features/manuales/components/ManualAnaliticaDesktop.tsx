import { BarChart3, Clock, TrendingUp, Zap } from 'lucide-react';
import { ManualSection, ManualAlert, ManualBadge } from '../../../components/ui/manuales';

export function ManualAnaliticaDesktop() {
  return (
    <div className="p-8 bg-indigo-50 min-h-screen text-slate-800">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-indigo-900 flex items-center justify-center gap-3">
            <BarChart3 className="w-10 h-10 text-indigo-600" />
            Manual de Analítica Mensual
          </h1>
        </header>

        <ManualSection title="1. Alto Rendimiento en tus Estadísticas" icon={<Zap className="w-6 h-6 text-amber-500" />}>
          <p className="text-lg text-slate-700">
            Para garantizar tiempos de carga instantáneos en la interfaz, el sistema calcula todas las métricas de tu Analítica optimizando las consultas. Obtiene todos tus datos y estadísticas en un abrir y cerrar de ojos, sin hacerte esperar.
          </p>
        </ManualSection>

        <ManualSection title="2. Analítica Mensual" icon={<TrendingUp className="w-6 h-6 text-indigo-500" />}>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <li className="flex items-start gap-3 bg-white p-4 rounded-xl border border-indigo-100">
              <ManualBadge className="bg-emerald-100 text-emerald-800 whitespace-nowrap">Visitas</ManualBadge>
              <p className="text-sm text-slate-600">Recorridos con clientes completados con éxito.</p>
            </li>
            <li className="flex items-start gap-3 bg-white p-4 rounded-xl border border-indigo-100">
              <ManualBadge className="bg-indigo-100 text-indigo-800 whitespace-nowrap">Cierres</ManualBadge>
              <p className="text-sm text-slate-600">Ventas o alquileres concretados ("Cerrado").</p>
            </li>
            <li className="flex items-start gap-3 bg-white p-4 rounded-xl border border-indigo-100">
              <ManualBadge className="bg-sky-100 text-sky-800 whitespace-nowrap">Ofertas</ManualBadge>
              <p className="text-sm text-slate-600">Clientes en estado "En Negociación".</p>
            </li>
            <li className="flex items-start gap-3 bg-white p-4 rounded-xl border border-indigo-100">
              <ManualBadge className="bg-amber-100 text-amber-800 whitespace-nowrap">Captaciones</ManualBadge>
              <p className="text-sm text-slate-600">Propiedades nuevas traídas por ti.</p>
            </li>
          </ul>
        </ManualSection>

        <ManualSection title="3. Actualización Automática" icon={<Clock className="w-6 h-6 text-sky-500" />}>
          <div className="flex gap-6 mt-4">
            <ManualAlert className="flex-1 bg-sky-50 text-sky-900 border-sky-200">
              <strong>Proactiva:</strong> Estadísticas se actualizan solas y en segundo plano.
            </ManualAlert>
            <ManualAlert className="flex-1 bg-emerald-50 text-emerald-900 border-emerald-200">
              <strong>Inteligente:</strong> Agrupa cambios rápidos para procesarlos en bloque.
            </ManualAlert>
            <ManualAlert className="flex-1 bg-indigo-50 text-indigo-900 border-indigo-200">
              <strong>Precisión:</strong> Cálculos de acuerdo al horario local de Ecuador.
            </ManualAlert>
          </div>
        </ManualSection>
      </div>
    </div>
  );
}
