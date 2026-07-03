import { Target, Clock, Zap } from 'lucide-react';
import { ManualSection, ManualAlert, ManualBadge } from '../../../../components/ui/manuales';

export function ManualDashboardDesktop() {
  return (
    <div className="p-8 bg-indigo-50 min-h-screen text-slate-800">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-indigo-900 flex items-center justify-center gap-3">
            <Target className="w-10 h-10 text-indigo-600" />
            Manual del Panel de Control
          </h1>
        </header>

        <ManualSection title="1. Alto Rendimiento en tus Estadísticas" icon={<Zap className="w-6 h-6 text-amber-500" />}>
          <p className="text-lg text-slate-700">
            Para garantizar tiempos de carga instantáneos en la interfaz, el sistema calcula todas las métricas de tu Panel de Control optimizando las consultas. Tu panel es súper rápido. Obtiene todos tus datos y estadísticas en un abrir y cerrar de ojos, sin hacerte esperar.
          </p>
        </ManualSection>

        <ManualSection title="2. Panel Principal" icon={<Target className="w-6 h-6 text-emerald-500" />}>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <li className="flex items-start gap-3 bg-white p-4 rounded-xl border border-indigo-100">
              <ManualBadge className="bg-emerald-100 text-emerald-800 whitespace-nowrap">Disponibles</ManualBadge>
              <p className="text-sm text-slate-600">Cuenta exclusivamente las propiedades cuyo estado comercial es "Disponible".</p>
            </li>
            <li className="flex items-start gap-3 bg-white p-4 rounded-xl border border-indigo-100">
              <ManualBadge className="bg-sky-100 text-sky-800 whitespace-nowrap">Activos</ManualBadge>
              <p className="text-sm text-slate-600">Clientes no marcados como "Perdido" ni "Cerrado".</p>
            </li>
            <li className="flex items-start gap-3 bg-white p-4 rounded-xl border border-indigo-100">
              <ManualBadge className="bg-amber-100 text-amber-800 whitespace-nowrap">Tareas Hoy</ManualBadge>
              <p className="text-sm text-slate-600">Tareas pendientes para hoy y vencidas.</p>
            </li>
            <li className="flex items-start gap-3 bg-white p-4 rounded-xl border border-indigo-100">
              <ManualBadge className="bg-rose-100 text-rose-800 whitespace-nowrap">Seguimiento</ManualBadge>
              <p className="text-sm text-slate-600">Clientes de alta prioridad (interés Medio/Alto y no cerrados).</p>
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
