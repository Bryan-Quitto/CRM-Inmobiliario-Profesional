import { ListTodo, Calendar, Phone, MapPin, Users, FileText, CheckCircle, Clock, Palette, AlarmClock, AlertTriangle } from 'lucide-react';
import { ManualSection, ManualAlert, ManualBadge } from '../../../components/ui/manuales';

export function ManualProductividadDesktop() {
  return (
    <div className="p-8 bg-emerald-50 min-h-screen text-slate-800">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-emerald-900 flex items-center justify-center gap-3">
            <ListTodo className="w-10 h-10 text-emerald-600" />
            Manual de Productividad y Organización
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ManualSection title="1. Gestión de Tareas" icon={<CheckCircle className="w-6 h-6 text-emerald-500" />}>
            <p className="text-slate-700 mb-6">El módulo de tareas te permite organizar tu día a día registrando actividades vinculadas a tu gestión comercial.</p>
            
            <h3 className="font-semibold text-lg text-emerald-900 mb-4">Tipos de Tareas</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                <div className="p-2 bg-sky-100 text-sky-600 rounded-lg"><Phone className="w-5 h-5" /></div>
                <div><span className="font-semibold block">Llamada</span><span className="text-xs text-slate-500 block">Color azul</span></div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><MapPin className="w-5 h-5" /></div>
                <div><span className="font-semibold block">Visita</span><span className="text-xs text-slate-500 block">Color esmeralda</span></div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Users className="w-5 h-5" /></div>
                <div><span className="font-semibold block">Reunión</span><span className="text-xs text-slate-500 block">Color morado</span></div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><FileText className="w-5 h-5" /></div>
                <div><span className="font-semibold block">Trámite</span><span className="text-xs text-slate-500 block">Color ámbar</span></div>
              </div>
            </div>

            <h3 className="font-semibold text-lg text-emerald-900 mb-3">Duración de la Tarea</h3>
            <div className="bg-white p-4 rounded-xl border border-emerald-100 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlarmClock className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold text-slate-800">Campo de Duración</span>
              </div>
              <p className="text-sm text-slate-600">Al crear o editar una tarea puedes establecer su duración eligiendo una cantidad y la unidad (Minutos u Horas). El máximo permitido es 10 horas (600 minutos), y el sistema almacena todo internamente en minutos. Este valor se suma a la <strong>Fecha de Inicio</strong> para calcular la hora exacta de finalización de la tarea.</p>
            </div>

            <h3 className="font-semibold text-lg text-emerald-900 mb-4">Estados de las Tareas</h3>
            <div className="space-y-3 mb-6">
              <div className="bg-white p-3 rounded-xl border border-emerald-100 flex items-start gap-3">
                <ManualBadge className="bg-slate-100 text-slate-700 shrink-0">Pendiente</ManualBadge>
                <span className="text-sm text-slate-600">La tarea está registrada y aún no ha vencido ni ha sido atendida.</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-rose-100 flex items-start gap-3">
                <ManualBadge className="bg-rose-100 text-rose-800 shrink-0">Atrasada</ManualBadge>
                <span className="text-sm text-slate-600"><strong>(Clasificación visual)</strong> Cuando la hora de finalización calculada (<strong>Fecha de Inicio + Duración</strong>) queda en el pasado, la tarea sigue siendo Pendiente en el sistema, pero se agrupa en la sección "Atrasadas" de tu Agenda resaltada en rojo. <em>Nota: Esta es una clasificación automática, no un estado seleccionable. Si decides no realizar la tarea, usa el estado "Cancelada".</em></span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-100 flex items-start gap-3">
                <ManualBadge className="bg-emerald-100 text-emerald-800 shrink-0">Completada</ManualBadge>
                <span className="text-sm text-slate-600">La tarea fue marcada como realizada y pasa al historial.</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-start gap-3">
                <ManualBadge className="bg-slate-100 text-slate-600 shrink-0">Cancelada</ManualBadge>
                <span className="text-sm text-slate-600">La tarea fue descartada y pasa al historial sin completarse.</span>
              </div>
            </div>

            <h3 className="font-semibold text-lg text-emerald-900 mb-3">Color Personalizado</h3>
            <div className="bg-white p-4 rounded-xl border border-emerald-100 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-5 h-5 text-purple-500" />
                <span className="font-semibold text-slate-800">Identifica tus tareas visualmente</span>
              </div>
              <p className="text-sm text-slate-600">Puedes asignar un color a cada tarea seleccionando uno de los <strong>10 colores disponibles</strong> en el formulario. El color elegido se reflejará tanto en la tarjeta de la Agenda como en el Calendario, facilitando la identificación visual rápida. Si no asignas ningún color, se utilizará el color correspondiente al tipo de tarea.</p>
            </div>

            <ManualAlert className="bg-white border-emerald-200">
              <strong>Privacidad Segura:</strong> Al asociar una tarea a un contacto o propiedad, el sistema verifica que sean tuyos. Otros agentes no pueden ver ni modificar tus tareas. <em>(Los administradores técnicos de la plataforma pueden tener acceso de supervisión para soporte).</em>
            </ManualAlert>
          </ManualSection>

          <ManualSection title="2. Calendario" icon={<Calendar className="w-6 h-6 text-sky-500" />}>
            <p className="text-slate-700 mb-4">El calendario proporciona una vista unificada de todas tus tareas.</p>
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100">
                <h4 className="font-semibold text-emerald-900 flex items-center gap-2 mb-2"><Clock className="w-5 h-5 text-sky-500"/> Horario Local en la Agenda</h4>
                <p className="text-sm text-slate-600">Tu Agenda Diaria y Calendario muestran las tareas en el horario local de tu dispositivo. (Las notificaciones, por otro lado, se envían según el horario de Ecuador UTC-5).</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100">
                <h4 className="font-semibold text-emerald-900 flex items-center gap-2 mb-2"><Calendar className="w-5 h-5 text-amber-500"/> Organización Visual</h4>
                <p className="text-sm text-slate-600">Las vistas semanales o mensuales te muestran todas tus tareas con sus colores correspondientes. Arrastra y suelta para reprogramar.</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-rose-100">
                <h4 className="font-semibold text-rose-700 flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-rose-500"/> Tareas Atrasadas en la Agenda</h4>
                <p className="text-sm text-slate-600">En la sección <strong>Agenda Diaria</strong>, las tareas que ya superaron su hora de finalización (<strong>Fecha de Inicio + Duración</strong>) se muestran en la sección <em>"Atrasadas"</em> con resaltado en rojo. El sistema recalcula y agrupa esto automáticamente cada vez que abres o actualizas la Agenda.</p>
              </div>
            </div>
          </ManualSection>
        </div>
      </div>
    </div>
  );
}
