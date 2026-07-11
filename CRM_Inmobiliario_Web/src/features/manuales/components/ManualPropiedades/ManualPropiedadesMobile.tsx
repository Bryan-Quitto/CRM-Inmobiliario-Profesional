import { Tag, RefreshCcw, XCircle, CheckCircle, Shield, Lock, Users, Archive, FilePlus, UserCheck, Hash, Bot, Camera, Image as ImageIcon, Folder } from 'lucide-react';
import { ManualSection } from '../../../../components/ui/manuales/ManualSection';
import { ManualAlert } from '../../../../components/ui/manuales/ManualAlert';
import { ManualBadge } from '../../../../components/ui/manuales/ManualBadge';

export const ManualPropiedadesMobile: React.FC = () => {
  return (
    <div className="bg-white min-h-screen font-sans text-slate-800 p-4 pb-12">
      <header className="mb-8 border-b border-slate-100 pb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Propiedades e Inventario</h1>
        <p className="text-sm text-slate-500 leading-relaxed">Cómo manejar tu cartera de propiedades y los diferentes estados por los que puede pasar un inmueble.</p>
      </header>

      <ManualSection title="1. Estados Comerciales" icon={<Tag className="w-5 h-5" />}>
        <div className="flex flex-col gap-3 mb-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-start gap-2">
            <ManualBadge color="emerald">Disponible</ManualBadge>
            <span className="text-xs text-slate-600">Lista para ofrecer a clientes. Toda propiedad nueva ingresa así.</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-start gap-2">
            <ManualBadge color="amber">Reservada</ManualBadge>
            <span className="text-xs text-slate-600">Un cliente dio anticipo o separó la propiedad.</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-start gap-2">
            <ManualBadge color="indigo">Vendida</ManualBadge>
            <span className="text-xs text-slate-600">La propiedad ya tiene un nuevo dueño.</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-start gap-2">
            <ManualBadge color="sky">Alquilada</ManualBadge>
            <span className="text-xs text-slate-600">Ocupada por un inquilino durante su contrato.</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-start gap-2">
            <ManualBadge color="slate">Inactiva</ManualBadge>
            <span className="text-xs text-slate-600">No se puede ofrecer temporalmente.</span>
          </div>
        </div>
        
        <ManualAlert title="Regla de Estados" variant="warning">
          <strong>No reservar lo cerrado:</strong> Si ya se vendió o alquiló, ponla como "Disponible" primero para poder reservarla.
        </ManualAlert>
      </ManualSection>

      <ManualSection title="2. Ciclo de Vida" icon={<RefreshCcw className="w-5 h-5" />}>
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm"><XCircle className="w-4 h-4 text-rose-500" /> Negocio Caído</h3>
            <p className="text-xs mb-3 text-slate-600">Cuando un cliente cancela su reserva.</p>
            <ul className="list-disc pl-4 text-xs space-y-2 text-slate-700">
              <li><strong>Trato:</strong> Se registra como cancelado.</li>
              <li><strong>Cliente:</strong> Actualiza su estado automáticamente (Contactado, Cerrado o Negociación).</li>
              <li><strong>Propiedad:</strong> Regresa a "Disponible".</li>
            </ul>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-emerald-500" /> Renovación</h3>
            <p className="text-xs mb-3 text-slate-600">Cuando termina un contrato de alquiler, por ejemplo.</p>
            <ul className="list-disc pl-4 text-xs space-y-2 text-slate-700">
              <li><strong>Trato:</strong> Se guarda como concluido con éxito.</li>
              <li><strong>Propietario:</strong> La propiedad queda "Disponible" o "Inactiva" según el estado del dueño.</li>
            </ul>
          </div>
        </div>
      </ManualSection>

      <ManualSection title="3. Seguridad" icon={<Shield className="w-5 h-5" />}>
        <ul className="space-y-3">
          <li className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg">
            <Lock className="w-5 h-5 text-indigo-500 shrink-0" /> 
            <span className="text-xs text-slate-700"><strong>Privada:</strong> Solo ves tus propiedades y las de tu equipo.</span>
          </li>
          <li className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg">
            <Users className="w-5 h-5 text-indigo-500 shrink-0" /> 
            <span className="text-xs text-slate-700"><strong>Equipo:</strong> Si registras para un compañero inactivo, puedes gestionarla hasta que él ingrese.</span>
          </li>
          <li className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg">
            <Archive className="w-5 h-5 text-indigo-500 shrink-0" /> 
            <span className="text-xs text-slate-700"><strong>Archivadas:</strong> Desarchiva primero para cambiar su estado.</span>
          </li>
        </ul>
      </ManualSection>

      <ManualSection title="4. Registro" icon={<FilePlus className="w-5 h-5" />}>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Dueño</h4>
              <p className="text-xs text-slate-600">Se marca automáticamente al asignarlo.</p>
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-3">
            <Hash className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Código Único</h4>
              <p className="text-xs text-slate-600">Ejemplo: PRO-A1B2C, para búsqueda rápida.</p>
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-3">
            <Bot className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">IA</h4>
              <p className="text-xs text-slate-600">La IA aprende los datos de tu propiedad en segundos.</p>
            </div>
          </div>
        </div>
      </ManualSection>

      <ManualSection title="5. Fotos" icon={<Camera className="w-5 h-5" />}>
        <ul className="space-y-3">
          <li className="flex gap-3 items-center bg-slate-50 p-3 rounded-lg">
            <Folder className="w-5 h-5 text-emerald-500 shrink-0" /> 
            <span className="text-xs text-slate-700">Organiza por zonas (habitaciones, áreas comunes).</span>
          </li>
          <li className="flex gap-3 items-center bg-slate-50 p-3 rounded-lg">
            <ImageIcon className="w-5 h-5 text-emerald-500 shrink-0" /> 
            <span className="text-xs text-slate-700">Elige la foto principal de portada.</span>
          </li>
        </ul>
      </ManualSection>

      <ManualSection title="6. Limpieza Automática de Recursos" icon={<RefreshCcw className="w-5 h-5" />}>
        <p className="text-sm text-slate-600 mb-3">Limpieza de archivos pesados bajo reglas estrictas:</p>
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-3">
          <h3 className="font-bold text-indigo-900 mb-2 text-sm">Cerradas {'>'} 1 año</h3>
          <p className="text-xs text-slate-700 mb-2">
            Si permanece "Vendida" o "Alquilada" por más de 1 año (365 días), se eliminan fotos secundarias, secciones y PDF.
          </p>
          <p className="text-xs text-indigo-800 font-semibold">
            Nota: La foto principal se conserva intacta.
          </p>
        </div>
      </ManualSection>
    </div>
  );
};
