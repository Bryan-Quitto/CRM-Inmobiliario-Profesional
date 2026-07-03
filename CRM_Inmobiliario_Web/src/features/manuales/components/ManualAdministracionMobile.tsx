import { ManualSection, ManualAlert, ManualBadge } from '../../../components/ui/manuales';
import { Users, ShieldCheck, Mail, MessageSquare, Brain, ShieldAlert, Key } from 'lucide-react';
import { FacebookIcon as Facebook } from '../../../components/ui/FacebookIcon';

export const ManualAdministracionMobile = () => {
  return (
    <div className="p-4 bg-slate-50 min-h-screen font-sans text-slate-800 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Administración</h1>
        <p className="text-sm text-slate-600">Agentes, IA y seguridad global</p>
      </div>

      <ManualSection title="1. Agentes y Perfiles" icon={<Users className="w-5 h-5 text-blue-600" />}>
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex items-start space-x-3">
            <Mail className="w-5 h-5 text-indigo-500 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">Invitaciones</h4>
              <p className="text-xs text-slate-600 mt-1">Activa mediante enlace seguro.</p>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">Acceso</h4>
              <p className="text-xs text-slate-600 mt-1">Suspende o activa agentes.</p>
            </div>
          </div>
        </div>
      </ManualSection>

      <ManualSection title="2. IA y Límites" icon={<Brain className="w-5 h-5 text-purple-600" />}>
         <div className="space-y-4">
           <div className="grid grid-cols-3 gap-2">
             <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm text-center">
               <Brain className="w-6 h-6 text-purple-500 mx-auto mb-1" />
               <p className="font-semibold text-slate-900 text-[10px]">Personal</p>
             </div>
             <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm text-center">
               <MessageSquare className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
               <p className="font-semibold text-slate-900 text-[10px]">WhatsApp</p>
             </div>
             <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm text-center">
               <Facebook className="w-6 h-6 text-blue-500 mx-auto mb-1" />
               <p className="font-semibold text-slate-900 text-[10px]">Facebook</p>
             </div>
           </div>

           <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Control</h4>
              <p className="text-xs text-slate-600">Personaliza la identidad y ajusta límites diarios (100k por defecto).</p>
           </div>
         </div>
      </ManualSection>

      <ManualSection title="3. Seguridad Global" icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}>
         <div className="flex flex-col space-y-3">
           <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
              <ManualBadge>Re-análisis IA</ManualBadge>
              <p className="text-xs text-slate-600 mt-1">Actualiza vectorización.</p>
           </div>
           <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
              <ManualBadge>Config. Propia</ManualBadge>
              <p className="text-xs text-slate-600 mt-1">Notificaciones y auto-archivo.</p>
           </div>
         </div>
      </ManualSection>

      <ManualSection title="4. Accesos Rápidos" icon={<Key className="w-5 h-5 text-amber-600" />}>
         <ManualAlert title="Plataforma Segura" description="Fácil login y recuperación de cuentas." />
      </ManualSection>
    </div>
  );
};
