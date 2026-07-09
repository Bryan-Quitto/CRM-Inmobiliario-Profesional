import { Users, Filter, ShieldAlert, Settings, XOctagon, Flame } from 'lucide-react';
import { ManualSection } from '../../../../components/ui/manuales/ManualSection';
import { ManualAlert } from '../../../../components/ui/manuales/ManualAlert';
import { ManualBadge } from '../../../../components/ui/manuales/ManualBadge';

export const ManualContactosMobile: React.FC = () => {
  return (
    <div className="bg-white min-h-screen font-sans text-slate-800 p-4 pb-12">
      <header className="mb-8 border-b border-slate-100 pb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Manual de Contactos</h1>
        <p className="text-sm text-slate-500 leading-relaxed">Cómo gestionar a tus clientes y las etapas de venta en el CRM.</p>
      </header>

      <ManualSection title="1. Reglas Generales" icon={<Users className="w-5 h-5" />}>
        <ul className="space-y-3 text-xs text-slate-700">
          <li className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <strong>Tipos:</strong> Todo cliente puede ser Prospecto (busca), Propietario (vende), o ambos.
          </li>
          <li className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <strong>WhatsApp:</strong> Obligatorio registrar su número de teléfono.
          </li>
          <li className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <strong>Teléfonos Únicos:</strong> Sin duplicados de celular.
          </li>
        </ul>
      </ManualSection>

      <ManualSection title="2. Embudo Comercial" icon={<Filter className="w-5 h-5" />}>
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 mb-3 text-sm">Prospectos (Buscan)</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2"><ManualBadge color="sky">Nuevo</ManualBadge> <span className="text-xs text-slate-600">Recién llegado</span></li>
              <li className="flex items-center gap-2"><ManualBadge color="indigo">Contactado</ManualBadge> <span className="text-xs text-slate-600">Tras crear visita</span></li>
              <li className="flex items-center gap-2"><ManualBadge color="rose">Perdido</ManualBadge> <span className="text-xs text-slate-600">Ya no busca</span></li>
              <li className="bg-amber-50 p-3 rounded-lg text-xs text-slate-700 border border-amber-100">
                <span className="font-bold block mb-1">En Negociación / Cerrado:</span>
                Solo automáticos al reservar o vender.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 mb-3 text-sm">Propietarios (Dueños)</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2"><ManualBadge color="emerald">Activo</ManualBadge> <span className="text-xs text-slate-600">Automático por propiedades</span></li>
              <li className="flex items-center gap-2"><ManualBadge color="slate">Inactivo</ManualBadge> <span className="text-xs text-slate-600">No reactivable a mano</span></li>
              <li className="bg-indigo-50 p-3 rounded-lg text-xs text-slate-700 border border-indigo-100 mt-2">
                <span className="font-bold block mb-1">Cerrado:</span>
                Solo automático. El tablero bloquea cambios manuales (SSoT).
              </li>
            </ul>
          </div>
        </div>
      </ManualSection>

      <ManualSection title="3. Protección de Datos" icon={<ShieldAlert className="w-5 h-5" />}>
        <div className="space-y-3">
          <ManualAlert title="Archivados" variant="danger">
            Sin modificación ni IA sin restaurar primero.
          </ManualAlert>
          <ManualAlert title="Negociaciones" variant="warning">
            Modifica la reserva en la propiedad, no el estado del cliente.
          </ManualAlert>
          <ManualAlert title="Tratos" variant="info">
            Cancela tratos (reservas/alquileres) antes de marcar Inactivo o Perdido.
          </ManualAlert>
          <ManualAlert title="Reactivar (SSoT)" variant="info">
            Para reactivar a un dueño Cerrado/Inactivo, haz "Disponible" una de sus propiedades. No se puede a mano.
          </ManualAlert>
        </div>
      </ManualSection>

      <ManualSection title="4. Automatizaciones" icon={<Settings className="w-5 h-5" />}>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2">
          <strong className="text-sm">Recordatorios:</strong> <span className="text-xs">Se crean automáticos para el día siguiente.</span>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
          <strong className="text-sm">Nuevas Oportunidades:</strong> <span className="text-xs">Clientes cerrados generan nuevas notas si vuelven a buscar.</span>
        </div>
      </ManualSection>

      <ManualSection title="5. Negocios Caídos" icon={<XOctagon className="w-5 h-5" />}>
        <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
          Si tenía una reserva, el sistema lo acomoda a "Perdido" o "Contactado" y la propiedad a "Disponible". Si tenía varias, deberás liberarlas manualmente.
        </p>
      </ManualSection>

      <ManualSection title="6. Intereses e Historial" icon={<Flame className="w-5 h-5" />}>
        <div className="mb-4">
          <p className="text-xs text-slate-600 mb-2">Niveles válidos:</p>
          <div className="flex flex-wrap gap-2">
            <ManualBadge color="rose">Alto 🔥</ManualBadge>
            <ManualBadge color="amber">Medio ⚡</ManualBadge>
            <ManualBadge color="sky">Bajo ❄️</ManualBadge>
            <ManualBadge color="slate">Descartada ❌</ManualBadge>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-600 mb-2">Historial manual:</p>
          <div className="flex flex-wrap gap-2">
            <ManualBadge color="slate">Nota</ManualBadge>
            <ManualBadge color="slate">Llamada</ManualBadge>
            <ManualBadge color="emerald">WhatsApp</ManualBadge>
            <ManualBadge color="indigo">Visita</ManualBadge>
            <ManualBadge color="amber">Correo</ManualBadge>
          </div>
        </div>
      </ManualSection>
    </div>
  );
};
