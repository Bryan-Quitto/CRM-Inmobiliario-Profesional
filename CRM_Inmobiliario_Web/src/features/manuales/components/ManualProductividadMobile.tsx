import { ListTodo, Phone, MapPin, Users, FileText, AlarmClock, Palette, AlertTriangle } from 'lucide-react';
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

        <ManualSection title="Tipos de Tarea">
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
        </ManualSection>

        <ManualSection title="Estados de las Tareas">
          <div className="mt-3 flex flex-col gap-2">
            <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-start gap-2">
              <ManualBadge className="bg-slate-100 text-slate-700 text-xs shrink-0">Pendiente</ManualBadge>
              <span className="text-xs text-slate-600">La tarea está registrada y aún no ha vencido.</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-rose-100 flex items-start gap-2">
              <ManualBadge className="bg-rose-100 text-rose-800 text-xs shrink-0">Atrasada</ManualBadge>
              <span className="text-xs text-slate-600"><strong>(Visual)</strong> La hora de finalización (<strong>Inicio + Duración</strong>) ya pasó. Sigue siendo Pendiente en sistema, pero aparece en rojo. <em>No es seleccionable; usa Cancelada si no la harás.</em></span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-emerald-100 flex items-start gap-2">
              <ManualBadge className="bg-emerald-100 text-emerald-800 text-xs shrink-0">Completada</ManualBadge>
              <span className="text-xs text-slate-600">Marcada como realizada. Pasa al historial.</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-100 flex items-start gap-2">
              <ManualBadge className="bg-slate-100 text-slate-600 text-xs shrink-0">Cancelada</ManualBadge>
              <span className="text-xs text-slate-600">Descartada. Pasa al historial sin completarse.</span>
            </div>
          </div>
        </ManualSection>

        <ManualSection title="Duración">
          <ManualAlert className="text-sm bg-white border-emerald-200 mt-3 mb-2">
            <span className="flex items-center gap-2"><AlarmClock className="w-4 h-4 text-emerald-600" /><strong>Duración configurable:</strong></span>
            Elige cantidad y unidad (Minutos/Horas, máximo 10h). El sistema almacena todo en minutos y lo suma a la Fecha de Inicio para calcular el vencimiento.
          </ManualAlert>
        </ManualSection>

        <ManualSection title="Color Personalizado">
          <ManualAlert className="text-sm bg-white border-purple-200 mt-3">
            <span className="flex items-center gap-2 mb-1"><Palette className="w-4 h-4 text-purple-600" /><strong>10 colores disponibles</strong></span>
            Elige un color para identificar visualmente tus tareas en la Agenda y el Calendario. Si no eliges uno, se usará el color del tipo de tarea.
          </ManualAlert>
        </ManualSection>

        <ManualSection title="Tareas Vencidas en la Agenda">
          <ManualAlert className="text-sm bg-white border-rose-200 mt-3">
            <span className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-rose-600" /><strong>Sección "Atrasadas"</strong></span>
            Las tareas cuya hora de finalización (Inicio + Duración) ya pasó se muestran en rojo en la sección Atrasadas cada vez que abres o actualizas la Agenda.
          </ManualAlert>
        </ManualSection>
      </div>
    </div>
  );
}
