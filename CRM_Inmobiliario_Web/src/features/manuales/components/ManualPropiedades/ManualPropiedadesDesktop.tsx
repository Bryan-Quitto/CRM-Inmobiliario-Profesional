import { Tag, RefreshCcw, XCircle, CheckCircle, Shield, Lock, Users, Archive, FilePlus, UserCheck, Hash, UserPlus, Bot, Camera, Image as ImageIcon, Folder} from 'lucide-react';
import { ManualSection } from '../../../../components/ui/manuales/ManualSection';
import { ManualAlert } from '../../../../components/ui/manuales/ManualAlert';
import { ManualBadge } from '../../../../components/ui/manuales/ManualBadge';

export const ManualPropiedadesDesktop: React.FC = () => {
  return (
    <div className="bg-slate-50 p-8 min-h-screen font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Manual de Propiedades e Inventario</h1>
          <p className="text-lg text-slate-500">Este documento detalla cómo manejar tu cartera de propiedades y los diferentes estados por los que puede pasar un inmueble.</p>
        </header>

        <ManualSection title="1. Estados Comerciales de una Propiedad" icon={<Tag className="w-6 h-6" />}>
          <p className="mb-4">Las propiedades pueden encontrarse en uno de los siguientes estados:</p>
          <ul className="grid grid-cols-2 gap-4 mb-6">
            <li className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <ManualBadge color="emerald">Disponible</ManualBadge>
              <span className="text-sm text-slate-600">Es el estado normal de una propiedad lista para ofrecer a tus clientes. Toda propiedad nueva ingresa así.</span>
            </li>
            <li className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <ManualBadge color="amber">Reservada</ManualBadge>
              <span className="text-sm text-slate-600">Un cliente ya dio un anticipo o separó la propiedad. No debemos ofrecerla a nadie más.</span>
            </li>
            <li className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <ManualBadge color="indigo">Vendida</ManualBadge>
              <span className="text-sm text-slate-600">La propiedad ya tiene un nuevo dueño.</span>
            </li>
            <li className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <ManualBadge color="sky">Alquilada</ManualBadge>
              <span className="text-sm text-slate-600">La propiedad está siendo ocupada por un inquilino durante su contrato.</span>
            </li>
            <li className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <ManualBadge color="slate">Inactiva</ManualBadge>
              <span className="text-sm text-slate-600">La propiedad ya no se puede ofrecer temporalmente.</span>
            </li>
          </ul>
          
          <ManualAlert title="Reglas de Cambio de Estado" variant="warning">
            <strong>No se puede reservar lo cerrado:</strong> Si una propiedad ya se vendió o alquiló, no puedes simplemente "reservarla" de nuevo. Primero tienes que volver a ponerla como "Disponible".
          </ManualAlert>
        </ManualSection>

        <ManualSection title="2. Gestión de Ciclo de Vida" icon={<RefreshCcw className="w-6 h-6" />}>
          <p className="mb-4">Existen dos flujos principales para que una propiedad cerrada o reservada vuelva al mercado:</p>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><XCircle className="w-5 h-5 text-rose-500" /> A. Cancelación de Trato (Negocio Caído)</h3>
              <p className="text-sm mb-4 text-slate-600">Pasa cuando un negocio no logra cerrarse, como cuando un cliente se arrepiente y cancela su reserva.</p>
              <ul className="list-disc pl-5 text-sm space-y-2 text-slate-700">
                <li><strong>El Trato:</strong> Se registra como cancelado en el historial para que lleves el control de lo que pasó.</li>
                <li><strong>El Cliente:</strong> 
                  <ul className="list-[circle] pl-5 mt-2 space-y-1 text-slate-500">
                    <li>Si tiene otras propiedades compradas/alquiladas, mantiene estado "Cerrado".</li>
                    <li>Si tiene otras propiedades reservadas, pasa a estado "En Negociación".</li>
                    <li>Si no tiene otros compromisos, retrocede automáticamente al estado "Contactado".</li>
                  </ul>
                </li>
                <li><strong>La Propiedad:</strong> Regresa al estado "Disponible".</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> B. Fin de Ciclo (Renovación)</h3>
              <p className="text-sm mb-4 text-slate-600">Sucede cuando, por ejemplo, un inquilino se muda porque terminó su contrato y el dueño quiere volver a alquilar la casa.</p>
              <ul className="list-disc pl-5 text-sm space-y-2 text-slate-700">
                <li><strong>El Trato:</strong> El trato de alquiler que acaba de terminar se guarda como un negocio concluido con éxito.</li>
                <li><strong>El Propietario:</strong> Si estaba "Inactivo", la propiedad vuelve a ofrecerse pero "Inactiva". Si estaba activo, la propiedad queda "Disponible".</li>
              </ul>
            </div>
          </div>
        </ManualSection>

        <ManualSection title="3. Seguridad y Privacidad" icon={<Shield className="w-6 h-6" />}>
          <p className="mb-4">El acceso y gestión de propiedades sigue un modelo estricto de visibilidad:</p>
          <ul className="space-y-4">
            <li className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl">
              <Lock className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" /> 
              <span className="text-sm text-slate-700"><strong>Visibilidad Privada:</strong> Solo podrás ver y editar tus propias propiedades y las de tu equipo directo, manteniendo la privacidad de la información.</span>
            </li>
            <li className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl">
              <Users className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" /> 
              <span className="text-sm text-slate-700"><strong>Trabajo en Equipo:</strong> Si registraste una propiedad a nombre de un compañero que aún no activa su cuenta, podrás gestionarla. Pero en cuanto ese compañero ingrese al sistema, él tomará el control exclusivo.</span>
            </li>
            <li className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl">
              <Archive className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" /> 
              <span className="text-sm text-slate-700"><strong>Propiedades Archivadas:</strong> Si archivaste una propiedad para no verla, no podrás cambiarle el estado a menos que la desarchives primero.</span>
            </li>
          </ul>
        </ManualSection>

        <ManualSection title="4. Registro de Propiedades (Captación)" icon={<FilePlus className="w-6 h-6" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><UserCheck className="w-5 h-5 text-sky-500" /> Asignación de Dueño</h4>
              <p className="text-sm text-slate-600">Cuando le asignas un dueño a una nueva propiedad, el sistema automáticamente lo marca como propietario.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><Hash className="w-5 h-5 text-sky-500" /> Código Único</h4>
              <p className="text-sm text-slate-600">El sistema le dará un número de referencia corto a cada casa (ej. PRO-A1B2C) para encontrarla rápidamente.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><UserPlus className="w-5 h-5 text-sky-500" /> Captador</h4>
              <p className="text-sm text-slate-600">Puedes indicar si la propiedad la conseguiste tú, si fue otro compañero, o registrar a alguien nuevo.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><Bot className="w-5 h-5 text-sky-500" /> Inteligencia Artificial</h4>
              <p className="text-sm text-slate-600">El asistente lee y aprende la propiedad en segundos para que luego puedas encontrarla describiéndola.</p>
            </div>
          </div>
        </ManualSection>

        <ManualSection title="5. Galería de Fotos" icon={<Camera className="w-6 h-6" />}>
          <ul className="space-y-4">
            <li className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl">
              <Folder className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" /> 
              <span className="text-sm text-slate-700"><strong>Secciones de Fotos:</strong> Puedes separar las fotos por zonas, como las del patio, las habitaciones o las áreas comunes.</span>
            </li>
            <li className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl">
              <ImageIcon className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" /> 
              <span className="text-sm text-slate-700"><strong>Foto Principal:</strong> Tú decides el orden de las secciones y eliges cuál será la foto principal que se verá como portada.</span>
            </li>
          </ul>
        </ManualSection>

        <ManualSection title="6. Bloqueo Administrativo (Congelar)" icon={<Lock className="w-6 h-6" />}>
          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-200/50 mt-6 space-y-3">
            <h3 className="font-bold text-blue-900 flex items-center gap-2"><Lock className="w-5 h-5 text-blue-600" /> Propiedades Congeladas (Almacenamiento Bloqueado)</h3>
            <p className="text-sm text-slate-700">El administrador del sistema tiene la capacidad de <strong>congelar</strong> propiedades en caso de que requieran revisión, investigación o como medida de control. Cuando una propiedad está congelada:</p>
            <ul className="text-sm text-slate-700 list-disc pl-5 space-y-2">
              <li><strong>Subida de imágenes:</strong> Queda deshabilitada temporalmente. No podrás agregar nuevas fotos.</li>
              <li><strong>Gestión de secciones:</strong> No podrás crear, editar ni organizar las secciones de la galería.</li>
              <li><strong>Generación de Fichas (PDF):</strong> La opción para generar la ficha técnica en PDF quedará bloqueada.</li>
            </ul>
          </div>
          <p className="text-sm text-indigo-800 font-semibold mt-4">
              Nota: Si tu propiedad ha sido congelada y necesitas hacer modificaciones, por favor contacta con la administración.
          </p>
        </ManualSection>
      </div>
    </div>
  );
};

