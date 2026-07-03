import { Search, Command, X, Users, Home, Zap } from 'lucide-react';
import { ManualSection, ManualAlert, ManualBadge } from '../../../components/ui/manuales';

export function ManualBusquedaDesktop() {
  return (
    <div className="p-8 bg-sky-50 min-h-screen text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-indigo-900 flex items-center justify-center gap-3">
            <Search className="w-10 h-10 text-indigo-600" />
            Manual de Búsqueda y Herramientas Rápidas
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Este documento explica cómo utilizar las herramientas de búsqueda global del CRM Inmobiliario Profesional para encontrar rápidamente la información que necesitas.
          </p>
        </header>

        <ManualSection title="Búsqueda Global (OmniSearch)" icon={<Zap className="w-6 h-6 text-amber-500" />}>
          <p className="mb-4">
            El sistema cuenta con un buscador inteligente y unificado que te permite localizar distintos tipos de registros desde un único punto de entrada. Busca al mismo tiempo en todas tus propiedades, clientes, tareas y base de conocimiento con una sola consulta.
          </p>
          <ManualAlert>
            <div className="flex items-center gap-2 font-medium">
              Para abrir el buscador rápidamente, presiona <ManualBadge className="bg-indigo-100 text-indigo-800"><Command className="w-4 h-4 inline mr-1"/> Control + K</ManualBadge> en tu teclado.
              Para cerrarlo, presiona <ManualBadge className="bg-rose-100 text-rose-800"><X className="w-4 h-4 inline mr-1"/> Escape</ManualBadge>.
            </div>
          </ManualAlert>
        </ManualSection>

        <ManualSection title="Funciones Principales" icon={<Search className="w-6 h-6 text-emerald-500" />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-sky-100">
              <Zap className="w-8 h-8 text-amber-500 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Accesos rápidos</h3>
              <p className="text-sm text-slate-600">Te permite dirigirte a cualquier sección del sistema de forma ágil (por ejemplo: Crear tarea, Calendario, Configuración del Perfil, Contactos, Propiedades, etc.).</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-sky-100">
              <Users className="w-8 h-8 text-indigo-500 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Contactos</h3>
              <p className="text-sm text-slate-600">Te permite acceder directamente a los detalles de un contacto específico. Puedes buscar ingresando el nombre, apellido o número de teléfono del cliente.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-sky-100">
              <Home className="w-8 h-8 text-emerald-500 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Propiedades</h3>
              <p className="text-sm text-slate-600">Te permite acceder directamente a los detalles de una propiedad específica. Puedes buscar utilizando el título de la propiedad, la ciudad o el sector.</p>
            </div>
          </div>
        </ManualSection>
      </div>
    </div>
  );
}
