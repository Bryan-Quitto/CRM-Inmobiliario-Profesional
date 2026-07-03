import { ListTodo, Calendar, Phone, MapPin, Users, FileText, CheckCircle, Clock } from 'lucide-react';
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

            <h3 className="font-semibold text-lg text-emerald-900 mb-4">Estados</h3>
            <div className="flex gap-3 mb-6">
              <ManualBadge className="bg-slate-100 text-slate-700">Pendiente</ManualBadge>
              <ManualBadge className="bg-emerald-100 text-emerald-800">Completada</ManualBadge>
              <ManualBadge className="bg-rose-100 text-rose-800">Cancelada</ManualBadge>
            </div>
            
            <ManualAlert className="bg-white border-emerald-200">
              <strong>Privacidad Segura:</strong> Tus datos están protegidos, solo tú puedes ver y asignar tareas a los clientes de tu lista.
            </ManualAlert>
          </ManualSection>

          <ManualSection title="2. Calendario" icon={<Calendar className="w-6 h-6 text-sky-500" />}>
            <p className="text-slate-700 mb-4">El calendario proporciona una vista unificada de todas tus tareas.</p>
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100">
                <h4 className="font-semibold text-emerald-900 flex items-center gap-2 mb-2"><Clock className="w-5 h-5 text-sky-500"/> Siempre a Tiempo</h4>
                <p className="text-sm text-slate-600">Tu calendario siempre estará configurado en tu hora local. No tienes que preocuparte por cambios de horario; el sistema se ajusta automáticamente.</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100">
                <h4 className="font-semibold text-emerald-900 flex items-center gap-2 mb-2"><Calendar className="w-5 h-5 text-amber-500"/> Organización Visual</h4>
                <p className="text-sm text-slate-600">Las vistas semanales o mensuales te muestran todas tus tareas con sus colores correspondientes. Arrastra y suelta para reprogramar.</p>
              </div>
            </div>
          </ManualSection>
        </div>
      </div>
    </div>
  );
}
