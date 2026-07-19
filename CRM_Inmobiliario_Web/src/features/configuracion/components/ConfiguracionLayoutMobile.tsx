import React from 'react';
import { Outlet } from 'react-router-dom';
import type { ConfiguracionLayoutLogicReturn } from '../hooks/useConfiguracionLayoutLogic';
import { HelpButton } from '../../../components/ui/HelpButton';

interface Props {
  logic: ConfiguracionLayoutLogicReturn;
}

export const ConfiguracionLayoutMobile: React.FC<Props> = ({ logic }) => {
  const { isAdmin, currentPath, handleMobileNavigation } = logic;

  return (
    <div className="flex flex-col min-h-screen w-full p-4">
      <header className="w-full mb-4 break-words">
        <div className="flex items-start gap-2">
          <h1 className="text-lg md:text-xl md:text-3xl font-black text-slate-900 tracking-tight italic">Panel de Control</h1>
          <div className="pt-1 shrink-0">
            <HelpButton title="Administración y Configuración" path="/docs/manuales/manual_administracion.md" />
          </div>
        </div>
        <p className="text-slate-500 font-medium mt-1">Gestiona tu configuración.</p>
      </header>

      <div className="w-full mb-4">
        <label htmlFor="mobile-nav" className="sr-only">Navegación</label>
        <div className="relative w-full">
          <select
            id="mobile-nav"
            value={currentPath}
            onChange={(e) => handleMobileNavigation(e.target.value)}
            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="perfil">Identidad</option>
            <option value="integracion-ia">IA y Límites</option>
            <option value="notificaciones">Notificaciones</option>
            <option value="auto-archivado">Auto-Archivado</option>
            <option value="portabilidad">Portabilidad</option>
            <option value="mi-suscripcion">Mi Suscripción</option>
            {isAdmin && (
              <>
                <option value="suscripciones">Suscripciones</option>
                <option value="ia">IA y Vectorización</option>
                <option value="organizacion">Organización</option>
                <option value="agentes">Agentes</option>
                <option value="agencias">Agencias</option>
                <option value="seguridad">Seguridad</option>
                <option value="limpieza">Congelar Prop.</option>
              </>
            )}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="w-full flex-1 animate-in fade-in duration-500">
        <Outlet />
      </div>
    </div>
  );
};
