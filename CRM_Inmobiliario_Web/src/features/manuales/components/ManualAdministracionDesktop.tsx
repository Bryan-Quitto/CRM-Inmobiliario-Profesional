import { ManualSection, ManualAlert, ManualBadge } from '../../../components/ui/manuales';
import { Users, ShieldCheck, Mail, UserPlus, MessageSquare, Globe, Brain, ShieldAlert, Key } from 'lucide-react';

export const ManualAdministracionDesktop = () => {
  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Manual de Administración y Seguridad</h1>
          <p className="text-lg text-slate-600">Gestión de agentes, IA y configuración global</p>
        </div>

        <ManualSection title="1. Gestión de Agentes y Perfiles" icon={<Users className="w-6 h-6 text-blue-600" />}>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="w-5 h-5 text-indigo-500" />
                <h4 className="font-semibold text-slate-900">Invitación & Activación</h4>
              </div>
              <p className="text-sm text-slate-600">Envía invitaciones por correo. Los agentes activan su cuenta con un enlace seguro.</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <h4 className="font-semibold text-slate-900">Control de Acceso</h4>
              </div>
              <p className="text-sm text-slate-600">Suspende o rehabilita el acceso de cualquier agente de forma instantánea.</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow col-span-2">
              <div className="flex items-center space-x-2 mb-2">
                <UserPlus className="w-5 h-5 text-emerald-500" />
                <h4 className="font-semibold text-slate-900">Perfiles Personalizados</h4>
              </div>
              <p className="text-sm text-slate-600">Cada usuario gestiona su información personal y foto de perfil fácilmente.</p>
            </div>
          </div>
        </ManualSection>

        <ManualSection title="2. Configuración de IA y Límites" icon={<Brain className="w-6 h-6 text-purple-600" />}>
           <div className="space-y-6">
             <div>
               <h4 className="font-bold text-slate-900 mb-3">Tipos de Asistente Inteligente</h4>
               <div className="grid grid-cols-3 gap-4">
                 <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center hover:shadow-md transition-shadow">
                   <Brain className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                   <p className="font-semibold text-slate-900 text-sm">IA Personal</p>
                   <p className="text-xs text-slate-600 mt-1">Asistente interno para el equipo.</p>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center hover:shadow-md transition-shadow">
                   <MessageSquare className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                   <p className="font-semibold text-slate-900 text-sm">IA WhatsApp</p>
                   <p className="text-xs text-slate-600 mt-1">Respuestas automáticas en WA.</p>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center hover:shadow-md transition-shadow">
                   <Globe className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                   <p className="font-semibold text-slate-900 text-sm">IA Globe</p>
                   <p className="text-xs text-slate-600 mt-1">Respuestas en FB Messenger.</p>
                 </div>
               </div>
             </div>

             <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <h4 className="font-semibold text-slate-900 mb-2">Límites y Personalización</h4>
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
                  <li><strong>Personalidad:</strong> Configura el tono y contexto en la pestaña "Identidad".</li>
                  <li><strong>Límites Diarios:</strong> Límite base de 100,000 interacciones, reinicio automático o manual por cliente.</li>
                </ul>
             </div>
           </div>
        </ManualSection>

        <ManualSection title="3. Administración Global y Seguridad" icon={<ShieldCheck className="w-6 h-6 text-emerald-600" />}>
           <div className="grid md:grid-cols-2 gap-4">
             <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <ManualBadge>Actualización IA</ManualBadge>
                <p className="text-sm text-slate-600 mt-3">Re-análisis de propiedades y documentos desde "IA y Vectorización".</p>
             </div>
             <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <ManualBadge>Config. Personal</ManualBadge>
                <p className="text-sm text-slate-600 mt-3">Gestión privada de notificaciones y auto-archivado por cada agente.</p>
             </div>
           </div>
        </ManualSection>

        <ManualSection title="4. Accesos Rápidos" icon={<Key className="w-6 h-6 text-amber-600" />}>
           <ManualAlert title="Plataforma Intuitiva" description="Pantallas fáciles de usar para inicio de sesión, recuperación de contraseñas y paneles de configuración de cuenta." />
        </ManualSection>
      </div>
    </div>
  );
};
