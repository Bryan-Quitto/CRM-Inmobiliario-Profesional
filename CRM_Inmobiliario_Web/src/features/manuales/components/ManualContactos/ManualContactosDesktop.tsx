import { Users, Filter, ShieldAlert, Settings, XOctagon, Flame, History } from 'lucide-react';
import { ManualSection } from '../../../../components/ui/manuales/ManualSection';
import { ManualAlert } from '../../../../components/ui/manuales/ManualAlert';
import { ManualBadge } from '../../../../components/ui/manuales/ManualBadge';

export const ManualContactosDesktop: React.FC = () => {
  return (
    <div className="bg-slate-50 p-8 min-h-screen font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Manual de Contactos y Clientes</h1>
          <p className="text-lg text-slate-500">Documentación sobre cómo gestionar a tus clientes y las etapas de venta en el CRM.</p>
        </header>

        <ManualSection title="1. Reglas Generales de Clientes" icon={<Users className="w-6 h-6" />}>
          <ul className="space-y-4">
            <li className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
              <span className="text-sm text-slate-700"><strong>Tipos de Cliente:</strong> Todo cliente puede ser alguien que busca una casa (Prospecto), alguien que vende una casa (Propietario), ¡o incluso ambos al mismo tiempo!</span>
            </li>
            <li className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
              <span className="text-sm text-slate-700"><strong>Regla de WhatsApp:</strong> Si indicas que el cliente te contactó por WhatsApp, obligatoriamente deberás registrar su número de teléfono.</span>
            </li>
            <li className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0"></div>
              <span className="text-sm text-slate-700"><strong>Teléfonos Únicos:</strong> No puedes tener dos clientes distintos registrados con el mismo número de celular.</span>
            </li>
          </ul>
        </ManualSection>

        <ManualSection title="2. Etapas de Venta (Embudo Comercial)" icon={<Filter className="w-6 h-6" />}>
          <p className="mb-4 text-slate-600">Las etapas varían dependiendo de si el cliente busca comprar/alquilar o si es el dueño de una propiedad.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 text-lg border-b border-slate-100 pb-2">Prospectos (Buscan)</h3>
              <ul className="space-y-4">
                <li><ManualBadge color="sky">Nuevo</ManualBadge> <span className="text-sm text-slate-600 ml-2">Acaba de llegar, sin conversar en detalle.</span></li>
                <li><ManualBadge color="indigo">Contactado</ManualBadge> <span className="text-sm text-slate-600 ml-2">Automático al crear visita, o manual.</span></li>
                <li><ManualBadge color="rose">Perdido</ManualBadge> <span className="text-sm text-slate-600 ml-2">Ya no quiere comprar/alquilar.</span></li>
                <li className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <div className="mb-2"><ManualBadge color="amber">En Negociación / Cerrado</ManualBadge></div>
                  <span className="text-sm text-slate-600 block"><strong>No se seleccionan a mano.</strong> Solo pasan a estos estados cuando les reservas o vendes una propiedad.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 text-lg border-b border-slate-100 pb-2">Propietarios (Dueños)</h3>
              <ul className="space-y-4">
                <li><ManualBadge color="emerald">Activo</ManualBadge> <span className="text-sm text-slate-600 ml-2">Dueño con propiedades actuales.</span></li>
                <li><ManualBadge color="slate">Inactivo</ManualBadge> <span className="text-sm text-slate-600 ml-2">Has dejado de trabajar con él. Oculta sus propiedades.</span></li>
                <li><ManualBadge color="indigo">Cerrado</ManualBadge> <span className="text-sm text-slate-600 ml-2">Estado automático al vender o alquilar sus propiedades.</span></li>
              </ul>
            </div>
          </div>
        </ManualSection>

        <ManualSection title="3. Reglas de Protección de Datos" icon={<ShieldAlert className="w-6 h-6" />}>
          <div className="space-y-4">
            <ManualAlert title="Contactos Archivados" variant="danger">
              No podrás modificar sus datos a menos que lo restaures. Tampoco podrás crearle tareas ni enviarle mensajes con IA.
            </ManualAlert>
            <ManualAlert title="Clientes en Negociación" variant="warning">
              Si ya separó una casa, cancela la reserva directamente en la propiedad; no puedes cambiar su estado manualmente.
            </ManualAlert>
            <ManualAlert title="Negocios Caídos" variant="warning">
              No puedes ponerlo como "Perdido" si ya le vendiste la casa. Debes marcar la caída del negocio en la propiedad.
            </ManualAlert>
            <ManualAlert title="Protección de Tratos" variant="info">
              El sistema no dejará marcar como "Perdido" o "Inactivo" si tienen casas separadas o alquiladas. Cancela los tratos primero.
            </ManualAlert>
          </div>
        </ManualSection>

        <ManualSection title="4. Automatizaciones" icon={<Settings className="w-6 h-6" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-xl">
              <h4 className="font-bold text-slate-800 mb-2">Recordatorios</h4>
              <p className="text-sm text-slate-600">Al marcar una tarea con un cliente, el sistema crea un recordatorio para el día siguiente.</p>
            </div>
            <div className="bg-slate-50 p-5 rounded-xl">
              <h4 className="font-bold text-slate-800 mb-2">Nuevas Oportunidades</h4>
              <p className="text-sm text-slate-600">Si un cliente "Cerrado" vuelve a buscar, el sistema registrará una nota indicando el nuevo proceso.</p>
            </div>
          </div>
        </ManualSection>

        <ManualSection title="5. Cuándo un Negocio Falla" icon={<XOctagon className="w-6 h-6" />}>
          <p className="text-sm text-slate-600 mb-2">Si un negocio se cae (ej. se cancela una reserva):</p>
          <ul className="list-disc pl-5 text-sm space-y-2 text-slate-700 bg-slate-50 p-4 rounded-xl">
            <li><strong>Liberación de Propiedad:</strong> Si solo tenía una en reserva, el sistema acomodará todo automáticamente. Si tenía varias, deberás liberarlas una por una.</li>
            <li>Al hacer esto, la propiedad vuelve a estar <strong>Disponible</strong> para otros.</li>
          </ul>
        </ManualSection>

        <ManualSection title="6. Nivel de Interés" icon={<Flame className="w-6 h-6" />}>
          <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-xl">
            <div className="flex gap-2">
              <ManualBadge color="rose">Alto 🔥</ManualBadge>
              <ManualBadge color="amber">Medio ⚡</ManualBadge>
              <ManualBadge color="sky">Bajo ❄️</ManualBadge>
              <ManualBadge color="slate">Descartada ❌</ManualBadge>
            </div>
            <span className="text-sm text-slate-600">Registrar estos intereses actualizará tus estadísticas para que sepas en quién enfocarte.</span>
          </div>
        </ManualSection>

        <ManualSection title="7. Historial de Interacciones" icon={<History className="w-6 h-6" />}>
          <p className="text-sm text-slate-600 mb-3">Toda actividad se registra. Tipos manuales:</p>
          <div className="flex gap-2 flex-wrap">
            <ManualBadge color="slate">Nota</ManualBadge>
            <ManualBadge color="slate">Llamada</ManualBadge>
            <ManualBadge color="emerald">WhatsApp</ManualBadge>
            <ManualBadge color="indigo">Visita</ManualBadge>
            <ManualBadge color="amber">Correo</ManualBadge>
          </div>
        </ManualSection>
      </div>
    </div>
  );
};
