import { ListTodo, Phone, MapPin, Users, FileText } from 'lucide-react';
import { ManualSection, ManualAlert, ManualBadge } from '../../../components/ui/manuales';

export function ManualProductividadMobile() {
  return (
    <div className="p-4 bg-emerald-50 min-h-screen text-slate-800">
      <div className="space-y-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-emerald-900 flex items-center gap-2">
            <ListTodo className="w-7 h-7 text-emerald-600" />
            Productividad
          </h1>
        </header>

        <ManualSection title="Gestión de Tareas">
          <div className="flex flex-col gap-3 mt-3">
            <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-center gap-3">
              <div className="p-2 bg-sky-100 text-sky-600 rounded-lg"><Phone className="w-4 h-4" /></div>
              <div><span className="font-semibold text-sm block">Llamada</span></div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><MapPin className="w-4 h-4" /></div>
              <div><span className="font-semibold text-sm block">Visita</span></div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Users className="w-4 h-4" /></div>
              <div><span className="font-semibold text-sm block">Reunión</span></div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><FileText className="w-4 h-4" /></div>
              <div><span className="font-semibold text-sm block">Trámite</span></div>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <ManualBadge className="bg-slate-100 text-slate-700 text-xs">Pendiente</ManualBadge>
            <ManualBadge className="bg-emerald-100 text-emerald-800 text-xs">Completada</ManualBadge>
            <ManualBadge className="bg-rose-100 text-rose-800 text-xs">Cancelada</ManualBadge>
          </div>
        </ManualSection>

        <ManualSection title="Calendario">
          <ManualAlert className="text-sm bg-white border-emerald-200 mt-3 mb-2">
            <strong>Siempre a Tiempo:</strong> Ajuste automático a tu hora local.
          </ManualAlert>
          <ManualAlert className="text-sm bg-white border-emerald-200">
            <strong>Fácil organización:</strong> Arrastra y suelta para reprogramar.
          </ManualAlert>
        </ManualSection>
      </div>
    </div>
  );
}
